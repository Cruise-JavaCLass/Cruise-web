import React, { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
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
  const [resolvedBy, setResolvedBy] = useState<string>(review?.resolvedBy || 'GuestRelationsManager');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const triageSessionRef = useRef(0);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Synchronize triage fields when review opens or changes
  useEffect(() => {
    triageSessionRef.current += 1;
    setIsSubmitting(false);
    if (review) {
      setStatus(review.status || 'UNDER_REVIEW');
      setAdminNotes(review.adminNotes || '');
      setResolvedBy(review.resolvedBy || 'GuestRelationsManager');
      setErrorMessage(null);
    } else {
      setStatus('UNDER_REVIEW');
      setAdminNotes('');
      setResolvedBy('GuestRelationsManager');
      setErrorMessage(null);
    }
  }, [review?.id, isOpen]);

  useFocusTrap(isOpen && Boolean(review), drawerRef, onClose);

  if (!isOpen || !review) return null;

  const handleSaveTriage = async () => {
    const session = triageSessionRef.current;
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: TriageReviewRequest = {
      status,
      adminNotes: adminNotes.trim(),
      resolvedBy,
    };

    let updatedResult: PassengerServiceReviewResponse | null = null;
    try {
      updatedResult = await passengerReviewService.triageReview(review.id, payload);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái';
      if (session === triageSessionRef.current) {
        setErrorMessage(msg);
      }
    } finally {
      if (session === triageSessionRef.current) {
        setIsSubmitting(false);
      }
    }

    if (updatedResult && session === triageSessionRef.current) {
      if (onTriageSuccess) {
        try {
          onTriageSuccess(updatedResult);
        } catch (cbErr) {
          console.error('Error in onTriageSuccess callback:', cbErr);
        }
      }
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="triage-drawer-title"
    >
      <div
        ref={drawerRef}
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col p-6 text-[#252B32] border-l border-[#E5E0D7]"
      >
        {/* Header (pinned to top) */}
        <div className="flex items-center justify-between border-b border-[#E5E0D7] pb-4 shrink-0">
          <h2 id="triage-drawer-title" className="text-lg font-bold text-[#102A43]">
            Xử Lý Phản Hồi Khách Hàng #{review.id}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#252B32]/60 hover:bg-[#F7F4ED] hover:text-[#102A43] transition-colors cursor-pointer"
            aria-label="Đóng drawer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Review Details Card */}
          <div className="rounded-2xl bg-[#F7F4ED]/60 p-4 border border-[#E5E0D7] space-y-2 text-xs">
            <div className="flex justify-between font-bold text-[#102A43]">
              <span>{review.passengerName}</span>
              <span className="text-[#397C80] font-mono">{review.cabinNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-700 font-bold">★ {review.rating}/5</span>
              <span className="text-[11px] text-[#252B32]/60">• {review.category}</span>
              {review.isLowRatingAlert && (
                <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  Cảnh báo điểm thấp
                </span>
              )}
            </div>
            {review.comments && (
              <p className="text-xs text-[#252B32] bg-white p-2.5 rounded-xl border border-[#E5E0D7] mt-2 italic">
                "{review.comments}"
              </p>
            )}
          </div>

          {/* Triage Status Selection */}
          <div>
            <label htmlFor="triage-status-select" className="block text-xs font-semibold text-[#102A43] mb-1">
              Trạng thái xử lý
            </label>
            <select
              id="triage-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as FeedbackStatus)}
              className="w-full rounded-xl bg-[#F7F4ED]/50 border border-[#E5E0D7] px-3 py-2 text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
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
            <label htmlFor="triage-admin-notes-textarea" className="block text-xs font-semibold text-[#102A43] mb-1">
              Ghi chú xử lý / Đền bù (Resolution Notes)
            </label>
            <textarea
              id="triage-admin-notes-textarea"
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Nhập hành động khắc phục, liên hệ trực tiếp phòng, voucher đền bù..."
              className="w-full rounded-xl bg-[#F7F4ED]/50 border border-[#E5E0D7] p-3 text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>

          {/* Assigned Staff */}
          <div>
            <label htmlFor="triage-resolved-by-input" className="block text-xs font-semibold text-[#102A43] mb-1">
              Nhân sự phụ trách
            </label>
            <input
              id="triage-resolved-by-input"
              type="text"
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              className="w-full rounded-xl bg-[#F7F4ED]/50 border border-[#E5E0D7] px-3 py-2 text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>
        </div>

        {/* Footer Actions (pinned to bottom) */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E5E0D7] pt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-[#102A43] bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveTriage}
            className="rounded-xl bg-[#102A43] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0B1F33] disabled:opacity-50 transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Kết Quả Xử Lý'}
          </button>
        </div>
      </div>
    </div>
  );
};
