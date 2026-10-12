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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Chuyển Trạng Thái Hoạt Động</h3>
            <p className="text-xs text-slate-400 truncate max-w-xs">{activity.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">
              Trạng thái hiện tại
            </span>
            <div className="px-3 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs font-medium text-cyan-300">
              {getStatusLabel(currentStatus)}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">
              Chọn trạng thái chuyển tiếp
            </span>
            {allowedStatuses.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Hoạt động đã kết thúc (COMPLETED) và không thể chuyển trạng thái tiếp.
              </p>
            ) : (
              <div className="space-y-2">
                {allowedStatuses.map((st) => (
                  <label
                    key={st}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      activeStatus === st
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetStatus"
                      value={st}
                      checked={activeStatus === st}
                      onChange={() => setSelectedStatus(st)}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-xs font-semibold">{getStatusLabel(st)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {activeStatus === 'CANCELLED' && (
            <div>
              <label htmlFor="cancel-reason-textarea" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lý do hủy hoạt động <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="cancel-reason-textarea"
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="VD: Thời tiết biển có giông bão, sự cố kỹ thuật..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || allowedStatuses.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Đang cập nhật...' : 'Xác nhận chuyển đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
