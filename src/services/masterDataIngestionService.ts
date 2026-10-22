import { apiClient } from './api';
import { masterDataDb } from './masterDataIndexedDb';
import type { PosOfflineCatalogPackageDto, ProductDetailDto, CategoryDto, HappyHourRuleDto } from './posCatalogService';

export interface PosDeltaCatalogChangefeedDto {
  fromVersionHash?: string;
  currentVersionHash: string;
  syncTimestamp: string;
  outletId?: number;
  requiresFullSnapshot: boolean;
  updatedProducts: ProductDetailDto[];
  deletedProductIds: number[];
  updatedCategories: CategoryDto[];
  updatedHappyHourRules: HappyHourRuleDto[];
}

export interface MasterDataSyncProgress {
  stage: 'IDLE' | 'CHECKING_VERSION' | 'DOWNLOADING_SNAPSHOT' | 'DOWNLOADING_DELTA' | 'PERSISTING_LOCAL' | 'COMPLETED' | 'ERROR';
  percentage: number;
  message: string;
  itemCount: number;
  error?: string;
}

export class MasterDataIngestionEngine {
  private progressListeners: ((progress: MasterDataSyncProgress) => void)[] = [];
  private currentProgress: MasterDataSyncProgress = {
    stage: 'IDLE',
    percentage: 0,
    message: 'Chờ đồng bộ dữ liệu',
    itemCount: 0,
  };

  subscribe(listener: (progress: MasterDataSyncProgress) => void): () => void {
    this.progressListeners.push(listener);
    listener(this.currentProgress);
    return () => {
      this.progressListeners = this.progressListeners.filter((l) => l !== listener);
    };
  }

  private updateProgress(stage: MasterDataSyncProgress['stage'], percentage: number, message: string, itemCount: number = 0, error?: string) {
    this.currentProgress = { stage, percentage, message, itemCount, error };
    for (const listener of this.progressListeners) {
      listener(this.currentProgress);
    }
  }

  getCurrentProgress(): MasterDataSyncProgress {
    return this.currentProgress;
  }

  async syncMasterData(outletId?: number, forceFullSnapshot: boolean = false): Promise<{ success: boolean; itemCount: number }> {
    try {
      this.updateProgress('CHECKING_VERSION', 15, 'Kiểm tra phiên bản dữ liệu máy chủ...', 0);

      const localMeta = await masterDataDb.getSyncMeta(outletId);
      const currentEtag = !forceFullSnapshot && localMeta ? localMeta.etag : undefined;

      // If we don't have local data or force full snapshot, download full package
      if (!currentEtag || forceFullSnapshot) {
        return await this.downloadFullPackage(outletId);
      }

      // Try delta sync
      this.updateProgress('DOWNLOADING_DELTA', 40, 'Đang tải gói cập nhật thay đổi (Delta)...', 0);
      try {
        const deltaRes = await apiClient.get<{ success: boolean; data: PosDeltaCatalogChangefeedDto }>('/api/pos/catalog/delta', {
          params: {
            outletId,
            versionHash: currentEtag,
          },
        });

        const delta = deltaRes.data.data;
        if (delta.requiresFullSnapshot) {
          return await this.downloadFullPackage(outletId);
        }

        this.updateProgress('PERSISTING_LOCAL', 75, 'Đang cập nhật thay đổi vào cơ sở dữ liệu IndexedDB...', delta.updatedProducts.length);
        await masterDataDb.applyDeltaUpdate(
          outletId,
          delta.currentVersionHash,
          delta.updatedProducts,
          delta.deletedProductIds,
          delta.updatedCategories,
          delta.updatedHappyHourRules
        );

        this.updateProgress('COMPLETED', 100, `Đã cập nhật ${delta.updatedProducts.length} mặt hàng mới/sửa`, delta.updatedProducts.length);
        return { success: true, itemCount: delta.updatedProducts.length };
      } catch (deltaErr) {
        console.warn('Delta sync failed, falling back to full snapshot:', deltaErr);
        return await this.downloadFullPackage(outletId);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Lỗi không xác định khi đồng bộ dữ liệu ngoại tuyến';
      this.updateProgress('ERROR', 0, 'Đồng bộ thất bại', 0, errMsg);
      return { success: false, itemCount: 0 };
    }
  }

  private async downloadFullPackage(outletId?: number): Promise<{ success: boolean; itemCount: number }> {
    this.updateProgress('DOWNLOADING_SNAPSHOT', 45, 'Đang tải toàn bộ dữ liệu danh mục & bảng giá từ máy chủ...', 0);
    const res = await apiClient.get<{ success: boolean; data: PosOfflineCatalogPackageDto }>('/api/pos/catalog/offline-package', {
      params: outletId ? { outletId } : undefined,
    });

    const pkg = res.data.data;
    const totalItems = pkg.products ? pkg.products.length : 0;

    this.updateProgress('PERSISTING_LOCAL', 80, `Đang nạp ${totalItems} mặt hàng vào bộ nhớ ngoại tuyến IndexedDB...`, totalItems);
    await masterDataDb.persistFullSnapshot(outletId, pkg);

    this.updateProgress('COMPLETED', 100, `Đồng bộ thành công ${totalItems} mặt hàng ngoại tuyến`, totalItems);
    return { success: true, itemCount: totalItems };
  }
}

export const masterDataIngestionEngine = new MasterDataIngestionEngine();
