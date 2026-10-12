import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Tag, PlusCircle, Edit3 } from 'lucide-react';
import type { ActivityFormData, DailyActivityItem } from '../../services/dailyItineraryService';
import { CATEGORY_LABELS } from '../../services/dailyItineraryService';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  dayNumber: number;
  dayTitle: string;
  initialData?: DailyActivityItem | null;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dayNumber,
  dayTitle,
  initialData,
}) => {
  const [formData, setFormData] = useState<ActivityFormData>({
    time: '09:00',
    title: '',
    location: '',
    category: 'ENTERTAINMENT',
    isIncluded: true,
    price: undefined,
    capacity: undefined,
    description: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        time: initialData.time,
        title: initialData.title,
        location: initialData.location,
        category: initialData.category,
        isIncluded: initialData.isIncluded,
        price: initialData.price,
        capacity: initialData.capacity,
        description: initialData.description || '',
      });
    } else {
      setFormData({
        time: '09:00',
        title: '',
        location: '',
        category: 'ENTERTAINMENT',
        isIncluded: true,
        price: undefined,
        capacity: undefined,
        description: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) {
      errs.title = 'Vui lòng nhập tên hoạt động';
    }
    if (!formData.time.trim()) {
      errs.time = 'Vui lòng chọn thời gian diễn ra';
    }
    if (!formData.location.trim()) {
      errs.location = 'Vui lòng nhập vị trí/địa điểm';
    }
    if (!formData.isIncluded && (!formData.price || formData.price <= 0)) {
      errs.price = 'Vui lòng nhập mức phí dịch vụ phát sinh (> 0)';
    }
    if (formData.capacity !== undefined && formData.capacity <= 0) {
      errs.capacity = 'Sức chứa phải lớn hơn 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
            {initialData ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {initialData ? 'Cập Nhật Hoạt Động Lịch Trình' : 'Thêm Hoạt Động Vào Lịch Trình'}
            </h3>
            <p className="text-xs text-slate-400">
              Ngày {dayNumber}: {dayTitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Giờ diễn ra <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {errors.time && <p className="text-[11px] text-rose-400 mt-1">{errors.time}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Phân loại danh mục <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as DailyActivityItem['category'] })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tên hoạt động <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="Vd: Gala Dinner Thuyền Trưởng, Khám phá Chùa Cầu..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            {errors.title && <p className="text-[11px] text-rose-400 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Địa điểm / Vị trí <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Vd: Tầng 7 - Grand Ballroom"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              {errors.location && <p className="text-[11px] text-rose-400 mt-1">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Giới hạn sức chứa (chỗ)</label>
              <input
                type="number"
                placeholder="Vd: 150 (bỏ trống nếu không giới hạn)"
                value={formData.capacity ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              {errors.capacity && <p className="text-[11px] text-rose-400 mt-1">{errors.capacity}</p>}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Gói dịch vụ đã bao gồm</span>
                <p className="text-[11px] text-slate-400">
                  {formData.isIncluded
                    ? 'Hoạt động miễn phí (nằm trong trọn gói tour du thuyền)'
                    : 'Dịch vụ có phụ thu phí phát sinh'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.isIncluded}
                onChange={(e) => setFormData({ ...formData, isIncluded: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 cursor-pointer"
              />
            </div>

            {!formData.isIncluded && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mức phí phát sinh (VND) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    placeholder="Vd: 350000"
                    value={formData.price ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {errors.price && <p className="text-[11px] text-rose-400 mt-1">{errors.price}</p>}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mô tả chi tiết / Ghi chú</label>
            <textarea
              rows={2}
              placeholder="Nội dung hoạt động, yêu cầu trang phục, hướng dẫn di chuyển..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20"
            >
              {isSubmitting
                ? 'Đang lưu...'
                : initialData
                ? 'Lưu Thay Đổi'
                : 'Thêm Vào Lịch Trình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
