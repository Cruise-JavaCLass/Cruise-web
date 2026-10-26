import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { OnboardActivity, ActivityStatus } from '../../services/activityService';
import { updateActivityStatus } from '../../services/activityService';

interface ActivityStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: OnboardActivity) => void;
  activity: OnboardActivity | null;
}

export function ActivityStatusModal({
  isOpen,
  onClose,
  onSuccess,
  activity,
}: ActivityStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ActivityStatus | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !activity) return null;

  const currentStatus = activity.status;

  // Allowed transitions based on state machine
  const getAllowedStatuses = (): ActivityStatus[] => {
    switch (currentStatus) {
      case 'SCHEDULED':
        return ['IN_PROGRESS', 'CANCELLED'];
      case 'IN_PROGRESS':
        return ['COMPLETED', 'CANCELLED'];
      case 'CANCELLED':
        return ['SCHEDULED'];
      case 'COMPLETED':
      default:
        return [];
    }
  };

  const allowedStatuses = getAllowedStatuses();
  const activeStatus = selectedStatus ?? (allowedStatuses[0] || currentStatus);

  const getStatusLabel = (status: ActivityStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Lên lịch (SCHEDULED)';
      case 'IN_PROGRESS':
        return 'Đang diễn ra (IN_PROGRESS)';
      case 'COMPLETED':
        return 'Đã hoàn thành (COMPLETED)';
      case 'CANCELLED':
        return 'Hủy bỏ (CANCELLED)';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStatus === 'CANCELLED' && !cancellationReason.trim()) {
      setError('Vui lòng nhập lý do hủy hoạt động để thông báo cho hành khách');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateActivityStatus(activity.id, {
        status: activeStatus,
        cancellationReason: activeStatus === 'CANCELLED' ? cancellationReason.trim() : undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-md shadow-xl overflow-hidden text-[#252B32]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D7] bg-[#F7F4ED]">
          <div>
            <h3 className="font-serif text-base font-bold text-[#102A43]">Chuyển Trạng Thái Hoạt Động</h3>
            <p className="text-xs text-[#252B32]/70 truncate max-w-xs mt-0.5">{activity.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 text-[#252B32]/60 hover:text-[#102A43] rounded-lg hover:bg-[#ECE7DC] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold text-[#102A43] mb-1.5">
              Trạng thái hiện tại
            </span>
            <div className="px-3 py-2 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl text-xs font-semibold text-[#102A43]">
              {getStatusLabel(currentStatus)}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#102A43] mb-1.5">
              Chọn trạng thái chuyển tiếp
            </span>
            {allowedStatuses.length === 0 ? (
              <p className="text-xs text-[#252B32]/60 italic">
                Hoạt động đã kết thúc (COMPLETED) và không thể chuyển trạng thái tiếp.
              </p>
            ) : (
              <div className="space-y-2">
                {allowedStatuses.map((st) => (
                  <label
                    key={st}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      activeStatus === st
                        ? 'border-[#102A43] bg-[#F7F4ED] text-[#102A43] font-semibold'
                        : 'border-[#E5E0D7] bg-white text-[#252B32] hover:border-[#102A43]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetStatus"
                      value={st}
                      checked={activeStatus === st}
                      onChange={() => setSelectedStatus(st)}
                      className="text-[#102A43] focus:ring-[#102A43]"
                    />
                    <span className="text-xs">{getStatusLabel(st)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {activeStatus === 'CANCELLED' && (
            <div>
              <label htmlFor="cancel-reason-textarea" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Lý do hủy hoạt động <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="cancel-reason-textarea"
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="VD: Thời tiết biển có giông bão, sự cố kỹ thuật..."
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-colors resize-none"
              />
            </div>
          )}

          <div className="pt-4 border-t border-[#E5E0D7] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || allowedStatuses.length === 0}
              className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Đang cập nhật...' : 'Xác nhận chuyển đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
