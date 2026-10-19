import { apiClient } from './api';

export type TaxCategory = 'STANDARD_VAT' | 'REDUCED_VAT' | 'ZERO_RATED' | 'EXEMPT';
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'EIGHTY_SIXED' | 'ARCHIVED';
export type OutletType = 'BAR' | 'RESTAURANT' | 'SPA' | 'GIFT_SHOP' | 'CAFE' | 'LOUNGE' | 'CASINO' | 'ROOM_SERVICE';
export type VoyageLocationStatus = 'IN_PORT' | 'INTERNATIONAL_WATERS';

export interface OutletDto {
  id: number;
  code: string;
  name: string;
  outletType: OutletType;
  location?: string;
  openTime?: string;
  closeTime?: string;
  isActive: boolean;
  description?: string;
}

export interface CategoryDto {
  id: number;
  outletId?: number;
  code: string;
  name: string;
  parentId?: number;
  displayOrder: number;
  isActive: boolean;
  icon?: string;
  color?: string;
  description?: string;
  children?: CategoryDto[];
}

export interface ProductModifierDto {
  id?: number;
  productId?: number;
  name: string;
  priceDelta: number;
  isRequired?: boolean;
  minSelection?: number;
  maxSelection?: number;
  displayOrder?: number;
  status?: string;
}

export interface ProductDto {
  id: number;
  outletId?: number;
  categoryId: number;
  categoryName?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  taxCategory: TaxCategory;
  status: ProductStatus;
  isAvailable: boolean;
  is86ed: boolean;
  stockQuantity: number;
  imageUrl?: string;
  displayOrder?: number;
  happyHourEligible: boolean;
  happyHourDiscountPercent?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDetailDto extends ProductDto {
  outletName?: string;
  modifiers: ProductModifierDto[];
}

export interface CreateProductRequest {
  outletId?: number;
  categoryId: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  taxCategory?: TaxCategory;
  status?: ProductStatus;
  stockQuantity?: number;
  imageUrl?: string;
  displayOrder?: number;
  happyHourEligible?: boolean;
  happyHourDiscountPercent?: number;
  modifiers?: ProductModifierDto[];
}

export interface UpdateProductRequest {
  outletId?: number;
  categoryId?: number;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  taxCategory?: TaxCategory;
  status?: ProductStatus;
  isAvailable?: boolean;
  is86ed?: boolean;
  stockQuantity?: number;
  imageUrl?: string;
  displayOrder?: number;
  happyHourEligible?: boolean;
  happyHourDiscountPercent?: number;
  modifiers?: ProductModifierDto[];
}

export interface ProductStatusUpdateRequest {
  status?: ProductStatus;
  is86ed?: boolean;
  isAvailable?: boolean;
  reason?: string;
  staffId?: string;
}

export interface CartItemCalculationRequest {
  productId?: number;
  sku?: string;
  quantity: number;
  selectedModifierIds?: number[];
  specialNotes?: string;
}

export interface CartPriceCalculationRequest {
  outletId?: number;
  voyageLocation?: VoyageLocationStatus;
  portName?: string;
  simulatedTime?: string;
  items: CartItemCalculationRequest[];
}

export interface CartItemCalculationResult {
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  modifierUnitTotal: number;
  grossLineTotal: number;
  discountAmount: number;
  netLineTotal: number;
  happyHourApplied: boolean;
  appliedModifierNames: string[];
}

export interface CartPriceCalculationResponse {
  subtotal: number;
  happyHourDiscount: number;
  taxableSubtotal: number;
  maritimeTax: number;
  taxRatePercent: number;
  serviceCharge: number;
  serviceChargePercent: number;
  grandTotal: number;
  isDutyFree: boolean;
  isHappyHourActive: boolean;
  happyHourDescription?: string;
  items: CartItemCalculationResult[];
}

export interface HappyHourRuleDto {
  id: number;
  outletId?: number;
  name: string;
  startTime: string;
  endTime: string;
  discountPercent: number;
  daysOfWeek?: string;
  isActive: boolean;
  description?: string;
}

export interface PosOfflineCatalogPackageDto {
  version: string;
  etag: string;
  exportedAt: string;
  outletId?: number;
  outlets: OutletDto[];
  categories: CategoryDto[];
  products: ProductDetailDto[];
  happyHourRules: HappyHourRuleDto[];
  defaultServiceChargeRate: number;
  standardPortVatRate: number;
}

export interface BulkProductImportItem {
  outletCode?: string;
  categoryCode?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  basePrice: number;
  costPrice?: number;
  taxCategory?: string;
  stockQuantity?: number;
  imageUrl?: string;
  happyHourEligible?: boolean;
  happyHourDiscountPercent?: number;
  modifiers?: ProductModifierDto[];
}

export interface BulkCatalogImportRequest {
  performedBy?: string;
  supplierManifestNumber?: string;
  products: BulkProductImportItem[];
}

export interface BulkImportResponse {
  totalItems: number;
  successCount: number;
  failedCount: number;
  errors: string[];
  importedAt: string;
}

export interface PosCatalogAuditLog {
  id: number;
  productId?: number;
  sku?: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  performedBy?: string;
  reason?: string;
  details?: string;
  createdAt: string;
}

export const posCatalogService = {
  async getOutlets(): Promise<OutletDto[]> {
    const res = await apiClient.get<{ success: boolean; data: OutletDto[] }>('/api/pos/outlets');
    return res.data.data;
  },

  async getOutletById(id: number): Promise<OutletDto> {
    const res = await apiClient.get<{ success: boolean; data: OutletDto }>(`/api/pos/outlets/${id}`);
    return res.data.data;
  },

  async getCategories(outletId?: number): Promise<CategoryDto[]> {
    const params = outletId ? { outletId } : undefined;
    const res = await apiClient.get<{ success: boolean; data: CategoryDto[] }>('/api/pos/categories', { params });
    return res.data.data;
  },

  async getProducts(params?: {
    outletId?: number;
    categoryId?: number;
    status?: ProductStatus;
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: ProductDto[]; totalElements: number; totalPages: number }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { content: ProductDto[]; totalElements: number; totalPages: number };
    }>('/api/pos/products', { params });
    return res.data.data;
  },

  async getProductById(id: number): Promise<ProductDetailDto> {
    const res = await apiClient.get<{ success: boolean; data: ProductDetailDto }>(`/api/pos/products/${id}`);
    return res.data.data;
  },

  async createProduct(req: CreateProductRequest): Promise<ProductDetailDto> {
    const res = await apiClient.post<{ success: boolean; data: ProductDetailDto }>('/api/pos/products', req);
    return res.data.data;
  },

  async updateProduct(id: number, req: UpdateProductRequest): Promise<ProductDetailDto> {
    const res = await apiClient.put<{ success: boolean; data: ProductDetailDto }>(`/api/pos/products/${id}`, req);
    return res.data.data;
  },

  async updateProductStatus(id: number, req: ProductStatusUpdateRequest): Promise<ProductDetailDto> {
    const res = await apiClient.patch<{ success: boolean; data: ProductDetailDto }>(
      `/api/pos/products/${id}/status`,
      req
    );
    return res.data.data;
  },

  async lookupProduct(code: string, outletId?: number): Promise<ProductDetailDto> {
    const params: { code: string; outletId?: number } = { code };
    if (outletId) params.outletId = outletId;
    const res = await apiClient.get<{ success: boolean; data: ProductDetailDto }>('/api/pos/products/lookup', {
      params,
    });
    return res.data.data;
  },

  async calculatePricing(req: CartPriceCalculationRequest): Promise<CartPriceCalculationResponse> {
    const res = await apiClient.post<{ success: boolean; data: CartPriceCalculationResponse }>(
      '/api/pos/pricing/calculate',
      req
    );
    return res.data.data;
  },

  async getHappyHourRules(outletId?: number): Promise<HappyHourRuleDto[]> {
    const params = outletId ? { outletId } : undefined;
    const res = await apiClient.get<{ success: boolean; data: HappyHourRuleDto[] }>(
      '/api/pos/pricing/happy-hour-rules',
      { params }
    );
    return res.data.data;
  },

  async createHappyHourRule(req: Partial<HappyHourRuleDto>): Promise<HappyHourRuleDto> {
    const res = await apiClient.post<{ success: boolean; data: HappyHourRuleDto }>(
      '/api/pos/pricing/happy-hour-rules',
      req
    );
    return res.data.data;
  },

  async updateHappyHourRule(id: number, req: Partial<HappyHourRuleDto>): Promise<HappyHourRuleDto> {
    const res = await apiClient.put<{ success: boolean; data: HappyHourRuleDto }>(
      `/api/pos/pricing/happy-hour-rules/${id}`,
      req
    );
    return res.data.data;
  },

  async deleteHappyHourRule(id: number): Promise<void> {
    await apiClient.delete(`/api/pos/pricing/happy-hour-rules/${id}`);
  },

  async getOfflinePackage(
    outletId?: number,
    ifNoneMatch?: string
  ): Promise<{ data: PosOfflineCatalogPackageDto | null; notModified: boolean; etag?: string }> {
    const headers: Record<string, string> = {};
    if (ifNoneMatch) headers['If-None-Match'] = ifNoneMatch;

    try {
      const res = await apiClient.get<{ success: boolean; data: PosOfflineCatalogPackageDto }>(
        '/api/pos/catalog/offline-package',
        {
          params: outletId ? { outletId } : undefined,
          headers,
          validateStatus: (status) => status === 200 || status === 304,
        }
      );

      if (res.status === 304) {
        return { data: null, notModified: true, etag: ifNoneMatch };
      }

      const etag = (res.headers?.etag as string) || res.data.data.etag;
      return { data: res.data.data, notModified: false, etag };
    } catch {
      // Offline fallback from local storage
      const local = localStorage.getItem(`CRUISE_OFFLINE_CATALOG_${outletId || 'ALL'}`);
      if (local) {
        try {
          const parsed = JSON.parse(local) as PosOfflineCatalogPackageDto;
          return { data: parsed, notModified: false, etag: parsed.etag };
        } catch {
          // parse error
        }
      }
      throw new Error('Không thể tải gói dữ liệu offline và không có dữ liệu cache');
    }
  },

  async bulkImportProducts(req: BulkCatalogImportRequest): Promise<BulkImportResponse> {
    const res = await apiClient.post<{ success: boolean; data: BulkImportResponse }>(
      '/api/pos/catalog/bulk-import',
      req
    );
    return res.data.data;
  },

  async getAuditLogs(page = 0, size = 50): Promise<{ content: PosCatalogAuditLog[] }> {
    const res = await apiClient.get<{ success: boolean; data: { content: PosCatalogAuditLog[] } }>(
      '/api/pos/catalog/audit-logs',
      { params: { page, size } }
    );
    return res.data.data;
  },

  // Offline persistence helpers
  saveOfflineCatalog(outletId: number | undefined, pkg: PosOfflineCatalogPackageDto) {
    try {
      localStorage.setItem(`CRUISE_OFFLINE_CATALOG_${outletId || 'ALL'}`, JSON.stringify(pkg));
    } catch {
      // quota exceeded or storage disabled
    }
  },

  getOfflineCatalog(outletId?: number): PosOfflineCatalogPackageDto | null {
    try {
      const stored = localStorage.getItem(`CRUISE_OFFLINE_CATALOG_${outletId || 'ALL'}`);
      return stored ? (JSON.parse(stored) as PosOfflineCatalogPackageDto) : null;
    } catch {
      return null;
    }
  },
};
