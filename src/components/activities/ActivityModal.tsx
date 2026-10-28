import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users, DollarSign, AlertCircle } from 'lucide-react';
import {
  type OnboardActivity,
  type CreateActivityPayload,
  type UpdateActivityPayload,
  createActivity,
  updateActivity,
} from '../../services/activityService';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saved: OnboardActivity) => void;
  activityToEdit?: OnboardActivity | null;
  defaultTourId?: number;
}

export function ActivityModal({
  isOpen,
  onClose,
  onSuccess,
  activityToEdit,
  defaultTourId = 1,
}: ActivityModalProps) {
  const isEditing = Boolean(activityToEdit);

  const [formData, setFormData] = useState({
    title: activityToEdit?.title || '',
    category: activityToEdit?.category || 'Wellness & Sức Khỏe',
    location: activityToEdit?.location || '',
    dayNumber: activityToEdit?.dayNumber || 1,
    activityDate: activityToEdit?.activityDate || '2026-11-01',
    startTime: activityToEdit?.startTime || '09:00',
    endTime: activityToEdit?.endTime || '10:30',
    maxCapacity: activityToEdit?.maxCapacity || 30,
    price: activityToEdit?.price || 0,
    isIncluded: activityToEdit?.isIncluded !== undefined ? activityToEdit.isIncluded : true,
    description: activityToEdit?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Sync state when editing activity changes
  React.useEffect(() => {
    if (activityToEdit) {
      setFormData({
        title: activityToEdit.title,
        category: activityToEdit.category,
        location: activityToEdit.location,
        dayNumber: activityToEdit.dayNumber,
        activityDate: activityToEdit.activityDate,
        startTime: activityToEdit.startTime,
        endTime: activityToEdit.endTime,
        maxCapacity: activityToEdit.maxCapacity,
        price: activityToEdit.price,
        isIncluded: activityToEdit.isIncluded,
        description: activityToEdit.description || '',
      });
    } else {
      setFormData({
        title: '',
        category: 'Wellness & Sức Khỏe',
        location: '',
        dayNumber: 1,
        activityDate: '2026-11-01',
        startTime: '09:00',
        endTime: '10:30',
        maxCapacity: 30,
        price: 0,
        isIncluded: true,
        description: '',
      });
    }
    setErrors({});
  }, [activityToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.title.trim()) {
      errs.title = 'Tên hoạt động không được để trống';
    }
    if (!formData.location.trim()) {
      errs.location = 'Địa điểm tổ chức không được để trống';
    }
    if (!formData.activityDate) {
      errs.activityDate = 'Ngày tổ chức không được để trống';
    }
    if (!formData.startTime) {
      errs.startTime = 'Thời gian bắt đầu không được để trống';
    }
    if (!formData.endTime) {
      errs.endTime = 'Thời gian kết thúc không được để trống';
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
      errs.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    if (formData.maxCapacity < 1) {
      errs.maxCapacity = 'Sức chứa tối đa phải lớn hơn 0';
    }
    if (!formData.isIncluded && formData.price <= 0) {
      errs.price = 'Hoạt động trả phí phải có mức giá lớn hơn 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditing && activityToEdit) {
        const payload: UpdateActivityPayload = {
          title: formData.title.trim(),
          category: formData.category,
          location: formData.location.trim(),
          dayNumber: Number(formData.dayNumber),
          activityDate: formData.activityDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxCapacity: Number(formData.maxCapacity),
          price: formData.isIncluded ? 0 : Number(formData.price),
          isIncluded: formData.isIncluded,
          description: formData.description.trim(),
        };
        const updated = await updateActivity(activityToEdit.id, payload);
        onSuccess(updated);
      } else {
        const payload: CreateActivityPayload = {
          tourId: defaultTourId,
          dayNumber: Number(formData.dayNumber),
          title: formData.title.trim(),
          category: formData.category,
          location: formData.location.trim(),
          activityDate: formData.activityDate,
          startTime: formData.startTime,
          endTime: formData.endTime,
          maxCapacity: Number(formData.maxCapacity),
          price: formData.isIncluded ? 0 : Number(formData.price),
          isIncluded: formData.isIncluded,
          description: formData.description.trim(),
        };
        const created = await createActivity(payload);
        onSuccess(created);
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu hoạt động';
      setErrors({ form: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-modal-title"
      className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col my-auto text-[#252B32]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D7] bg-[#F7F4ED] shrink-0">
          <div>
            <h3 id="activity-modal-title" className="font-serif text-lg font-bold text-[#102A43]">
              {isEditing ? 'Cập Nhật Hoạt Động Du Thuyền' : 'Tạo Hoạt Động Du Thuyền Mới'}
            </h3>
            <p className="text-xs text-[#252B32]/70 mt-0.5">
              Thiết lập khung giờ, địa điểm, sức chứa và chính sách dịch vụ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#252B32]/60 hover:text-[#102A43] hover:bg-[#ECE7DC] transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 bg-white">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="activity-form-title" className="block text-xs font-semibold text-[#102A43] mb-1.5">
              Tên hoạt động <span className="text-rose-600">*</span>
            </label>
            <input
              id="activity-form-title"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="VD: Yoga Bình Minh Trên Boong Tàu"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
            />
            {errors.title && <p className="text-[11px] text-rose-600 mt-1">{errors.title}</p>}
          </div>

          {/* Category & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="activity-form-category" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Danh mục <span className="text-rose-600">*</span>
              </label>
              <select
                id="activity-form-category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
              >
                <option value="Wellness & Sức Khỏe">Wellness & Sức Khỏe</option>
                <option value="Dining & Dạ Tiệc">Dining & Dạ Tiệc</option>
                <option value="Culinary & Ẩm Thực">Culinary & Ẩm Thực</option>
                <option value="Entertainment & Âm Nhạc">Entertainment & Âm Nhạc</option>
                <option value="Sports & Thể Thao">Sports & Thể Thao</option>
                <option value="Workshops & Giáo Dục">Workshops & Giáo Dục</option>
                <option value="Kids & Gia Đình">Kids & Gia Đình</option>
              </select>
            </div>

            <div>
              <label htmlFor="activity-form-location" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Địa điểm tổ chức <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#397C80] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="activity-form-location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  placeholder="VD: Tầng 12 - Sundeck"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
                />
              </div>
              {errors.location && <p className="text-[11px] text-rose-600 mt-1">{errors.location}</p>}
            </div>
          </div>

          {/* Day & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="activity-form-day-number" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Ngày số trong Tour
              </label>
              <input
                id="activity-form-day-number"
                type="number"
                min="1"
                max="30"
                value={formData.dayNumber}
                onChange={(e) => setFormData({ ...formData, dayNumber: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="activity-form-date" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Ngày diễn ra <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#397C80] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="activity-form-date"
                  type="date"
                  value={formData.activityDate}
                  onChange={(e) => {
                    setFormData({ ...formData, activityDate: e.target.value });
                    if (errors.activityDate) setErrors((prev) => ({ ...prev, activityDate: '' }));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
                />
              </div>
              {errors.activityDate && <p className="text-[11px] text-rose-600 mt-1">{errors.activityDate}</p>}
            </div>
          </div>

          {/* Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="activity-form-start-time" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Giờ bắt đầu <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#397C80] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="activity-form-start-time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => {
                    setFormData({ ...formData, startTime: e.target.value });
                    if (errors.startTime) setErrors((prev) => ({ ...prev, startTime: '' }));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
                />
              </div>
              {errors.startTime && <p className="text-[11px] text-rose-600 mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label htmlFor="activity-form-end-time" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Giờ kết thúc <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-[#397C80] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="activity-form-end-time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => {
                    setFormData({ ...formData, endTime: e.target.value });
                    if (errors.endTime) setErrors((prev) => ({ ...prev, endTime: '' }));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
                />
              </div>
              {errors.endTime && <p className="text-[11px] text-rose-600 mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Capacity & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="activity-form-capacity" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Sức chứa tối đa (Khách) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#397C80] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="activity-form-capacity"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.maxCapacity}
                  onChange={(e) => {
                    setFormData({ ...formData, maxCapacity: Number(e.target.value) });
                    if (errors.maxCapacity) setErrors((prev) => ({ ...prev, maxCapacity: '' }));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
                />
              </div>
              {errors.maxCapacity && <p className="text-[11px] text-rose-600 mt-1">{errors.maxCapacity}</p>}
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Gói dịch vụ & Chi phí
              </span>
              <div className="flex items-center gap-2 mt-2">
                <label htmlFor="activity-form-included" className="inline-flex items-center gap-2 text-xs text-[#252B32] cursor-pointer">
                  <input
                    id="activity-form-included"
                    type="checkbox"
                    checked={formData.isIncluded}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isIncluded: e.target.checked,
                        price: e.target.checked ? 0 : formData.price || 150000,
                      })
                    }
                    className="w-4 h-4 rounded text-[#102A43] border-[#E5E0D7] focus:ring-[#102A43]"
                  />
                  <span>Bao gồm trong tour (Miễn phí)</span>
                </label>
              </div>
            </div>
          </div>

          {!formData.isIncluded && (
            <div>
              <label htmlFor="activity-form-price" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Mức phí tham gia (VNĐ) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#397C80] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="activity-form-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: Number(e.target.value) });
                    if (errors.price) setErrors((prev) => ({ ...prev, price: '' }));
                  }}
                  placeholder="VD: 250000"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors"
                />
              </div>
              {errors.price && <p className="text-[11px] text-rose-600 mt-1">{errors.price}</p>}
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="activity-form-desc" className="block text-xs font-semibold text-[#102A43] mb-1.5">
              Mô tả chi tiết hoạt động
            </label>
            <textarea
              id="activity-form-desc"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Thông tin chi tiết về nội dung hoạt động, yêu cầu trang phục hoặc lưu ý an toàn..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-[#E5E0D7] flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : isEditing ? 'Cập Nhật' : 'Tạo Mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
