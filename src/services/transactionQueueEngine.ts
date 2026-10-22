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

  constructor() {
    // Attempt recovery on instantiate
    void this.initialize();
  }

  public async initialize(forceReload: boolean = false): Promise<void> {
    if (this.isInitialized && !forceReload) return;
    try {
      const records = await posIndexedDb.getAllTransactions();
      this.inMemoryQueue = records.sort((a, b) => a.seq - b.seq);
      if (this.inMemoryQueue.length > 0) {
        this.sequenceCounter = Math.max(...this.inMemoryQueue.map((r) => r.seq));
      }
      this.isInitialized = true;
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to load transaction queue from IndexedDB:', e);
      // Fallback: check localStorage for legacy queue
      try {
        const legacy = localStorage.getItem('CRUISE_POS_OFFLINE_QUEUE');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) {
            this.inMemoryQueue = parsed.map((item, idx) => ({
              id: item.id || `TX-LEGACY-${idx}`,
              seq: idx + 1,
              createdAt: item.createdAt || new Date().toISOString(),
              status: item.status || 'PENDING',
              retryCount: item.retryCount || 0,
              payload: item.payload || {},
              totalAmount: item.payload?.totalAmount || 0,
              stationId: item.payload?.stationId || 'OFFLINE',
              cashierId: item.payload?.cashierId || 'CASHIER',
            }));
            this.sequenceCounter = this.inMemoryQueue.length;
          }
        }
      } catch {
        // ignore
      }
      this.isInitialized = true;
      this.notifyListeners();
    }
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

    this.inMemoryQueue.push(record);
    this.notifyListeners();

    try {
      await posIndexedDb.saveTransaction(record);
      await posIndexedDb.recordAuditLog('ENQUEUE_TX', `Enqueued txUuid=${txUuid}, amount=$${totalAmount}`);
    } catch (e) {
      console.warn('Failed to persist transaction to IndexedDB, fallback to memory/localStorage:', e);
      try {
        localStorage.setItem('CRUISE_POS_OFFLINE_QUEUE', JSON.stringify(this.inMemoryQueue));
      } catch {
        // storage quota exceeded
      }
    }

    return record;
  }

  /**
   * Remove transaction from queue after successful sync
   */
  public async dequeue(id: string): Promise<void> {
    this.inMemoryQueue = this.inMemoryQueue.filter((t) => t.id !== id);
    this.notifyListeners();

    try {
      await posIndexedDb.deleteTransaction(id);
      await posIndexedDb.recordAuditLog('DEQUEUE_TX', `Dequeued txUuid=${id}`);
    } catch (e) {
      console.warn('Failed to delete transaction from IndexedDB:', e);
    }
  }

  public async clearAll(): Promise<void> {
    this.inMemoryQueue = [];
    this.sequenceCounter = 0;
    this.notifyListeners();

    try {
      await posIndexedDb.clearTransactions();
      localStorage.removeItem('CRUISE_POS_OFFLINE_QUEUE');
    } catch (e) {
      console.warn('Failed to clear IndexedDB:', e);
    }
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
          try {
            await posIndexedDb.saveTransaction(item);
          } catch {
            // ignore
          }
          this.notifyListeners();
        }
      }
    } finally {
      this.isFlushing = false;
    }

    return { succeeded, failed, errors };
  }
}

export const transactionQueueEngine = new TransactionQueueEngine();
