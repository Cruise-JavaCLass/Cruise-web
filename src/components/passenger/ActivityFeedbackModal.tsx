import React, { useState, useRef } from 'react';
import {
  Star,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import {
  passengerNotificationService,
  type ActivityFeedbackRequest,
  type ActivityFeedbackResponse,
} from '../../services/passengerNotificationService';

interface ActivityFeedbackModalProps {
  activityId: number;
  activityTitle: string;
  passengerId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (feedback: ActivityFeedbackResponse) => void;
}

export const ActivityFeedbackModal: React.FC<ActivityFeedbackModalProps> = ({
  activityId,
  activityTitle,
  passengerId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [organizationRating, setOrganizationRating] = useState<number>(5);
  const [guideRating, setGuideRating] = useState<number>(5);
  const [valueRating, setValueRating] = useState<number>(5);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [submittedResponse, setSubmittedResponse] = useState<ActivityFeedbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmittingRef = useRef<boolean>(false);
  const idempotencyKeyRef = useRef<string>(`FEEDBACK-${activityId}-${passengerId}-${Date.now()}`);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    const payload: ActivityFeedbackRequest = {
      passengerId,
      rating,
      organizationRating,
      guideRating,
      valueRating,
      comments: comments.trim() ? comments.trim() : undefined,
      idempotencyKey: idempotencyKeyRef.current,
    };

    try {
      const res = await passengerNotificationService.submitActivityFeedback(activityId, payload);
      setSubmittedResponse(res);
      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch {
      setError('Không thể gửi đánh giá. Vui lòng kiểm tra lại kết nối và thử lại.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    value: number,
    onChange: (val: number) => void,
    label: string,
    testIdPrefix: string
  ) => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1">
        <span className="text-xs text-[#252B32] font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              data-testid={`${testIdPrefix}-star-${star}`}
              onClick={() => onChange(star)}
              className="p-1 text-[#E5E0D7] hover:text-[#C5A572] transition-colors focus:outline-none"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= value
                    ? 'fill-[#C5A572] text-[#C5A572]'
                    : 'text-[#E5E0D7]'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-xs font-bold text-[#102A43] w-4">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      data-testid="activity-feedback-modal"
    >
      <div className="bg-white border border-[#E5E0D7] rounded-2xl max-w-lg w-full shadow-2xl relative text-[#252B32] overflow-hidden">
        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A572]/15 border border-[#C5A572]/30 flex items-center justify-center text-[#9E7A3E]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#102A43]">Đánh Giá Trải Nghiệm</h3>
                  <p className="text-xs text-[#5A6B7C]">Hoạt động: {activityTitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                data-testid="close-feedback-modal"
                aria-label="Đóng"
                className="p-2 rounded-xl text-[#5A6B7C] hover:text-[#102A43] hover:bg-[#E5E0D7]/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Overall Rating */}
                <div className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl p-4 text-center">
                  <span className="block text-xs font-semibold text-[#102A43] uppercase tracking-wider mb-2">
                    Mức độ hài lòng tổng quan
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        data-testid={`overall-star-${star}`}
                        onClick={() => setRating(star)}
                        aria-label={`${star} sao`}
                        className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= rating
                              ? 'fill-[#C5A572] text-[#C5A572]'
                              : 'text-[#E5E0D7]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating <= 2 && (
                    <p className="text-[11px] text-rose-600 font-medium mt-2 animate-pulse">
                      ⚠️ Chúng tôi rất tiếc vì bạn chưa hài lòng. Ý kiến của bạn sẽ được chuyển ngay đến Trưởng bộ phận CSKH.
                    </p>
                  )}
                </div>

                {/* Multi-criteria Ratings */}
                <div className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-[#102A43] uppercase tracking-wider mb-1">
                    Đánh giá chi tiết
                  </h4>
                  {renderStarRating(organizationRating, setOrganizationRating, 'Công tác tổ chức & đúng giờ', 'org')}
                  {renderStarRating(guideRating, setGuideRating, 'Thái độ hướng dẫn viên / điều phối', 'guide')}
                  {renderStarRating(valueRating, setValueRating, 'Độ hài lòng so với chi phí', 'value')}
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-xs font-semibold text-[#102A43] mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#397C80]" />
                    Ý kiến đóng góp thêm
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    data-testid="feedback-comments-input"
                    placeholder="Chia sẻ thêm cảm nhận hoặc góp ý để chúng tôi phục vụ tốt hơn..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F4ED]/40 border border-[#E5E0D7] text-[#252B32] placeholder-[#5A6B7C]/70 text-xs focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5E0D7]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5A6B7C] hover:text-[#102A43] bg-[#F7F4ED] border border-[#E5E0D7] hover:bg-[#ECE7DC] transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-feedback-button"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#102A43] hover:bg-[#0B1F33] text-white flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="text-center p-8" data-testid="feedback-success-state">
            <div className="w-14 h-14 rounded-full bg-[#397C80]/15 border border-[#397C80]/30 flex items-center justify-center text-[#397C80] mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#102A43] mb-1">Cảm Ơn Phản Hồi Của Quý Khách!</h3>
            <p className="text-xs text-[#5A6B7C] max-w-sm mx-auto mb-5 leading-relaxed">
              {submittedResponse?.escalated
                ? 'Đánh giá của bạn đã được chuyển khẩn cấp tới Giám đốc chăm sóc khách hàng để nâng cấp chất lượng dịch vụ.'
                : 'Ý kiến quý báu của bạn giúp chúng tôi không ngừng hoàn thiện trải nghiệm trên mỗi hải trình.'}
            </p>
            <button
              onClick={onClose}
              data-testid="feedback-done-button"
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#102A43] hover:bg-[#0B1F33] text-white shadow-md transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
