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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-modal-title"
    >
      <div className="relative w-full max-w-md bg-white border border-[#E5E0D7] rounded-2xl shadow-xl p-6 text-[#252B32]">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-[#5A6578] hover:text-[#102A43] p-1.5 rounded-lg hover:bg-[#E5E0D7]/50 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#E5E0D7]">
          <div className="w-9 h-9 rounded-xl bg-[#102A43] text-[#C5A572] flex items-center justify-center shadow-xs">
            <ArrowRightCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 id="status-modal-title" className="text-base font-bold font-serif text-[#102A43]">
              Chuyển Trạng Thái Tour
            </h2>
            <p className="text-xs text-[#5A6578]">{tour.name} ({tour.code})</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-[#5A6578] mb-1">Trạng thái hiện tại:</p>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] inline-block">
              {STATUS_LABELS[tour.status]}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="target-status">
              Chọn Trạng Thái Kế Tiếp:
            </label>
            {allowedTransitions.length === 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
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
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10 transition-colors"
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
              <label className="block text-xs font-semibold text-[#252B32] mb-1" htmlFor="cancellationReason">
                Lý Do Hủy Tour <span className="text-rose-600">*</span>
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
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#5A6578]/50 focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10 transition-colors"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-800 flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E0D7]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || allowedTransitions.length === 0}
              className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Xác Nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusTransitionModal;
