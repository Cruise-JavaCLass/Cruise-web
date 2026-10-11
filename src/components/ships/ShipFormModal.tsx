import { useState, useEffect } from 'react';
import { X, Ship as ShipIcon, Anchor, Users, Compass, ShieldAlert, Loader2 } from 'lucide-react';
import type { Ship, ShipFormData, ShipFormErrors } from '../../services/shipService';
import { validateShipForm } from '../../services/shipService';

export interface ShipFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShipFormData) => Promise<void> | void;
  initialData?: Ship | null;
  isLoading?: boolean;
}

const defaultFormData: ShipFormData = {
  name: '',
  code: '',
  operator: '',
  capacity: '',
  crewCapacity: '',
  totalCabins: '',
  totalDecks: '',
  manufacturingYear: '',
  lengthMeters: '',
  beamMeters: '',
  draftMeters: '',
  status: 'ACTIVE',
  description: '',
  amenities: '',
  imageUrl: '',
};

export function ShipFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: ShipFormModalProps) {
  const isEdit = Boolean(initialData);
  const [formData, setFormData] = useState<ShipFormData>(defaultFormData);
  const [errors, setErrors] = useState<ShipFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        code: initialData.code,
        operator: initialData.operator,
        capacity: initialData.capacity,
        crewCapacity: initialData.crewCapacity,
        totalCabins: initialData.totalCabins,
        totalDecks: initialData.totalDecks,
        manufacturingYear: initialData.manufacturingYear ?? '',
        lengthMeters: initialData.lengthMeters ?? '',
        beamMeters: initialData.beamMeters ?? '',
        draftMeters: initialData.draftMeters ?? '',
        status: initialData.status,
        description: initialData.description ?? '',
        amenities: initialData.amenities ?? '',
        imageUrl: initialData.imageUrl ?? '',
      });
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
    setApiError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for field upon editing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateShipForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lưu thông tin tàu';
      setApiError(errorMsg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ship-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-600/20">
              <ShipIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 id="ship-modal-title" className="text-base font-bold text-white">
                {isEdit ? 'Chỉnh Sửa Thông Tin Tàu' : 'Thêm Tàu Du Lịch Mới'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? `Cập nhật thông số và trạng thái hoạt động của tàu ${initialData?.code}`
                  : 'Đăng ký du thuyền mới vào hệ thống quản lý hải trình'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Đóng form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div className="m-5 mb-0 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5" /> Thông tin định danh & Vận hành
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1">
                  Tên du thuyền <span className="text-rose-400">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ví dụ: Halong Grand Harmony"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none ${
                    errors.name ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="code" className="block text-xs font-medium text-slate-300 mb-1">
                  Mã định danh tàu <span className="text-rose-400">*</span>
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="Ví dụ: SHIP-001"
                  value={formData.code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none uppercase ${
                    errors.code ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.code && <p className="text-[11px] text-rose-400 mt-1">{errors.code}</p>}
              </div>

              <div>
                <label htmlFor="operator" className="block text-xs font-medium text-slate-300 mb-1">
                  Đơn vị khai thác <span className="text-rose-400">*</span>
                </label>
                <input
                  id="operator"
                  name="operator"
                  type="text"
                  placeholder="Ví dụ: Paradise Vietnam Cruises"
                  value={formData.operator}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none ${
                    errors.operator ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.operator && <p className="text-[11px] text-rose-400 mt-1">{errors.operator}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-medium text-slate-300 mb-1">
                  Trạng thái hoạt động
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ACTIVE">ACTIVE (Sẵn sàng hoạt động)</option>
                  <option value="DOCKED">DOCKED (Đang neo đậu cảng)</option>
                  <option value="ON_VOYAGE">ON_VOYAGE (Đang trên biển)</option>
                  <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE (Bảo dưỡng)</option>
                  <option value="INACTIVE">INACTIVE (Tạm ngưng khai thác)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Sức chứa & Buồng phòng */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Sức chứa & Cơ cấu phòng
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="capacity" className="block text-xs font-medium text-slate-300 mb-1">
                  Khách tối đa <span className="text-rose-400">*</span>
                </label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="2400"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
                    errors.capacity ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.capacity && <p className="text-[11px] text-rose-400 mt-1">{errors.capacity}</p>}
              </div>

              <div>
                <label htmlFor="crewCapacity" className="block text-xs font-medium text-slate-300 mb-1">
                  Thủy thủ đoàn <span className="text-rose-400">*</span>
                </label>
                <input
                  id="crewCapacity"
                  name="crewCapacity"
                  type="number"
                  min="1"
                  placeholder="750"
                  value={formData.crewCapacity}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
                    errors.crewCapacity ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.crewCapacity && <p className="text-[11px] text-rose-400 mt-1">{errors.crewCapacity}</p>}
              </div>

              <div>
                <label htmlFor="totalCabins" className="block text-xs font-medium text-slate-300 mb-1">
                  Tổng cabin <span className="text-rose-400">*</span>
                </label>
                <input
                  id="totalCabins"
                  name="totalCabins"
                  type="number"
                  min="1"
                  placeholder="1100"
                  value={formData.totalCabins}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
                    errors.totalCabins ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.totalCabins && <p className="text-[11px] text-rose-400 mt-1">{errors.totalCabins}</p>}
              </div>

              <div>
                <label htmlFor="totalDecks" className="block text-xs font-medium text-slate-300 mb-1">
                  Số tầng/boong <span className="text-rose-400">*</span>
                </label>
                <input
                  id="totalDecks"
                  name="totalDecks"
                  type="number"
                  min="1"
                  placeholder="14"
                  value={formData.totalDecks}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
                    errors.totalDecks ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.totalDecks && <p className="text-[11px] text-rose-400 mt-1">{errors.totalDecks}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Kích thước kỹ thuật */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Thông số kích thước hàng hải
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="manufacturingYear" className="block text-xs font-medium text-slate-300 mb-1">
                  Năm đóng tàu
                </label>
                <input
                  id="manufacturingYear"
                  name="manufacturingYear"
                  type="number"
                  placeholder="2023"
                  value={formData.manufacturingYear}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
                    errors.manufacturingYear ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.manufacturingYear && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.manufacturingYear}</p>
                )}
              </div>

              <div>
                <label htmlFor="lengthMeters" className="block text-xs font-medium text-slate-300 mb-1">
                  Dài (mét)
                </label>
                <input
                  id="lengthMeters"
                  name="lengthMeters"
                  type="number"
                  step="0.1"
                  placeholder="315.5"
                  value={formData.lengthMeters}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
                    errors.lengthMeters ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.lengthMeters && <p className="text-[11px] text-rose-400 mt-1">{errors.lengthMeters}</p>}
              </div>

              <div>
                <label htmlFor="beamMeters" className="block text-xs font-medium text-slate-300 mb-1">
                  Rộng (mét)
                </label>
                <input
                  id="beamMeters"
                  name="beamMeters"
                  type="number"
                  step="0.1"
                  placeholder="38.0"
                  value={formData.beamMeters}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label htmlFor="draftMeters" className="block text-xs font-medium text-slate-300 mb-1">
                  Mớn nước (mét)
                </label>
                <input
                  id="draftMeters"
                  name="draftMeters"
                  type="number"
                  step="0.1"
                  placeholder="8.5"
                  value={formData.draftMeters}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
                    errors.draftMeters ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
                  }`}
                />
                {errors.draftMeters && <p className="text-[11px] text-rose-400 mt-1">{errors.draftMeters}</p>}
              </div>
            </div>
          </div>

          {/* Section 4: Tiện ích & Mô tả */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <div>
              <label htmlFor="amenities" className="block text-xs font-medium text-slate-300 mb-1">
                Tiện nghi nổi bật
              </label>
              <input
                id="amenities"
                name="amenities"
                type="text"
                placeholder="Sky Pool, Luxury Spa, Grand Ballroom, VIP Helipad"
                value={formData.amenities}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-medium text-slate-300 mb-1">
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                placeholder="Giới thiệu điểm nổi bật và phân khúc của du thuyền..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEdit ? 'Lưu Thay Đổi' : 'Thêm Tàu Du Lịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
