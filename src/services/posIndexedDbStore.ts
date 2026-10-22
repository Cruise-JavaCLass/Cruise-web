/**
 * IndexedDB Offline Database Store for Cruise POS
 * Schema Version: 1
 * Stores:
 *  - transactions: queued offline transactions with FIFO index on seq/createdAt
 *  - catalog: cached product catalog and categories for offline lookup
 *  - auditLogs: offline mutation logs and sync checkpoints
 */

export interface QueuedTransactionRecord {
  id: string; // client UUID (idempotency key)
  seq: number; // strictly monotonic FIFO ordering sequence
  createdAt: string;
  status: 'PENDING' | 'STAGED' | 'SYNCING' | 'FAILED' | 'SYNCED';
  retryCount: number;
  lastAttemptAt?: string;
  lastError?: string;
  payload: Record<string, unknown>;
  totalAmount: number;
  stationId: string;
  cashierId: string;
}

export interface CatalogCacheRecord {
  id: string;
  type: 'OUTLETS' | 'CATEGORIES' | 'PRODUCTS';
  cachedAt: string;
  data: unknown;
}

export interface OfflineAuditLogRecord {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

const DB_NAME = 'CruisePosOfflineDB';
const DB_VERSION = 1;

export const STORE_TRANSACTIONS = 'transactions';
export const STORE_CATALOG = 'catalog';
export const STORE_AUDIT_LOGS = 'auditLogs';

export class PosIndexedDbStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Transactions Store with FIFO ordering index
        if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
          const txStore = db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
          txStore.createIndex('idx_seq', 'seq', { unique: true });
          txStore.createIndex('idx_status', 'status', { unique: false });
          txStore.createIndex('idx_createdAt', 'createdAt', { unique: false });
        }

        // Catalog Store for offline pricing & categories
        if (!db.objectStoreNames.contains(STORE_CATALOG)) {
          db.createObjectStore(STORE_CATALOG, { keyPath: 'id' });
        }

        // Audit Logs Store for non-repudiation
        if (!db.objectStoreNames.contains(STORE_AUDIT_LOGS)) {
          const auditStore = db.createObjectStore(STORE_AUDIT_LOGS, { keyPath: 'id' });
          auditStore.createIndex('idx_timestamp', 'timestamp', { unique: false });
        }
      };

      req.onsuccess = () => {
        resolve(req.result);
      };

      req.onerror = () => {
        this.dbPromise = null;
        reject(req.error || new Error('Failed to open IndexedDB'));
      };

      req.onblocked = () => {
        console.warn('IndexedDB upgrade blocked by older open connection');
      };
    });

    return this.dbPromise;
  }

  public async close(): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      db.close();
      this.dbPromise = null;
    }
  }

  // --- Transactions Store (FIFO) ---

  public async saveTransaction(record: QueuedTransactionRecord): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getAllTransactions(): Promise<QueuedTransactionRecord[]> {
    const db = await this.getDb();
    return new Promise<QueuedTransactionRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readonly');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const index = store.index('idx_seq');
      const req = index.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async deleteTransaction(id: string): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearTransactions(): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Catalog Cache Store ---

  public async saveCatalogCache(record: CatalogCacheRecord): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      const store = tx.objectStore(STORE_CATALOG);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getCatalogCache<T>(id: string): Promise<T | null> {
    const db = await this.getDb();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readonly');
      const store = tx.objectStore(STORE_CATALOG);
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data as T);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // --- Audit Logs Store ---

  public async recordAuditLog(action: string, details: string): Promise<void> {
    try {
      const db = await this.getDb();
      const tx = db.transaction(STORE_AUDIT_LOGS, 'readwrite');
      const store = tx.objectStore(STORE_AUDIT_LOGS);
      const record: OfflineAuditLogRecord = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        timestamp: new Date().toISOString(),
        details,
      };
      store.put(record);
    } catch (e) {
      console.warn('Failed to record offline audit log:', e);
    }
  }
}

export const posIndexedDb = new PosIndexedDbStore();
