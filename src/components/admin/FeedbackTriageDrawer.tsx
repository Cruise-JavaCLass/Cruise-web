import React, { useState } from 'react';
import type {
  PassengerServiceReviewResponse,
  FeedbackStatus,
  TriageReviewRequest,
} from '../../services/feedbackTypes';
import { passengerReviewService } from '../../services/passengerReviewService';

interface FeedbackTriageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  review: PassengerServiceReviewResponse | null;
  onTriageSuccess?: (updated: PassengerServiceReviewResponse) => void;
}

export const FeedbackTriageDrawer: React.FC<FeedbackTriageDrawerProps> = ({
  isOpen,
  onClose,
  review,
  onTriageSuccess,
}) => {
  const [status, setStatus] = useState<FeedbackStatus>(review?.status || 'UNDER_REVIEW');
  const [adminNotes, setAdminNotes] = useState<string>(review?.adminNotes || '');
  const [resolvedBy, setResolvedBy] = useState<string>('GuestRelationsManager');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !review) return null;

  const handleSaveTriage = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: TriageReviewRequest = {
      status,
      adminNotes: adminNotes.trim(),
      resolvedBy,
    };

    try {
      const updated = await passengerReviewService.triageReview(review.id, payload);
      if (onTriageSuccess) onTriageSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="triage-drawer-title"
    >
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between p-6">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 id="triage-drawer-title" className="text-lg font-bold text-gray-900">
              Xử Lý Phản Hồi Khách Hàng #{review.id}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              aria-label="Đóng drawer"
            >
              ✕
            </button>
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Review Details Card */}
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-100 space-y-2 text-sm">
            <div className="flex justify-between font-bold text-gray-900">
              <span>{review.passengerName}</span>
              <span className="text-indigo-600">{review.cabinNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-bold">★ {review.rating}/5</span>
              <span className="text-xs text-gray-500">• {review.category}</span>
              {review.isLowRatingAlert && (
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  Cảnh báo điểm thấp
                </span>
              )}
            </div>
            {review.comments && (
              <p className="text-xs text-gray-700 bg-white p-2.5 rounded-xl border border-gray-200 mt-2">
                "{review.comments}"
              </p>
            )}
          </div>

          {/* Triage Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Trạng thái xử lý
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="NEW">Mới tiếp nhận (NEW)</option>
              <option value="UNDER_REVIEW">Đang kiểm tra & liên hệ (UNDER_REVIEW)</option>
              <option value="ESCALATED">Leo thang quản lý cấp cao (ESCALATED)</option>
              <option value="RESOLVED">Đã giải quyết thỏa đáng (RESOLVED)</option>
              <option value="DISMISSED">Bỏ qua / Không hợp lệ (DISMISSED)</option>
            </select>
          </div>

          {/* Admin / Resolution Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Ghi chú xử lý / Đền bù (Resolution Notes)
            </label>
            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Nhập hành động khắc phục, liên hệ trực tiếp phòng, voucher đền bù..."
              className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Assigned Staff */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Nhân sự phụ trách
            </label>
            <input
              type="text"
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveTriage}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Kết Quả Xử Lý'}
          </button>
        </div>
      </div>
    </div>
  );
};
