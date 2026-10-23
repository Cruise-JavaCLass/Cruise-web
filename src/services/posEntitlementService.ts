import { apiClient } from './api';
import { isAxiosError } from 'axios';
import type {
  GuestPackageEntitlement,
  EntitlementEvaluateRequest,
  EntitlementEvaluateResponse,
  EntitlementDeductRequest,
  EntitlementRollbackRequest,
} from './posEntitlementTypes';

const DB_NAME = 'CruisePosEntitlementDB';
const DB_VERSION = 1;
const STORE_NAME = 'guest_entitlements';

export class LocalEntitlementCache {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'passengerId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  async saveEntitlements(passengerId: number, entitlements: GuestPackageEntitlement[]): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ passengerId, entitlements, updatedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
      });
    } catch {
      // Fallback to localStorage if IndexedDB is blocked
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(`pos_entitlement_${passengerId}`, JSON.stringify(entitlements));
      }
    }
  }

  async invalidateEntitlements(passengerId: number): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(passengerId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
      });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`pos_entitlement_${passengerId}`);
    }
  }

  async getEntitlements(passengerId: number): Promise<GuestPackageEntitlement[] | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(passengerId);
        req.onsuccess = () => {
          if (req.result && req.result.entitlements) {
            resolve(req.result.entitlements);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(`pos_entitlement_${passengerId}`);
        if (raw) {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        }
      }
      return null;
    }
  }
}

export const localEntitlementCache = new LocalEntitlementCache();

export const posEntitlementService = {
  async evaluateCart(request: EntitlementEvaluateRequest): Promise<EntitlementEvaluateResponse> {
    try {
      const response = await apiClient.post<{ success: boolean; data: EntitlementEvaluateResponse }>(
        '/api/pos/entitlements/evaluate',
        request
      );
      return response.data.data;
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response) {
        throw err;
      }
      // Offline fallback evaluation using cached entitlements in IndexedDB
      const cached = await localEntitlementCache.getEntitlements(request.passengerId);
      if (cached && cached.length > 0) {
        return posEntitlementService.evaluateOffline(request, cached);
      }
      throw err;
    }
  },

  async getPassengerEntitlements(passengerId: number): Promise<GuestPackageEntitlement[]> {
    try {
      const response = await apiClient.get<{ success: boolean; data: GuestPackageEntitlement[] }>(
        `/api/pos/entitlements/passengers/${passengerId}`
      );
      const data = response.data.data;
      void localEntitlementCache.saveEntitlements(passengerId, data);
      return data;
    } catch (err: unknown) {
      const cached = await localEntitlementCache.getEntitlements(passengerId);
      if (cached) return cached;
      throw err;
    }
  },

  async deductQuota(request: EntitlementDeductRequest): Promise<void> {
    await apiClient.post('/api/pos/entitlements/deduct', request);
    const cached = await localEntitlementCache.getEntitlements(request.passengerId);
    if (cached && cached.length > 0) {
      const updated = cached.map((pkg) => {
        const deduction = request.items
          .filter((item) => item.entitlementId === pkg.id)
          .reduce((sum, item) => sum + item.units, 0);
        if (deduction > 0) {
          const usedQuota = pkg.usedQuota + deduction;
          const status = usedQuota >= pkg.totalQuota ? 'EXHAUSTED' : pkg.status;
          return {
            ...pkg,
            usedQuota,
            status,
          };
        }
        return pkg;
      });
      await localEntitlementCache.saveEntitlements(request.passengerId, updated);
    }
  },

  async rollbackQuota(request: EntitlementRollbackRequest): Promise<void> {
    await apiClient.post('/api/pos/entitlements/rollback', request);
  },

  evaluateOffline(request: EntitlementEvaluateRequest, entitlements: GuestPackageEntitlement[]): EntitlementEvaluateResponse {
    let originalTotal = 0;
    let packageDiscountTotal = 0;
    const virtualQuota = new Map<number, number>();
    const now = new Date();

    entitlements.forEach((e) => {
      virtualQuota.set(e.id, Math.max(0, e.totalQuota - e.usedQuota));
    });

    const isEntitlementValid = (e: GuestPackageEntitlement): boolean => {
      if (e.status !== 'ACTIVE') return false;
      if (e.validFrom) {
        const from = new Date(e.validFrom);
        if (!isNaN(from.getTime()) && now < from) return false;
      }
      if (e.validTo) {
        const to = new Date(e.validTo);
        if (!isNaN(to.getTime()) && now > to) return false;
      }
      return true;
    };

    const items = request.items.map((item) => {
      const gross = item.unitPrice * item.quantity;
      originalTotal += gross;

      let remainingQuantity = item.quantity;
      let itemCoveredAmount = 0;
      let totalQuotaDeducted = 0;
      let primaryPackageName: string | undefined;
      let primaryEntitlementId: number | undefined;

      while (remainingQuantity > 0) {
        const matched = entitlements.find((e) => {
          const rem = virtualQuota.get(e.id) || 0;
          const matchesCategory =
            !e.eligibleCategory ||
            e.eligibleCategory === 'ALL' ||
            e.eligibleCategory.toLowerCase() === item.category.toLowerCase();
          return isEntitlementValid(e) && rem > 0 && matchesCategory;
        });

        if (!matched) {
          break;
        }

        if (!primaryPackageName) {
          primaryPackageName = matched.packageName;
          primaryEntitlementId = matched.id;
        }

        const currentRem = virtualQuota.get(matched.id) || 0;
        const alloc = Math.min(remainingQuantity, currentRem);
        virtualQuota.set(matched.id, currentRem - alloc);

        const coveredUnitRate = matched.maxItemPriceCap
          ? Math.min(item.unitPrice, matched.maxItemPriceCap)
          : item.unitPrice;

        itemCoveredAmount += coveredUnitRate * alloc;
        totalQuotaDeducted += alloc;
        remainingQuantity -= alloc;
      }

      const outOfPocket = gross - itemCoveredAmount;
      packageDiscountTotal += itemCoveredAmount;

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        grossAmount: gross,
        coveredAmount: itemCoveredAmount,
        outOfPocketAmount: outOfPocket,
        fullyCovered: outOfPocket === 0,
        appliedPackageName: primaryPackageName,
        appliedEntitlementId: primaryEntitlementId,
        quotaDeducted: totalQuotaDeducted,
      };
    });

    return {
      passengerId: request.passengerId,
      cabinNumber: request.cabinNumber,
      originalTotal,
      packageDiscountTotal,
      netPayableTotal: Math.max(0, originalTotal - packageDiscountTotal),
      items,
    };
  },
};
