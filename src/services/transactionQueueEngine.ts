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

function isValidFallbackItem(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  if (typeof obj.id !== 'string' || !obj.id.trim()) return false;
  const amt = Number(obj.totalAmount ?? (obj.payload as Record<string, unknown> | undefined)?.totalAmount);
  if (isNaN(amt) || !isFinite(amt)) return false;
  if (obj.payload !== undefined && (typeof obj.payload !== 'object' || obj.payload === null)) {
    return false;
  }
  return true;
}

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
                const rawItem = parsed[idx];
                if (!isValidFallbackItem(rawItem)) {
                  console.warn(`Skipping invalid offline queue record at index ${idx}:`, rawItem);
                  continue;
                }
                const item = rawItem;
                const existing = records.find((r) => r.id === item.id);
                if (!existing) {
                  const amt = Number(item.totalAmount ?? (item.payload as Record<string, unknown>)?.totalAmount ?? 0);
                  const reconciledRecord: QueuedTransactionRecord = {
                    id: String(item.id),
                    seq: typeof item.seq === 'number' ? item.seq : (records.length + idx + 1),
                    createdAt: (item.createdAt as string) || new Date().toISOString(),
                    status: (item.status as QueuedTransactionRecord['status']) || 'PENDING',
                    retryCount: Number(item.retryCount || 0),
                    payload: (item.payload as Record<string, unknown>) || {},
                    totalAmount: amt,
                    stationId: (item.stationId as string) || ((item.payload as Record<string, unknown>)?.stationId as string) || 'OFFLINE',
                    cashierId: (item.cashierId as string) || ((item.payload as Record<string, unknown>)?.cashierId as string) || 'CASHIER',
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

  private allocateNextSequence(): number {
    let maxSeq = this.sequenceCounter;
    for (const r of this.inMemoryQueue) {
      if (typeof r.seq === 'number' && r.seq > maxSeq) {
        maxSeq = r.seq;
      }
    }

    try {
      const storedSeq = parseInt(localStorage.getItem('CRUISE_POS_SEQ_COUNTER') || '0', 10);
      if (!isNaN(storedSeq) && storedSeq > maxSeq) {
        maxSeq = storedSeq;
      }
    } catch {
      // ignore
    }

    const nextSeq = maxSeq + 1;
    this.sequenceCounter = nextSeq;

    try {
      localStorage.setItem('CRUISE_POS_SEQ_COUNTER', String(nextSeq));
    } catch {
      // ignore
    }

    return nextSeq;
  }

  private persistToLocalStorageFallback(record: QueuedTransactionRecord): void {
    try {
      const raw = localStorage.getItem('CRUISE_POS_OFFLINE_QUEUE');
      let sharedQueue: QueuedTransactionRecord[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            sharedQueue = parsed.filter(isValidFallbackItem) as unknown as QueuedTransactionRecord[];
          }
        } catch {
          // ignore parsing error
        }
      }

      // Merge record into sharedQueue preserving other tabs' records
      const existingIdx = sharedQueue.findIndex((t) => t.id === record.id);
      if (existingIdx >= 0) {
        sharedQueue[existingIdx] = record;
      } else {
        sharedQueue.push(record);
      }
      sharedQueue.sort((a, b) => a.seq - b.seq);

      localStorage.setItem('CRUISE_POS_OFFLINE_QUEUE', JSON.stringify(sharedQueue));
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

    const txUuid =
      (payload.transactionUuid as string) ||
      `TX-OFFLINE-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Check for existing record with identical UUID
    const existing = this.inMemoryQueue.find((t) => t.id === txUuid);
    if (existing) {
      const isIdentical =
        existing.totalAmount === totalAmount &&
        existing.stationId === stationId &&
        existing.cashierId === cashierId;
      if (isIdentical) {
        return existing;
      }
      throw new Error(
        `Conflicting enqueue rejected: transaction UUID ${txUuid} already exists with different details.`
      );
    }

    const nextSeq = this.allocateNextSequence();

    const record: QueuedTransactionRecord = {
      id: txUuid,
      seq: nextSeq,
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
      } catch (e: unknown) {
        // If unique seq index conflict occurred due to concurrent tab write, coordinate and retry once
        if (e && typeof e === 'object' && (e as { name?: string }).name === 'ConstraintError') {
          try {
            const all = await posIndexedDb.getAllTransactions();
            const maxDbSeq = all.length > 0 ? Math.max(...all.map((r) => r.seq)) : 0;
            record.seq = Math.max(record.seq, maxDbSeq) + 1;
            await posIndexedDb.saveTransaction(record);
            await posIndexedDb.recordAuditLog('ENQUEUE_TX', `Enqueued txUuid=${txUuid}, amount=$${totalAmount}`);
            return record;
          } catch (retryErr) {
            console.warn('Retry saveTransaction failed, falling back to localStorage:', retryErr);
          }
        }
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
    const item = this.inMemoryQueue.find((t) => t.id === id);

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
        console.error(`Failed to delete transaction ${id} from IndexedDB:`, e);
        if (item) {
          item.status = 'SYNCED';
          item.lastError = 'IndexedDB deletion failed after sync';
          this.notifyListeners();
        }
        throw new Error(
          `Failed to delete transaction ${id} from IndexedDB after successful sync: ${e}`
        );
      }
    }

    this.inMemoryQueue = this.inMemoryQueue.filter((t) => t.id !== id);
    this.notifyListeners();
  }

  public async clearAll(): Promise<void> {
    if (posIndexedDb.isSupported()) {
      await posIndexedDb.clearTransactions();
    }
    try {
      localStorage.removeItem('CRUISE_POS_OFFLINE_QUEUE');
      localStorage.removeItem('CRUISE_POS_SEQ_COUNTER');
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
          try {
            await this.dequeue(item.id);
          } catch (delErr) {
            console.warn(`Local deletion for transaction ${item.id} failed after sync:`, delErr);
          }
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
