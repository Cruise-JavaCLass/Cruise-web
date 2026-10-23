import {
  type QueuedTransactionRecord,
  posIndexedDb,
  generateSecureId,
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

const STORAGE_KEY_QUEUE = 'CRUISE_POS_OFFLINE_QUEUE';
const STORAGE_KEY_SEQ = 'CRUISE_POS_OFFLINE_SEQ';

class TransactionQueueEngine {
  private inMemoryQueue: QueuedTransactionRecord[] = [];
  private sequenceCounter = 0;
  private listeners: Set<QueueChangeListener> = new Set();
  private isFlushing = false;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Avoid asynchronous operations in constructor to comply with quality & security standards
  }

  private getNextSequence(): number {
    let nextSeq = (this.sequenceCounter || 0) + 1;
    try {
      const storedSeq = localStorage.getItem(STORAGE_KEY_SEQ);
      const parsedStored = storedSeq ? Number.parseInt(storedSeq, 10) : 0;
      if (Number.isFinite(parsedStored) && parsedStored >= nextSeq) {
        nextSeq = parsedStored + 1;
      }
      localStorage.setItem(STORAGE_KEY_SEQ, String(nextSeq));
    } catch {
      // fallback to in-memory counter
    }
    this.sequenceCounter = nextSeq;
    return nextSeq;
  }

  private validateFallbackRecord(
    item: unknown,
    index: number,
    baseSeq: number
  ): QueuedTransactionRecord | null {
    if (!item || typeof item !== 'object') {
      console.warn(`[QueueEngine] Skipping invalid fallback record at index ${index}: not an object`);
      return null;
    }

    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `TX-LEGACY-${Date.now()}-${index}`;

    const rawSeq = typeof raw.seq === 'number' && Number.isFinite(raw.seq)
      ? raw.seq
      : baseSeq + index + 1;

    const rawCreatedAt = typeof raw.createdAt === 'string' && raw.createdAt
      ? raw.createdAt
      : new Date().toISOString();

    const status: QueuedTransactionRecord['status'] =
      raw.status === 'PENDING' ||
      raw.status === 'STAGED' ||
      raw.status === 'SYNCING' ||
      raw.status === 'FAILED' ||
      raw.status === 'SYNCED'
        ? raw.status
        : 'PENDING';

    const retryCount =
      typeof raw.retryCount === 'number' && Number.isFinite(raw.retryCount) && raw.retryCount >= 0
        ? raw.retryCount
        : 0;

    const payload = raw.payload && typeof raw.payload === 'object'
      ? (raw.payload as Record<string, unknown>)
      : {};

    const rawAmount = typeof raw.totalAmount === 'number' && Number.isFinite(raw.totalAmount)
      ? raw.totalAmount
      : (typeof payload.totalAmount === 'number' && Number.isFinite(payload.totalAmount)
          ? payload.totalAmount
          : 0);

    const stationId = typeof raw.stationId === 'string' && raw.stationId
      ? raw.stationId
      : (typeof payload.stationId === 'string' && payload.stationId ? payload.stationId : 'OFFLINE');

    const cashierId = typeof raw.cashierId === 'string' && raw.cashierId
      ? raw.cashierId
      : (typeof payload.cashierId === 'string' && payload.cashierId ? payload.cashierId : 'CASHIER');

    return {
      id,
      seq: rawSeq,
      createdAt: rawCreatedAt,
      status,
      retryCount,
      payload,
      totalAmount: rawAmount,
      stationId,
      cashierId,
    };
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

        // Reconcile fallback records from localStorage with item-by-item validation
        try {
          const fallbackData = localStorage.getItem(STORAGE_KEY_QUEUE);
          if (fallbackData) {
            const parsed = JSON.parse(fallbackData);
            if (Array.isArray(parsed)) {
              for (let idx = 0; idx < parsed.length; idx++) {
                try {
                  const validated = this.validateFallbackRecord(parsed[idx], idx, records.length);
                  if (!validated) continue;

                  const existing = records.find((r) => r.id === validated.id);
                  if (!existing) {
                    records.push(validated);
                    if (posIndexedDb.isSupported()) {
                      try {
                        await posIndexedDb.saveTransaction(validated);
                      } catch {
                        // ignore save error during recovery
                      }
                    }
                  }
                } catch (recErr) {
                  console.warn(`[QueueEngine] Error validating fallback record at index ${idx}:`, recErr);
                }
              }
            }
          }
        } catch (e) {
          console.warn('[QueueEngine] Fallback queue JSON parsing error:', e);
        }

        this.inMemoryQueue = records.sort((a, b) => a.seq - b.seq);
        if (this.inMemoryQueue.length > 0) {
          const maxSeq = Math.max(...this.inMemoryQueue.map((r) => r.seq));
          this.sequenceCounter = Math.max(maxSeq, this.sequenceCounter);
        }

        try {
          const storedSeq = localStorage.getItem(STORAGE_KEY_SEQ);
          if (storedSeq) {
            const parsedSeq = Number.parseInt(storedSeq, 10);
            if (Number.isFinite(parsedSeq) && parsedSeq > this.sequenceCounter) {
              this.sequenceCounter = parsedSeq;
            }
          }
        } catch {
          // ignore
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
    void this.initialize().then(() => {
      listener([...this.inMemoryQueue]);
    });
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
    if (!this.isInitialized && !this.initPromise) {
      void this.initialize();
    }
    return [...this.inMemoryQueue];
  }

  public getPendingCount(): number {
    return this.inMemoryQueue.filter((t) => t.status !== 'SYNCED').length;
  }

  private persistToLocalStorageFallback(record: QueuedTransactionRecord): void {
    try {
      let existing: QueuedTransactionRecord[] = [];
      const stored = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            existing = parsed.filter(
              (r): r is QueuedTransactionRecord => Boolean(r && typeof r === 'object' && typeof (r as QueuedTransactionRecord).id === 'string')
            );
          }
        } catch {
          existing = [];
        }
      }

      // Merge current memory queue and existing storage by unique id to coordinate across tabs
      const mergedMap = new Map<string, QueuedTransactionRecord>();
      for (const item of existing) {
        mergedMap.set(item.id, item);
      }
      for (const item of this.inMemoryQueue) {
        mergedMap.set(item.id, item);
      }
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => a.seq - b.seq);
      localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(mergedList));
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
      generateSecureId('TX-OFFLINE');

    // Reject conflicting enqueues with the same transaction UUID or return identical retry
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
        `Conflicting transaction enqueue: UUID '${txUuid}' is already queued with a different payload.`
      );
    }

    const nextSeq = this.getNextSequence();

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
   * Remove transaction from queue after successful sync, surfacing local deletion failures
   */
  public async dequeue(id: string): Promise<void> {
    // If IndexedDB is supported, attempt persistent deletion first
    if (posIndexedDb.isSupported()) {
      try {
        await posIndexedDb.deleteTransaction(id);
        await posIndexedDb.recordAuditLog('DEQUEUE_TX', `Dequeued txUuid=${id}`);
      } catch (e) {
        // Mark transaction as SYNCED to prevent duplicate dispatch, but retain error state in memory
        const target = this.inMemoryQueue.find((t) => t.id === id);
        if (target) {
          target.status = 'SYNCED';
          target.lastError = `Xóa IndexedDB thất bại: ${e instanceof Error ? e.message : String(e)}`;
          this.notifyListeners();
        }
        throw new Error(`Failed to remove transaction '${id}' from IndexedDB: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Clean up fallback localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUEUE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t: { id?: string }) => t.id !== id);
          if (filtered.length > 0) {
            localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(filtered));
          } else {
            localStorage.removeItem(STORAGE_KEY_QUEUE);
          }
        }
      }
    } catch {
      // ignore fallback cleanup
    }

    // Deletion from storage succeeded; remove from memory
    this.inMemoryQueue = this.inMemoryQueue.filter((t) => t.id !== id);
    this.notifyListeners();
  }

  public async clearAll(): Promise<void> {
    if (posIndexedDb.isSupported()) {
      await posIndexedDb.clearTransactions();
    }
    try {
      localStorage.removeItem(STORAGE_KEY_QUEUE);
      localStorage.removeItem(STORAGE_KEY_SEQ);
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
        // Skip records removed by dequeue()/clearAll() after the snapshot was taken
        if (!this.inMemoryQueue.includes(item)) continue;
        item.status = 'SYNCING';
        item.lastAttemptAt = new Date().toISOString();
        this.notifyListeners();

        try {
          // Attempt dispatch to backend with transactionUuid idempotency
          await posService.createTransaction(
            item.payload as unknown as Parameters<typeof posService.createTransaction>[0],
            item.id
          );

          try {
            await this.dequeue(item.id);
            succeeded += 1;
          } catch (dequeueErr) {
            failed += 1;
            const dMsg = dequeueErr instanceof Error ? dequeueErr.message : String(dequeueErr);
            errors.push(`Giao dịch ${item.id} đã gửi thành công nhưng xóa bộ nhớ cục bộ thất bại: ${dMsg}`);
            // Stop dispatch to inspect storage health
            break;
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
