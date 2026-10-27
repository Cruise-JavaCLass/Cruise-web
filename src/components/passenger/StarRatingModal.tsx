import React, { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { FeedbackCategory, SubmitPassengerReviewRequest } from '../../services/feedbackTypes';
import { passengerReviewService } from '../../services/passengerReviewService';

interface StarRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  defaultCategory?: FeedbackCategory;
  serviceOutlet?: string;
  onSuccess?: () => void;
}

export const StarRatingModal: React.FC<StarRatingModalProps> = ({
  isOpen,
  onClose,
  passengerId,
  passengerName,
  cabinNumber,
  defaultCategory = 'GENERAL_ONBOARD',
  serviceOutlet,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prevIsOpenRef = useRef<boolean>(isOpen);
  const sessionRef = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      sessionRef.current += 1;
      setRating(5);
      setHoverRating(0);
      setCategory(defaultCategory);
      setComments('');
      setErrorMessage(null);
      setIsSubmitting(false);
    } else if (!isOpen && prevIsOpenRef.current) {
      sessionRef.current += 1;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, defaultCategory]);

  useFocusTrap(isOpen, modalRef, onClose);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = sessionRef.current;
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: SubmitPassengerReviewRequest = {
      passengerId,
      passengerName,
      cabinNumber,
      category,
      rating,
      comments: comments.trim(),
      ...(serviceOutlet ? { serviceOutlet } : {}),
    };

    let submitSuccess = false;
    try {
      await passengerReviewService.submitReview(payload);
      submitSuccess = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi đánh giá';
      if (session === sessionRef.current) {
        setErrorMessage(msg);
      }
    } finally {
      if (session === sessionRef.current) {
        setIsSubmitting(false);
      }
    }

    if (submitSuccess && session === sessionRef.current) {
      if (onSuccess) {
        try {
          onSuccess();
        } catch (cbErr) {
          console.error('Error in onSuccess callback:', cbErr);
        }
      }
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E5E0D7] shadow-2xl transition-all focus:outline-none text-[#252B32]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D7] bg-[#F7F4ED] px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 rounded-full bg-[#C5A572]" />
            <h2 id="feedback-modal-title" className="text-base sm:text-lg font-bold text-[#102A43]">
              Đánh Giá Trải Nghiệm Dịch Vụ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5A6B7C] hover:text-[#102A43] hover:bg-[#E5E0D7]/40 transition cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Passenger Info Card */}
          <div className="flex items-center justify-between rounded-xl bg-[#F7F4ED] p-3.5 border border-[#E5E0D7] text-xs text-[#5A6B7C]">
            <div>
              Khách hàng: <span className="font-bold text-[#102A43]">{passengerName}</span>
            </div>
            <div>
              Cabin: <span className="font-bold text-[#102A43]">{cabinNumber}</span>
            </div>
          </div>

          {/* Star Rating Selector */}
          <div className="text-center space-y-2 py-2">
            <div className="block text-xs font-semibold text-[#102A43] uppercase tracking-wider">
              Mức độ hài lòng của quý khách
            </div>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const active = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-3xl transition-transform hover:scale-125 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#102A43] cursor-pointer"
                    aria-label={`${star} sao`}
                  >
                    <span className={active ? 'text-[#C5A572]' : 'text-[#E5E0D7]'}>★</span>
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-bold text-[#397C80]">
              {rating === 5 && 'Tuyệt vời, vượt mong đợi!'}
              {rating === 4 && 'Rất tốt, hài lòng!'}
              {rating === 3 && 'Bình thường, tạm chấp nhận'}
              {rating === 2 && 'Chưa tốt, cần cải thiện'}
              {rating === 1 && 'Rất không hài lòng!'}
            </div>
          </div>

          {/* Service Category */}
          <div>
            <label htmlFor="star-rating-category-select" className="block text-xs font-semibold text-[#102A43] mb-1.5">
              Phân loại dịch vụ
            </label>
            <select
              id="star-rating-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="w-full rounded-xl border border-[#E5E0D7] bg-[#F7F4ED]/40 px-3.5 py-2.5 text-xs text-[#252B32] focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] focus:outline-none"
            >
              <option value="CABIN_SERVICE">Dịch vụ dọn phòng / Cabin</option>
              <option value="DINING_EXPERIENCE">Ẩm thực & Nhà hàng</option>
              <option value="SHORE_EXCURSION">Tour bờ / Hướng dẫn viên</option>
              <option value="ENTERTAINMENT_ACTIVITY">Hoạt động giải trí trên tàu</option>
              <option value="GUEST_RELATIONS">Lễ tân & Chăm sóc khách hàng</option>
              <option value="GENERAL_ONBOARD">Tiện ích chung du thuyền</option>
            </select>
          </div>

          {/* Comments */}
          <div>
            <label htmlFor="star-rating-comments-textarea" className="block text-xs font-semibold text-[#102A43] mb-1.5">
              Ý kiến đóng góp chi tiết (Tùy chọn)
            </label>
            <textarea
              id="star-rating-comments-textarea"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Chia sẻ thêm cảm nhận hoặc vấn đề quý khách gặp phải..."
              className="w-full rounded-xl border border-[#E5E0D7] bg-[#F7F4ED]/40 p-3 text-xs text-[#252B32] placeholder-[#5A6B7C]/70 focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#E5E0D7] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5A6B7C] hover:text-[#102A43] bg-[#F7F4ED] border border-[#E5E0D7] hover:bg-[#ECE7DC] transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#102A43] hover:bg-[#0B1F33] px-5 py-2 text-xs font-semibold text-white shadow-md disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
