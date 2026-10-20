import { posService, type BatchSyncRequest, type BatchSyncResponse } from './posService';

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

export const offlineSyncManager = {
  getPendingQueue(): OfflinePendingTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_PENDING_TX);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueueTransaction(payload: any): OfflinePendingTransaction {
    const queue = this.getPendingQueue();
    const item: OfflinePendingTransaction = {
      id: payload.transactionUuid || `OFFLINE-TX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      payload: { ...payload, transactionUuid: payload.transactionUuid || `OFFLINE-TX-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
      retryCount: 0,
      status: 'PENDING',
    };
    queue.push(item);
    localStorage.setItem(STORAGE_PENDING_TX, JSON.stringify(queue));
    return item;
  },

  removePendingTransaction(id: string) {
    const queue = this.getPendingQueue().filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_PENDING_TX, JSON.stringify(queue));
  },

  clearQueue() {
    localStorage.removeItem(STORAGE_PENDING_TX);
  },

  getSyncHistory(): SyncHistoryLog[] {
    try {
      const data = localStorage.getItem(STORAGE_SYNC_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addSyncHistory(log: Omit<SyncHistoryLog, 'id' | 'timestamp'>): SyncHistoryLog {
    const history = this.getSyncHistory();
    const entry: SyncHistoryLog = {
      id: `SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    history.unshift(entry);
    // Keep max 50 entries
    if (history.length > 50) {
      history.length = 50;
    }
    localStorage.setItem(STORAGE_SYNC_HISTORY, JSON.stringify(history));
    return entry;
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_SYNC_HISTORY);
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
          const updatedQueue = this.getPendingQueue().filter((q) => !completedUuids.has(q.id) && !completedUuids.has(q.payload?.transactionUuid));
          localStorage.setItem(STORAGE_PENDING_TX, JSON.stringify(updatedQueue));
        }

        const status = response.failedCount === 0 ? 'SUCCESS' : (response.successfullyProcessed > 0 ? 'PARTIAL' : 'FAILED');
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
        lastError = err;
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
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
      failedReasons: [lastError?.message || 'Không thể kết nối đến máy chủ vệ tinh sau nhiều lần thử lại.'],
    });

    throw lastError || new Error('Đồng bộ thất bại sau số lần thử lại tối đa.');
  },
};
