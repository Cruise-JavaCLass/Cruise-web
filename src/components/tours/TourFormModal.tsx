import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Compass } from 'lucide-react';
import type { CruiseTour, TourFormData } from '../../services/tourService';
import { validateTourForm } from '../../services/tourService';
import type { Ship } from '../../services/shipService';

interface TourFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TourFormData) => Promise<void>;
  tour?: CruiseTour | null;
  ships: Ship[];
  isSubmitting?: boolean;
}

const INITIAL_FORM: TourFormData = {
  name: '',
  code: '',
  description: '',
  shipId: '',
  durationDays: 4,
  durationNights: 3,
  departurePort: '',
  destinationPort: '',
  startDate: '',
  endDate: '',
  maxCapacity: 1000,
  basePrice: 15000000,
  currency: 'VND',
  itineraryOverview: '',
  imageUrl: '',
  status: 'DRAFT',
};

export const TourFormModal: React.FC<TourFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tour,
  ships,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<TourFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    if (tour) {
      setFormData({
        name: tour.name,
        code: tour.code,
        description: tour.description || '',
        shipId: tour.shipId ?? '',
        durationDays: tour.durationDays,
        durationNights: tour.durationNights,
        departurePort: tour.departurePort,
        destinationPort: tour.destinationPort,
        startDate: tour.startDate,
        endDate: tour.endDate,
        maxCapacity: tour.maxCapacity,
        basePrice: tour.basePrice,
        currency: tour.currency || 'VND',
        itineraryOverview: tour.itineraryOverview || '',
        imageUrl: tour.imageUrl || '',
        status: tour.status,
      });
    } else {
      setFormData(INITIAL_FORM);
    }
    setErrors({});
  }, [tour, isOpen]);

  if (!isOpen) return null;

  const selectedShip = ships.find((s) => s.id === Number(formData.shipId));

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTourForm(formData, selectedShip?.capacity);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // Handled by parent or API error toast
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="relative w-full max-w-3xl bg-white border border-[#E5E0D7] rounded-2xl shadow-xl p-6 md:p-8 my-8 text-[#252B32] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-[#5A6578] hover:text-[#102A43] p-1.5 rounded-lg hover:bg-[#E5E0D7]/50 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E0D7]">
          <div className="w-10 h-10 rounded-xl bg-[#102A43] flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5 text-[#C5A572]" />
          </div>
          <div>
            <h2 id="tour-modal-title" className="text-lg font-bold font-serif text-[#102A43]">
              {tour ? 'Cập Nhật Hải Trình Tour Du Lịch' : 'Tạo Hải Trình Tour Du Thuyền Mới'}
            </h2>
            <p className="text-xs text-[#5A6578] mt-0.5">
              Thiết lập thông tin lộ trình, tàu vận hành, cảng xuất phát và quy định sức chứa
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tên tour */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="name">
                Tên Tour Hải Trình <span className="text-rose-600">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ"
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Mã tour */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="code">
                Mã Tour Định Danh <span className="text-rose-600">*</span>
              </label>
              <input
                id="code"
                name="code"
                type="text"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: TOUR-HL-001"
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] uppercase focus:outline-none transition-colors ${
                  errors.code ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.code && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.code}
                </p>
              )}
            </div>

            {/* Chỉ định tàu */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="shipId">
                Tàu Du Thuyền Vận Hành
              </label>
              <div className="relative">
                <select
                  id="shipId"
                  name="shipId"
                  value={formData.shipId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10 transition-colors"
                >
                  <option value="">-- Chưa gán tàu --</option>
                  {ships.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} - Sức chứa: {s.capacity} khách)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Số ngày & Số đêm */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="durationDays">
                Số Ngày <span className="text-rose-600">*</span>
              </label>
              <input
                id="durationDays"
                name="durationDays"
                type="number"
                min="1"
                max="60"
                value={formData.durationDays}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.durationDays ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.durationDays && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.durationDays}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="durationNights">
                Số Đêm <span className="text-rose-600">*</span>
              </label>
              <input
                id="durationNights"
                name="durationNights"
                type="number"
                min="0"
                max="60"
                value={formData.durationNights}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.durationNights ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.durationNights && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.durationNights}
                </p>
              )}
            </div>

            {/* Cảng khởi hành & Cảng đích */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="departurePort">
                Cảng Khởi Hành <span className="text-rose-600">*</span>
              </label>
              <input
                id="departurePort"
                name="departurePort"
                type="text"
                value={formData.departurePort}
                onChange={handleChange}
                placeholder="VD: Cảng Tuần Châu (Hạ Long)"
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.departurePort ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.departurePort && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.departurePort}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="destinationPort">
                Cảng Đích <span className="text-rose-600">*</span>
              </label>
              <input
                id="destinationPort"
                name="destinationPort"
                type="text"
                value={formData.destinationPort}
                onChange={handleChange}
                placeholder="VD: Cảng Tiên Sa (Đà Nẵng)"
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.destinationPort ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.destinationPort && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.destinationPort}
                </p>
              )}
            </div>

            {/* Ngày bắt đầu & Ngày kết thúc */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="startDate">
                Ngày Bắt Đầu <span className="text-rose-600">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.startDate ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.startDate && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="endDate">
                Ngày Kết Thúc <span className="text-rose-600">*</span>
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.endDate ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.endDate && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.endDate}
                </p>
              )}
            </div>

            {/* Sức chứa tối đa & Giá cơ bản */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="maxCapacity">
                Sức Chứa Tối Đa (Khách) <span className="text-rose-600">*</span>
              </label>
              <input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.maxCapacity ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.maxCapacity && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.maxCapacity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="basePrice">
                Giá Cơ Bản (VND) <span className="text-rose-600">*</span>
              </label>
              <input
                id="basePrice"
                name="basePrice"
                type="number"
                min="0"
                value={formData.basePrice}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-[#F7F4ED]/50 border rounded-xl text-xs text-[#252B32] focus:outline-none transition-colors ${
                  errors.basePrice ? 'border-rose-400 focus:border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10'
                }`}
              />
              {errors.basePrice && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.basePrice}
                </p>
              )}
            </div>

            {/* Trạng thái tour */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="status">
                Trạng Thái Tour
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10 transition-colors"
              >
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="PUBLISHED">Mở bán (PUBLISHED)</option>
                <option value="IN_PROGRESS">Đang khởi hành (IN_PROGRESS)</option>
                <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>

            {/* URL Hình ảnh */}
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="imageUrl">
                Ảnh Bìa Hải Trình (URL)
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10 transition-colors"
              />
            </div>

            {/* Tóm tắt lộ trình */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="itineraryOverview">
                Tóm Tắt Lộ Trình / Các Điểm Dừng
              </label>
              <textarea
                id="itineraryOverview"
                name="itineraryOverview"
                rows={2}
                value={formData.itineraryOverview}
                onChange={handleChange}
                placeholder="VD: Hạ Long - Cát Bà - Đảo Ti Tốp - Vịnh Lan Hạ"
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10 transition-colors"
              />
            </div>

            {/* Mô tả chi tiết */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="description">
                Mô Tả Chi Tiết Hải Trình
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả các dịch vụ, hoạt động nổi bật trong hải trình..."
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E0D7]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang lưu...' : tour ? 'Lưu Thay Đổi' : 'Tạo Tour Hải Trình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TourFormModal;
