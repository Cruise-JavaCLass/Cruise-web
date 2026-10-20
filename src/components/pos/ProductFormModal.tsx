import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertCircle, Save } from 'lucide-react';
import {
  posCatalogService,
  type ProductDetailDto,
  type ProductModifierDto,
  type OutletDto,
  type CategoryDto,
  type TaxCategory,
} from '../../services/posCatalogService';

interface ProductFormModalProps {
  isOpen: boolean;
  product?: ProductDetailDto | null;
  outlets: OutletDto[];
  categories: CategoryDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  outlets,
  categories,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [outletId, setOutletId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [basePrice, setBasePrice] = useState<number>(10.0);
  const [costPrice, setCostPrice] = useState<number>(3.0);
  const [taxCategory, setTaxCategory] = useState<TaxCategory>('STANDARD_VAT');
  const [stockQuantity, setStockQuantity] = useState<number>(100);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [happyHourEligible, setHappyHourEligible] = useState(true);
  const [happyHourDiscountPercent, setHappyHourDiscountPercent] = useState<number>(20);
  const [modifiers, setModifiers] = useState<ProductModifierDto[]>([]);

  // Validation & Loading
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setOutletId(product.outletId);
      setCategoryId(product.categoryId || 1);
      setBasePrice(product.basePrice ?? 0);
      setCostPrice(product.costPrice ?? 0);
      setTaxCategory(product.taxCategory || 'STANDARD_VAT');
      setStockQuantity(product.stockQuantity ?? 100);
      setImageUrl(product.imageUrl || '');
      setDescription(product.description || '');
      setHappyHourEligible(product.happyHourEligible ?? true);
      setHappyHourDiscountPercent(product.happyHourDiscountPercent ?? 20);
      setModifiers(product.modifiers || []);
    } else {
      setName('');
      setSku(`SKU-${Date.now().toString().slice(-6)}`);
      setBarcode('');
      setOutletId(outlets.length > 0 ? outlets[0].id : undefined);
      setCategoryId(categories.length > 0 ? categories[0].id : 1);
      setBasePrice(12.0);
      setCostPrice(3.5);
      setTaxCategory('STANDARD_VAT');
      setStockQuantity(100);
      setImageUrl('');
      setDescription('');
      setHappyHourEligible(true);
      setHappyHourDiscountPercent(20);
      setModifiers([]);
    }
    setError(null);
  }, [product, outlets, categories, isOpen]);

  if (!isOpen) return null;

  const handleAddModifier = () => {
    setModifiers([
      ...modifiers,
      { name: '', priceDelta: 0.0, isRequired: false, minSelection: 0, maxSelection: 1 },
    ]);
  };

  const handleUpdateModifier = (index: number, field: keyof ProductModifierDto, value: unknown) => {
    const updated = [...modifiers];
    updated[index] = { ...updated[index], [field]: value };
    setModifiers(updated);
  };

  const handleRemoveModifier = (index: number) => {
    setModifiers(modifiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên món không được để trống');
      return;
    }
    if (!sku.trim()) {
      setError('Mã SKU không được để trống');
      return;
    }
    if (basePrice <= 0) {
      setError('Giá bán phải lớn hơn 0');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const validModifiers = modifiers.filter((m) => m.name.trim().length > 0);

      if (product) {
        await posCatalogService.updateProduct(product.id, {
          name: name.trim(),
          barcode: barcode.trim() || undefined,
          outletId,
          categoryId,
          basePrice,
          costPrice,
          taxCategory,
          stockQuantity,
          imageUrl: imageUrl.trim() || undefined,
          description: description.trim() || undefined,
          happyHourEligible,
          happyHourDiscountPercent,
          modifiers: validModifiers,
        });
      } else {
        await posCatalogService.createProduct({
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim() || undefined,
          outletId,
          categoryId,
          basePrice,
          costPrice,
          taxCategory,
          stockQuantity,
          imageUrl: imageUrl.trim() || undefined,
          description: description.trim() || undefined,
          happyHourEligible,
          happyHourDiscountPercent,
          modifiers: validModifiers,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể lưu sản phẩm. Vui lòng kiểm tra lại thông tin!';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <h3 id="product-form-title" className="text-base font-bold text-white flex items-center gap-2">
            <span>{product ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Đóng biểu mẫu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-name-input" className="text-xs font-semibold text-slate-400 block mb-1">
                Tên món / Sản phẩm <span className="text-rose-400">*</span>
              </label>
              <input
                id="prod-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Pacific Sunset Mojito"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <label htmlFor="prod-sku-input" className="text-xs font-semibold text-slate-400 block mb-1">
                Mã SKU <span className="text-rose-400">*</span>
              </label>
              <input
                id="prod-sku-input"
                type="text"
                value={sku}
                disabled={!!product}
                onChange={(e) => setSku(e.target.value)}
                placeholder="VD: BEV-MOJ-001"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                required
              />
            </div>

            {/* Barcode */}
            <div>
              <label htmlFor="prod-barcode-input" className="text-xs font-semibold text-slate-400 block mb-1">Mã vạch (Barcode)</label>
              <input
                id="prod-barcode-input"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="VD: 893850123401"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Outlet */}
            <div>
              <label htmlFor="prod-outlet-input" className="text-xs font-semibold text-slate-400 block mb-1">Điểm bán (Outlet)</label>
              <select
                id="prod-outlet-input"
                value={outletId || ''}
                onChange={(e) => setOutletId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả điểm bán (Chung)</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="prod-category-input" className="text-xs font-semibold text-slate-400 block mb-1">Danh mục</label>
              <select
                id="prod-category-input"
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Base Price */}
            <div>
              <label htmlFor="prod-base-price-input" className="text-xs font-semibold text-slate-400 block mb-1">
                Giá bán cơ sở ($) <span className="text-rose-400">*</span>
              </label>
              <input
                id="prod-base-price-input"
                type="number"
                step="0.01"
                min="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(Number.parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Cost Price */}
            <div>
              <label htmlFor="prod-cost-price-input" className="text-xs font-semibold text-slate-400 block mb-1">Giá vốn ($)</label>
              <input
                id="prod-cost-price-input"
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Number.parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tax Category */}
            <div>
              <label htmlFor="prod-tax-category-input" className="text-xs font-semibold text-slate-400 block mb-1">Phân loại thuế (VAT)</label>
              <select
                id="prod-tax-category-input"
                value={taxCategory}
                onChange={(e) => setTaxCategory(e.target.value as TaxCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="STANDARD_VAT">Tiêu chuẩn (10% Port VAT)</option>
                <option value="REDUCED_VAT">Giảm nhẹ (5% Port VAT)</option>
                <option value="ZERO_RATED">Thuế suất 0% (Duty-Free)</option>
                <option value="EXEMPT">Miễn thuế</option>
              </select>
            </div>

            {/* Stock Quantity */}
            <div>
              <label htmlFor="prod-stock-quantity-input" className="text-xs font-semibold text-slate-400 block mb-1">Tồn kho</label>
              <input
                id="prod-stock-quantity-input"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number.parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image URL */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-image-url-input" className="text-xs font-semibold text-slate-400 block mb-1">URL Hình ảnh</label>
              <input
                id="prod-image-url-input"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="prod-description-input" className="text-xs font-semibold text-slate-400 block mb-1">Mô tả chi tiết</label>
              <textarea
                id="prod-description-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thành phần, hương vị, lưu ý dị ứng thực phẩm..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Happy Hour eligibility */}
            <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div>
                <label htmlFor="prod-happy-hour-checkbox" className="text-xs font-semibold text-white block cursor-pointer">Áp dụng Happy Hour</label>
                <span className="text-[11px] text-slate-400">
                  Tự động giảm giá theo khung giờ vàng quy định
                </span>
              </div>
              <input
                id="prod-happy-hour-checkbox"
                type="checkbox"
                checked={happyHourEligible}
                onChange={(e) => setHappyHourEligible(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Modifiers List Section */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tùy chọn & Topping (Modifiers)
              </span>
              <button
                type="button"
                onClick={handleAddModifier}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm tùy chọn</span>
              </button>
            </div>

            {modifiers.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">Chưa có modifier nào.</p>
            ) : (
              <div className="space-y-2">
                {modifiers.map((mod, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700/60"
                  >
                    <input
                      type="text"
                      placeholder="Tên tùy chọn (vd: Thêm rum)"
                      value={mod.name}
                      onChange={(e) => handleUpdateModifier(idx, 'name', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400">+$</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.00"
                        value={mod.priceDelta}
                        onChange={(e) =>
                          handleUpdateModifier(idx, 'priceDelta', Number.parseFloat(e.target.value) || 0)
                        }
                        className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveModifier(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
