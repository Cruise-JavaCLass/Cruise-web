import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import type { Port, StopFormData } from '../../services/portStopService';

interface StopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StopFormData) => Promise<void>;
  ports: Port[];
  tourStartDate?: string;
  tourEndDate?: string;
}

export const StopFormModal: React.FC<StopFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  ports,
  tourStartDate,
  tourEndDate,
}) => {
  const [formData, setFormData] = useState<StopFormData>({
    portId: '',
    stopOrder: 1,
    arrivalTime: '',
    departureTime: '',
    allAboardTime: '',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.portId) {
      errs.portId = 'Vui lòng chọn cảng ghé';
    }
    if (!formData.stopOrder || Number(formData.stopOrder) < 1) {
      errs.stopOrder = 'Thứ tự điểm dừng phải là số nguyên dương';
    }
    if (!formData.arrivalTime) {
      errs.arrivalTime = 'Vui lòng chọn thời gian cập cảng';
    }
    if (!formData.departureTime) {
      errs.departureTime = 'Vui lòng chọn thời gian rời cảng';
    }

    if (formData.arrivalTime && formData.departureTime) {
      if (formData.arrivalTime >= formData.departureTime) {
        errs.departureTime = 'Thời gian rời cảng phải sau thời gian cập cảng';
      }
    }

    if (formData.allAboardTime && formData.arrivalTime && formData.departureTime) {
      if (formData.allAboardTime < formData.arrivalTime || formData.allAboardTime > formData.departureTime) {
        errs.allAboardTime = 'Giờ lên tàu (all-aboard) phải nằm giữa giờ cập cảng và rời cảng';
      }
    }

    if (tourStartDate && formData.arrivalTime) {
      const arrDate = formData.arrivalTime.slice(0, 10);
      if (arrDate < tourStartDate) {
        errs.arrivalTime = `Thời gian cập cảng không thể trước ngày bắt đầu tour (${tourStartDate})`;
      }
    }

    if (tourEndDate && formData.departureTime) {
      const depDate = formData.departureTime.slice(0, 10);
      if (depDate > tourEndDate) {
        errs.departureTime = `Thời gian rời cảng không thể sau ngày kết thúc tour (${tourEndDate})`;
      }
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

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Thêm Điểm Dừng Hải Trình</h2>
            <p className="text-xs text-slate-400">Thiết lập cảng ghé, thời gian cập cảng và rời bến</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="port-select">
                Cảng Ghé <span className="text-rose-400">*</span>
              </label>
              <select
                id="port-select"
                aria-label="Cảng Ghé"
                value={formData.portId}
                onChange={(e) => setFormData({ ...formData, portId: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Chọn Cảng Ghé --</option>
                {ports.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) - {p.city}
                  </option>
                ))}
              </select>
              {errors.portId && <p className="text-[11px] text-rose-400 mt-1">{errors.portId}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="stop-order">
                Thứ Tự Điểm Dừng <span className="text-rose-400">*</span>
              </label>
              <input
                id="stop-order"
                type="number"
                aria-label="Thứ Tự Điểm Dừng"
                value={formData.stopOrder}
                onChange={(e) => setFormData({ ...formData, stopOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-cyan-500"
              />
              {errors.stopOrder && <p className="text-[11px] text-rose-400 mt-1">{errors.stopOrder}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="arrival-time">
                Thời Gian Cập Cảng (Arrival) <span className="text-rose-400">*</span>
              </label>
              <input
                id="arrival-time"
                type="datetime-local"
                aria-label="Thời Gian Cập Cảng (Arrival)"
                value={formData.arrivalTime}
                onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-cyan-500"
              />
              {errors.arrivalTime && <p className="text-[11px] text-rose-400 mt-1">{errors.arrivalTime}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="departure-time">
                Thời Gian Rời Cảng (Departure) <span className="text-rose-400">*</span>
              </label>
              <input
                id="departure-time"
                type="datetime-local"
                aria-label="Thời Gian Rời Cảng (Departure)"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-cyan-500"
              />
              {errors.departureTime && <p className="text-[11px] text-rose-400 mt-1">{errors.departureTime}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="all-aboard-time">
              Thời Gian Lên Tàu (All-Aboard)
            </label>
            <input
              id="all-aboard-time"
              type="datetime-local"
              aria-label="Thời Gian Lên Tàu (All-Aboard)"
              value={formData.allAboardTime || ''}
              onChange={(e) => setFormData({ ...formData, allAboardTime: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-cyan-500"
            />
            {errors.allAboardTime && <p className="text-[11px] text-rose-400 mt-1">{errors.allAboardTime}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="stop-description">
              Mô Tả / Hoạt Động Tại Cảng
            </label>
            <textarea
              id="stop-description"
              rows={2}
              aria-label="Mô Tả / Hoạt Động Tại Cảng"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="VD: Cập bến tham quan đảo Titop, hang Sửng Sốt..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
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
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Điểm Dừng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
