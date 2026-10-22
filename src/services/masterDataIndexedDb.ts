/**
 * IndexedDB Master Data Persistence Adapter for Web POS
 * Provides persistent high-capacity offline caching for products, categories, outlets, pricing rules and sync metadata.
 */

import type { CategoryDto, HappyHourRuleDto, PosOfflineCatalogPackageDto, ProductDetailDto } from './posCatalogService';

const DB_NAME = 'CRUISE_POS_MASTER_DATA_DB';
const DB_VERSION = 1;

export interface MasterDataSyncMeta {
  outletId: number | 'ALL';
  etag: string;
  version: string;
  lastSyncedAt: string;
  productCount: number;
}

export class MasterDataIndexedDbAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by_outlet', 'outletId', { unique: false });
          productStore.createIndex('by_category', 'categoryId', { unique: false });
          productStore.createIndex('by_sku', 'sku', { unique: true });
          productStore.createIndex('by_barcode', 'barcode', { unique: false });
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('by_outlet', 'outletId', { unique: false });
        }

        // Outlets store
        if (!db.objectStoreNames.contains('outlets')) {
          db.createObjectStore('outlets', { keyPath: 'id' });
        }

        // Pricing rules store
        if (!db.objectStoreNames.contains('happyHourRules')) {
          const ruleStore = db.createObjectStore('happyHourRules', { keyPath: 'id' });
          ruleStore.createIndex('by_outlet', 'outletId', { unique: false });
        }

        // Sync Metadata store
        if (!db.objectStoreNames.contains('syncMeta')) {
          db.createObjectStore('syncMeta', { keyPath: 'outletId' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  async persistFullSnapshot(outletId: number | undefined, pkg: PosOfflineCatalogPackageDto): Promise<void> {
    const key = outletId || 'ALL';
    // Fallback to localStorage as fast-path backup
    try {
      localStorage.setItem(`CRUISE_OFFLINE_CATALOG_${key}`, JSON.stringify(pkg));
    } catch {
      // Storage quota exceeded on localStorage, continue with IndexedDB
    }

    try {
      const db = await this.openDb();
      const tx = db.transaction(['products', 'categories', 'outlets', 'happyHourRules', 'syncMeta'], 'readwrite');

      const productStore = tx.objectStore('products');
      const categoryStore = tx.objectStore('categories');
      const outletStore = tx.objectStore('outlets');
      const ruleStore = tx.objectStore('happyHourRules');
      const metaStore = tx.objectStore('syncMeta');

      // Put products
      if (pkg.products && Array.isArray(pkg.products)) {
        for (const p of pkg.products) {
          productStore.put(p);
        }
      }

      // Put categories
      if (pkg.categories && Array.isArray(pkg.categories)) {
        for (const c of pkg.categories) {
          categoryStore.put(c);
        }
      }

      // Put outlets
      if (pkg.outlets && Array.isArray(pkg.outlets)) {
        for (const o of pkg.outlets) {
          outletStore.put(o);
        }
      }

      // Put rules
      if (pkg.happyHourRules && Array.isArray(pkg.happyHourRules)) {
        for (const r of pkg.happyHourRules) {
          ruleStore.put(r);
        }
      }

      // Put sync meta
      const meta: MasterDataSyncMeta = {
        outletId: key,
        etag: pkg.etag || '',
        version: pkg.version || '1.0.0',
        lastSyncedAt: pkg.exportedAt || new Date().toISOString(),
        productCount: pkg.products ? pkg.products.length : 0,
      };
      metaStore.put(meta);

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch (e) {
      console.warn('IndexedDB persistence fallback:', e);
    }
  }

  async applyDeltaUpdate(
    outletId: number | undefined,
    currentVersionHash: string,
    updatedProducts: ProductDetailDto[],
    deletedProductIds: number[],
    updatedCategories?: CategoryDto[],
    updatedRules?: HappyHourRuleDto[]
  ): Promise<void> {
    const key = outletId || 'ALL';
    try {
      const db = await this.openDb();
      const tx = db.transaction(['products', 'categories', 'happyHourRules', 'syncMeta'], 'readwrite');

      const productStore = tx.objectStore('products');
      const categoryStore = tx.objectStore('categories');
      const ruleStore = tx.objectStore('happyHourRules');
      const metaStore = tx.objectStore('syncMeta');

      for (const p of updatedProducts) {
        productStore.put(p);
      }
      for (const id of deletedProductIds) {
        productStore.delete(id);
      }
      if (updatedCategories) {
        for (const c of updatedCategories) {
          categoryStore.put(c);
        }
      }
      if (updatedRules) {
        for (const r of updatedRules) {
          ruleStore.put(r);
        }
      }

      // Update metadata
      const metaReq = metaStore.get(key);
      metaReq.onsuccess = () => {
        const meta = (metaReq.result as MasterDataSyncMeta) || {
          outletId: key,
          etag: currentVersionHash,
          version: '1.0.0',
          lastSyncedAt: new Date().toISOString(),
          productCount: 0,
        };
        meta.etag = currentVersionHash;
        meta.lastSyncedAt = new Date().toISOString();
        metaStore.put(meta);
      };

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('Failed to apply delta updates to IndexedDB:', err);
    }
  }

  async getAllProducts(outletId?: number): Promise<ProductDetailDto[]> {
    try {
      const db = await this.openDb();
      return new Promise((resolve) => {
        const tx = db.transaction('products', 'readonly');
        const store = tx.objectStore('products');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as ProductDetailDto[]) || [];
          if (!outletId) {
            resolve(list);
          } else {
            resolve(list.filter((p) => !p.outletId || p.outletId === outletId));
          }
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      // Fallback to localStorage
      const key = outletId || 'ALL';
      const stored = localStorage.getItem(`CRUISE_OFFLINE_CATALOG_${key}`);
      if (stored) {
        try {
          const pkg = JSON.parse(stored) as PosOfflineCatalogPackageDto;
          return pkg.products || [];
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  async getSyncMeta(outletId?: number): Promise<MasterDataSyncMeta | null> {
    const key = outletId || 'ALL';
    try {
      const db = await this.openDb();
      return new Promise((resolve) => {
        const tx = db.transaction('syncMeta', 'readonly');
        const store = tx.objectStore('syncMeta');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async clearDatabase(): Promise<void> {
    try {
      const db = await this.openDb();
      const tx = db.transaction(['products', 'categories', 'outlets', 'happyHourRules', 'syncMeta'], 'readwrite');
      tx.objectStore('products').clear();
      tx.objectStore('categories').clear();
      tx.objectStore('outlets').clear();
      tx.objectStore('happyHourRules').clear();
      tx.objectStore('syncMeta').clear();
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }
}

export const masterDataDb = new MasterDataIndexedDbAdapter();
