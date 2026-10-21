import { type BatchSyncRequest, type BatchSyncResponse, posService } from './posService';

export interface OfflinePendingTransaction {
  id: string; // local client UUID
  createdAt: string;
  payload: any;
  retryCount: number;
  lastAttemptAt?: string;
  lastError?: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'SYNCED';
}

export interface SyncHistoryLog {
  id: string;
  timestamp: string;
  deviceId: string;
  totalReceived: number;
  successfullyProcessed: number;
  duplicateCount: number;
  failedCount: number;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  failedReasons?: string[];
}

const STORAGE_PENDING_TX = 'CRUISE_POS_OFFLINE_QUEUE';
const STORAGE_SYNC_HISTORY = 'CRUISE_POS_SYNC_HISTORY';

export class StoragePersistenceError extends Error {
  constructor(
    message: string = 'Không thể lưu trữ trạng thái hàng đợi ngoại tuyến vào bộ nhớ cục bộ.'
  ) {
    super(message);
    this.name = 'StoragePersistenceError';
  }
}

function safeStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to write to localStorage for key "${key}":`, error);
    return false;
  }
}

function generateRandomSuffix(length: number = 5): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, length).toUpperCase();
  }
  return Date.now().toString(36).slice(-length).toUpperCase();
}

export const offlineSyncManager = {
  getPendingQueue(): OfflinePendingTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_PENDING_TX);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) => item && typeof item === 'object' && typeof item.id === 'string'
      );
    } catch {
      return [];
    }
  },

  enqueueTransaction(payload: any): OfflinePendingTransaction {
    const queue = this.getPendingQueue();
    const item: OfflinePendingTransaction = {
      id: payload.transactionUuid || `OFFLINE-TX-${Date.now()}-${generateRandomSuffix(5)}`,
      createdAt: new Date().toISOString(),
      payload: {
        ...payload,
        transactionUuid:
          payload.transactionUuid || `OFFLINE-TX-${Date.now()}-${generateRandomSuffix(5)}`,
      },
      retryCount: 0,
      status: 'PENDING',
    };
    queue.push(item);
    safeStorageSet(STORAGE_PENDING_TX, JSON.stringify(queue));
    return item;
  },

  removePendingTransaction(id: string) {
    const queue = this.getPendingQueue().filter((q) => q.id !== id);
    safeStorageSet(STORAGE_PENDING_TX, JSON.stringify(queue));
  },

  clearQueue() {
    try {
      localStorage.removeItem(STORAGE_PENDING_TX);
    } catch (error) {
      console.error('Failed to remove pending queue from localStorage:', error);
    }
  },

  getSyncHistory(): SyncHistoryLog[] {
    try {
      const data = localStorage.getItem(STORAGE_SYNC_HISTORY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item) => item && typeof item === 'object' && typeof item.id === 'string'
      );
    } catch {
      return [];
    }
  },

  addSyncHistory(log: Omit<SyncHistoryLog, 'id' | 'timestamp'>): SyncHistoryLog {
    const history = this.getSyncHistory();
    const entry: SyncHistoryLog = {
      id: `SYNC-${Date.now()}-${generateRandomSuffix(4)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    history.unshift(entry);
    // Keep max 50 entries
    if (history.length > 50) {
      history.length = 50;
    }
    safeStorageSet(STORAGE_SYNC_HISTORY, JSON.stringify(history));
    return entry;
  },

  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_SYNC_HISTORY);
    } catch (error) {
      console.error('Failed to remove sync history from localStorage:', error);
    }
  },

  /**
   * Exponential backoff sync:
   * Retries each network request up to maxRetries times with exponential delay (baseDelayMs * 2^(attempt-1)).
   */
  async syncBatchWithRetry(
    deviceId: string = 'POS-TERMINAL-DECK-9',
    maxRetries: number = 3,
    baseDelayMs: number = 500
  ): Promise<BatchSyncResponse> {
    const queue = this.getPendingQueue().filter((t) => t.status !== 'SYNCED');
    const transactions = queue.map((q) => q.payload);

    if (transactions.length === 0) {
      return {
        deviceId,
        totalReceived: 0,
        successfullyProcessed: 0,
        duplicateCount: 0,
        failedCount: 0,
        processedUuids: [],
        duplicateUuids: [],
        failedReasons: [],
      };
    }

    const batchRequest: BatchSyncRequest = {
      deviceId,
      clientSyncTimestamp: new Date().toISOString(),
      transactions,
    };

    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      try {
        attempt++;
        const response = await posService.syncOfflineBatch(batchRequest);

        // Remove processed & duplicated UUIDs from local pending queue
        const completedUuids = new Set([
          ...(response.processedUuids || []),
          ...(response.duplicateUuids || []),
        ]);

        if (completedUuids.size > 0) {
          const updatedQueue = this.getPendingQueue().filter(
            (q) => !completedUuids.has(q.id) && !completedUuids.has(q.payload?.transactionUuid)
          );
          const saved = safeStorageSet(STORAGE_PENDING_TX, JSON.stringify(updatedQueue));
          if (!saved) {
            throw new StoragePersistenceError();
          }
        }

        const status =
          response.failedCount === 0
            ? 'SUCCESS'
            : response.successfullyProcessed > 0
              ? 'PARTIAL'
              : 'FAILED';
        this.addSyncHistory({
          deviceId,
          totalReceived: response.totalReceived,
          successfullyProcessed: response.successfullyProcessed,
          duplicateCount: response.duplicateCount,
          failedCount: response.failedCount,
          status,
          failedReasons: response.failedReasons,
        });

        return response;
      } catch (err: any) {
        if (err instanceof StoragePersistenceError) {
          throw err;
        }
        lastError = err;
        if (attempt < maxRetries) {
          const delay = baseDelayMs * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed due to network / connection error
    this.addSyncHistory({
      deviceId,
      totalReceived: transactions.length,
      successfullyProcessed: 0,
      duplicateCount: 0,
      failedCount: transactions.length,
      status: 'FAILED',
      failedReasons: [
        lastError?.message || 'Không thể kết nối đến máy chủ vệ tinh sau nhiều lần thử lại.',
      ],
    });

    throw lastError || new Error('Đồng bộ thất bại sau số lần thử lại tối đa.');
  },
};
