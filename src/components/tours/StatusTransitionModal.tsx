import React, { useState } from 'react';
import { X, ArrowRightCircle, AlertCircle } from 'lucide-react';
import type { CruiseTour, TourStatus } from '../../services/tourService';
import { TOUR_STATUS_TRANSITIONS } from '../../services/tourService';

interface StatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: CruiseTour | null;
  onStatusChange: (id: number, targetStatus: TourStatus, reason?: string) => Promise<void>;
  isSubmitting?: boolean;
}

const STATUS_LABELS: Record<TourStatus, string> = {
  DRAFT: 'Bản nháp (DRAFT)',
  PUBLISHED: 'Mở bán (PUBLISHED)',
  IN_PROGRESS: 'Đang hành trình (IN_PROGRESS)',
  COMPLETED: 'Hoàn thành (COMPLETED)',
  CANCELLED: 'Đã hủy (CANCELLED)',
};

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  isOpen,
  onClose,
  tour,
  onStatusChange,
  isSubmitting = false,
}) => {
  const [targetStatus, setTargetStatus] = useState<TourStatus | ''>('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !tour) return null;

  const allowedTransitions = TOUR_STATUS_TRANSITIONS[tour.status] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) {
      setError('Vui lòng chọn trạng thái cần chuyển đổi');
      return;
    }

    if (targetStatus === 'CANCELLED' && !cancellationReason.trim()) {
      setError('Vui lòng nhập lý do hủy tour (thời tiết, kỹ thuật, an toàn...)');
      return;
    }

    try {
      await onStatusChange(tour.id, targetStatus as TourStatus, cancellationReason.trim() || undefined);
      onClose();
    } catch {
      // Error handled by caller
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
            <ArrowRightCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 id="status-modal-title" className="text-base font-bold text-white">
              Chuyển Trạng Thái Tour
            </h2>
            <p className="text-xs text-slate-400">{tour.name} ({tour.code})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Trạng thái hiện tại:</p>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-300 border border-slate-700 inline-block">
              {STATUS_LABELS[tour.status]}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="target-status">
              Chọn Trạng Thái Kế Tiếp:
            </label>
            {allowedTransitions.length === 0 ? (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                Tour đã ở trạng thái kết thúc (COMPLETED). Không thể chuyển đổi trạng thái tiếp theo.
              </p>
            ) : (
              <select
                id="target-status"
                value={targetStatus}
                onChange={(e) => {
                  setTargetStatus(e.target.value as TourStatus);
                  setError(null);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="">-- Chọn trạng thái hợp lệ --</option>
                {allowedTransitions.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            )}
          </div>

          {targetStatus === 'CANCELLED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="cancellationReason">
                Lý Do Hủy Tour <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="cancellationReason"
                rows={3}
                value={cancellationReason}
                onChange={(e) => {
                  setCancellationReason(e.target.value);
                  setError(null);
                }}
                placeholder="VD: Cảnh báo bão nhiệt đới số 3, hạn chế xuất bến tại Cảng..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || allowedTransitions.length === 0}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Xác Nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
