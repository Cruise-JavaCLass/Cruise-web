import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Flame,
  UploadCloud,
  DownloadCloud,
  Edit,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingBag
} from 'lucide-react';
import {
  posCatalogService,
  type ProductDto,
  type ProductDetailDto,
  type OutletDto,
  type CategoryDto,
  type ProductStatus,
} from '../../services/posCatalogService';
import { OutletSelector } from './OutletSelector';
import { CategoryTreeNav } from './CategoryTreeNav';
import { ProductFormModal } from './ProductFormModal';
import { HappyHourConfigModal } from './HappyHourConfigModal';
import { BulkImportModal } from './BulkImportModal';

export const PosCatalogManagement: React.FC = () => {
  // Outlets & Categories
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  // Products Table
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProductStatus>('ALL');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDetailDto | null>(null);
  const [isHappyHourOpen, setIsHappyHourOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const [outletError, setOutletError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  // Load Outlets on mount
  const loadOutlets = useCallback(async () => {
    try {
      const data = await posCatalogService.getOutlets();
      setOutlets(data);
      setOutletError(null);
    } catch {
      setOutlets([]);
      setOutletError('Không thể tải danh sách điểm bán từ máy chủ.');
    }
  }, []);

  useEffect(() => {
    void loadOutlets();
  }, [loadOutlets]);

  // Load Categories when outlet changes
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await posCatalogService.getCategories(selectedOutletId);
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };
    void loadCategories();
  }, [selectedOutletId]);

  // Load Products
  const loadProducts = useCallback(async () => {
    const requestId = ++latestRequestIdRef.current;
    setIsLoading(true);
    setProductError(null);
    try {
      const resp = await posCatalogService.getProducts({
        outletId: selectedOutletId,
        categoryId: selectedCategoryId,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        keyword: searchTerm.trim() || undefined,
        size: 100,
      });
      if (requestId === latestRequestIdRef.current) {
        setProducts(resp.content || []);
      }
    } catch {
      if (requestId === latestRequestIdRef.current) {
        setProducts([]);
        setProductError('Không thể tải danh mục sản phẩm từ máy chủ.');
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [selectedOutletId, selectedCategoryId, statusFilter, searchTerm]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  // Toggle 86'd status
  const handleToggle86ed = async (product: ProductDto) => {
    const isCurrently86ed = Boolean(product.is86ed || product.status === 'EIGHTY_SIXED');
    const willBe86ed = !isCurrently86ed;
    try {
      await posCatalogService.updateProductStatus(product.id, {
        is86ed: willBe86ed,
        reason: willBe86ed ? 'Nhân viên đánh dấu hết hàng tại quầy' : 'Khôi phục hàng khả dụng',
        staffId: 'FNB_MANAGER',
      });
      showToast(
        willBe86ed
          ? `Đã đánh dấu 86'd (hết hàng) món "${product.name}"`
          : `Đã khôi phục món "${product.name}" sẵn sàng phục vụ`
      );
      await loadProducts();
    } catch {
      showToast('Không thể cập nhật trạng thái món.', true);
    }
  };

  // Open Edit Product
  const handleEditProduct = async (product: ProductDto) => {
    try {
      const detail = await posCatalogService.getProductById(product.id);
      setEditingProduct(detail);
      setIsFormOpen(true);
    } catch {
      showToast('Không thể tải thông tin chi tiết món để chỉnh sửa.', true);
    }
  };

  // Export Offline Package
  const handleExportOfflinePackage = async () => {
    try {
      const result = await posCatalogService.getOfflinePackage(selectedOutletId);
      if (result.isCachedFallback) {
        showToast('Máy chủ không khả dụng. Đang sử dụng gói offline đã lưu trữ cục bộ.', true);
        return;
      }
      if (result.data) {
        posCatalogService.saveOfflineCatalog(selectedOutletId, result.data);
      }
      showToast(`Xuất gói offline thành công! (ETag: ${result.etag || 'mới nhất'})`);
    } catch {
      showToast('Không thể xuất gói catalog offline.', true);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-white animate-in slide-in-from-top-3 ${
            toast.isError ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Outlet Error Banner */}
      {outletError && (
        <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{outletError}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadOutlets()}
            className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 rounded-lg text-white font-medium flex items-center gap-1 transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Thử lại
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <OutletSelector
          outlets={outlets}
          selectedOutletId={selectedOutletId}
          onSelectOutlet={(id) => {
            setSelectedOutletId(id);
            setSelectedCategoryId(undefined);
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportOfflinePackage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Đóng gói và tải cache danh mục ngoại tuyến (ETag 304)"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Xuất Cache Ngoại Tuyến</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHappyHourOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Giờ Vàng (Happy Hour)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nhập File Hàng Loạt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Món Mới</span>
          </button>
        </div>
      </div>

      {/* Main Content: Left Category Tree + Right Product Table */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-[500px]">
        {/* Left Category Nav */}
        <div className="w-full lg:w-64 shrink-0">
          <CategoryTreeNav
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={(id) => setSelectedCategoryId(id)}
          />
        </div>

        {/* Right Product Management Table */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-sm flex flex-col">
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm món theo tên, SKU, mã vạch..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ProductStatus)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang phục vụ (ACTIVE)</option>
                <option value="EIGHTY_SIXED">Đã hết hàng (86'd)</option>
                <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
              </select>

              <button
                type="button"
                onClick={() => void loadProducts()}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3">Mã SKU / Barcode</th>
                  <th className="p-3">Phân loại & Thuế</th>
                  <th className="p-3 text-right">Đơn giá</th>
                  <th className="p-3 text-center">Tồn kho</th>
                  <th className="p-3 text-center">Khóa 86'd</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {productError ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-rose-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
                      <p className="font-medium text-sm">{productError}</p>
                      <button
                        type="button"
                        onClick={() => void loadProducts()}
                        className="mt-3 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-700 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Thử lại</span>
                      </button>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <span>Không tìm thấy sản phẩm nào trong danh mục</span>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const is86ed = p.is86ed || p.status === 'EIGHTY_SIXED';
                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          is86ed ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        {/* Name & Photo */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-white block">{p.name}</span>
                              {p.happyHourEligible && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 font-semibold">
                                  <Flame className="w-2.5 h-2.5" />
                                  Happy Hour (-{p.happyHourDiscountPercent || 20}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU & Barcode */}
                        <td className="p-3 font-mono">
                          <span className="text-slate-300 block">{p.sku}</span>
                          <span className="text-[11px] text-slate-500">
                            {p.barcode ? p.barcode : '—'}
                          </span>
                        </td>

                        {/* Category & Tax */}
                        <td className="p-3">
                          <span className="text-slate-300 block">{p.categoryName || 'Mặc định'}</span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {p.taxCategory === 'STANDARD_VAT'
                              ? 'VAT 10%'
                              : p.taxCategory === 'REDUCED_VAT'
                              ? 'VAT 5%'
                              : '0% Duty-Free'}
                          </span>
                        </td>

                        {/* Base Price */}
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          ${p.basePrice.toFixed(2)}
                        </td>

                        {/* Stock */}
                        <td className="p-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              p.stockQuantity === 0
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {p.stockQuantity}
                          </span>
                        </td>

                        {/* 86'd Toggle Switch */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={is86ed}
                            onClick={() => void handleToggle86ed(p)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              is86ed ? 'bg-rose-600' : 'bg-slate-700'
                            }`}
                            title={is86ed ? "Khôi phục món (bỏ 86'd)" : "Đánh dấu 86'd (hết hàng)"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                is86ed ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Edit Action */}
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Sửa thông tin món"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        product={editingProduct}
        outlets={outlets}
        categories={categories}
        defaultOutletId={selectedOutletId}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => void loadProducts()}
      />

      {/* Happy Hour Modal */}
      <HappyHourConfigModal
        isOpen={isHappyHourOpen}
        outletId={selectedOutletId}
        outlets={outlets}
        onClose={() => setIsHappyHourOpen(false)}
        onSuccess={() => void loadProducts()}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={() => void loadProducts()}
      />
    </div>
  );
};
