import {
  type QueuedTransactionRecord,
  posIndexedDb,
} from './posIndexedDbStore';
import { posService } from './posService';

export type QueueEngineStatus = 'IDLE' | 'STAGING' | 'FLUSHING' | 'RECOVERING';

export interface OptimisticCartMutation {
  type: 'ADD_ITEM' | 'REMOVE_ITEM' | 'CLEAR';
  timestamp: string;
  itemId?: string;
  quantity?: number;
}

export type QueueChangeListener = (queue: QueuedTransactionRecord[]) => void;

class TransactionQueueEngine {
  private inMemoryQueue: QueuedTransactionRecord[] = [];
  private sequenceCounter = 0;
  private listeners: Set<QueueChangeListener> = new Set();
  private isFlushing = false;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Attempt recovery on instantiate
    void this.initialize();
  }

  public async initialize(forceReload: boolean = false): Promise<void> {
    if (this.isInitialized && !forceReload) return;
    if (this.initPromise && !forceReload) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        let records: QueuedTransactionRecord[] = [];
        if (posIndexedDb.isSupported()) {
          try {
            records = await posIndexedDb.getAllTransactions();
          } catch (e) {
            console.warn('Failed to load transaction queue from IndexedDB:', e);
          }
        }

        // Reconcile fallback records from localStorage
        try {
          const fallbackData = localStorage.getItem('CRUISE_POS_OFFLINE_QUEUE');
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed)) {
              for (let idx = 0; idx < parsed.length; idx++) {
                const item = parsed[idx];
                const existing = records.find((r) => r.id === item.id);
                if (!existing) {
                  const reconciledRecord: QueuedTransactionRecord = {
                    id: item.id || `TX-LEGACY-${idx}`,
                    seq: item.seq || (records.length + idx + 1),
                    createdAt: item.createdAt || new Date().toISOString(),
                    status: item.status || 'PENDING',
                    retryCount: item.retryCount || 0,
                    payload: item.payload || {},
                    totalAmount: item.totalAmount || item.payload?.totalAmount || 0,
                    stationId: item.stationId || item.payload?.stationId || 'OFFLINE',
                    cashierId: item.cashierId || item.payload?.cashierId || 'CASHIER',
                  };
                  records.push(reconciledRecord);
                  if (posIndexedDb.isSupported()) {
                    try {
                      await posIndexedDb.saveTransaction(reconciledRecord);
                    } catch {
                      // ignore
                    }
                  }
                }
              }
            }
          }
        } catch {
          // ignore fallback reconciliation parsing error
        }

        this.inMemoryQueue = records.sort((a, b) => a.seq - b.seq);
        if (this.inMemoryQueue.length > 0) {
          this.sequenceCounter = Math.max(...this.inMemoryQueue.map((r) => r.seq));
        } else {
          this.sequenceCounter = 0;
        }
        this.isInitialized = true;
        this.notifyListeners();
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  public subscribe(listener: QueueChangeListener): () => void {
    this.listeners.add(listener);
    listener([...this.inMemoryQueue]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const copy = [...this.inMemoryQueue];
    for (const listener of this.listeners) {
      try {
        listener(copy);
      } catch (err) {
        console.error('Error in queue subscriber listener:', err);
      }
    }
  }

  public getQueue(): QueuedTransactionRecord[] {
    return [...this.inMemoryQueue];
  }

  public getPendingCount(): number {
    return this.inMemoryQueue.filter((t) => t.status !== 'SYNCED').length;
  }

  private persistToLocalStorageFallback(record: QueuedTransactionRecord): void {
    try {
      localStorage.setItem('CRUISE_POS_OFFLINE_QUEUE', JSON.stringify(this.inMemoryQueue));
    } catch (storageErr) {
      this.inMemoryQueue = this.inMemoryQueue.filter((t) => t.id !== record.id);
      this.notifyListeners();
      throw new Error(
        `Durable persistence failed for offline transaction ${record.id}: both IndexedDB and localStorage storage failed.`
      );
    }
  }

  /**
   * Enqueue a transaction with strict FIFO ordering and idempotent UUID
   */
  public async enqueue(
    payload: Record<string, unknown>,
    totalAmount: number,
    stationId: string,
    cashierId: string
  ): Promise<QueuedTransactionRecord> {
    await this.initialize();
    this.sequenceCounter += 1;

    const txUuid =
      (payload.transactionUuid as string) ||
      `TX-OFFLINE-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const record: QueuedTransactionRecord = {
      id: txUuid,
      seq: this.sequenceCounter,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
      payload: {
        ...payload,
        transactionUuid: txUuid,
      },
      totalAmount,
      stationId,
      cashierId,
    };

    // Projected storage check for localStorage quota safety
    const projectedQueue = [...this.inMemoryQueue, record];
    try {
      const projectedStr = JSON.stringify(projectedQueue);
      if (projectedStr.length > 4 * 1024 * 1024) {
        console.warn('Warning: Stored offline transaction payload is approaching localStorage quota (4MB+).');
      }
    } catch {
      // ignore serialization check
    }

    this.inMemoryQueue.push(record);
    this.notifyListeners();

    if (posIndexedDb.isSupported()) {
      try {
        await posIndexedDb.saveTransaction(record);
        await posIndexedDb.recordAuditLog('ENQUEUE_TX', `Enqueued txUuid=${txUuid}, amount=$${totalAmount}`);
      } catch (e) {
        console.warn('Failed to persist transaction to IndexedDB, fallback to localStorage:', e);
        this.persistToLocalStorageFallback(record);
      }
    } else {
      this.persistToLocalStorageFallback(record);
    }

    return record;
  }

  /**
   * Remove transaction from queue after successful sync
   */
  public async dequeue(id: string): Promise<void> {
    this.inMemoryQueue = this.inMemoryQueue.filter((t) => t.id !== id);
    this.notifyListeners();

    // Update fallback storage snapshot to remove synced transaction
    try {
      const stored = localStorage.getItem('CRUISE_POS_OFFLINE_QUEUE');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t: { id?: string }) => t.id !== id);
          if (filtered.length > 0) {
            localStorage.setItem('CRUISE_POS_OFFLINE_QUEUE', JSON.stringify(filtered));
          } else {
            localStorage.removeItem('CRUISE_POS_OFFLINE_QUEUE');
          }
        }
      }
    } catch {
      // ignore
    }

    if (posIndexedDb.isSupported()) {
      try {
        await posIndexedDb.deleteTransaction(id);
        await posIndexedDb.recordAuditLog('DEQUEUE_TX', `Dequeued txUuid=${id}`);
      } catch (e) {
        console.warn('Failed to delete transaction from IndexedDB:', e);
      }
    }
  }

  public async clearAll(): Promise<void> {
    if (posIndexedDb.isSupported()) {
      await posIndexedDb.clearTransactions();
    }
    try {
      localStorage.removeItem('CRUISE_POS_OFFLINE_QUEUE');
    } catch (err) {
      console.warn('Failed to clear fallback localStorage:', err);
      throw err;
    }

    this.inMemoryQueue = [];
    this.sequenceCounter = 0;
    this.notifyListeners();
  }

  /**
   * Manual or automatic flush engine: processes queued transactions in strict FIFO sequence
   */
  public async flushQueue(): Promise<{ succeeded: number; failed: number; errors: string[] }> {
    if (this.isFlushing) {
      return { succeeded: 0, failed: 0, errors: ['Flush operation is already in progress'] };
    }

    this.isFlushing = true;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Sort strictly by sequence
      const pendingItems = [...this.inMemoryQueue]
        .filter((t) => t.status === 'PENDING' || t.status === 'FAILED')
        .sort((a, b) => a.seq - b.seq);

      for (const item of pendingItems) {
        item.status = 'SYNCING';
        item.lastAttemptAt = new Date().toISOString();
        this.notifyListeners();

        try {
          // Attempt dispatch to backend with transactionUuid idempotency
          await posService.createTransaction(
            item.payload as unknown as Parameters<typeof posService.createTransaction>[0],
            item.id
          );

          succeeded += 1;
          await this.dequeue(item.id);
        } catch (err: unknown) {
          failed += 1;
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            (err as Error)?.message ||
            'Mạng lỗi hoặc không thể kết nối tới server';

          item.status = 'FAILED';
          item.retryCount += 1;
          item.lastError = msg;
          errors.push(`Giao dịch ${item.id}: ${msg}`);

          // Save failure status
          if (posIndexedDb.isSupported()) {
            try {
              await posIndexedDb.saveTransaction(item);
            } catch {
              // ignore
            }
          }
          this.notifyListeners();

          // Stop dispatch after a failed FIFO transaction to maintain strict sequential execution
          break;
        }
      }
    } finally {
      this.isFlushing = false;
    }

    return { succeeded, failed, errors };
  }
}

export const transactionQueueEngine = new TransactionQueueEngine();
