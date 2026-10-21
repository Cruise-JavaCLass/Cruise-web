import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const idempotencyKey = `FEEDBACK-${activityId}-${passengerId}-${Date.now()}`;
    const payload: ActivityFeedbackRequest = {
      passengerId,
      rating,
      organizationRating,
      guideRating,
      valueRating,
      comments: comments.trim() ? comments.trim() : undefined,
      idempotencyKey,
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
        <span className="text-xs text-slate-300 font-medium">{label}</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              data-testid={`${testIdPrefix}-star-${star}`}
              onClick={() => onChange(star)}
              className="p-1 text-slate-600 hover:text-amber-400 transition-colors focus:outline-none"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= value
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-xs font-bold text-amber-400 w-4">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
      data-testid="activity-feedback-modal"
    >
      <div className="bg-[#0a0f1d] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          data-testid="close-feedback-modal"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Đánh Giá Trải Nghiệm</h3>
                <p className="text-xs text-slate-400">Hoạt động: {activityTitle}</p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Overall Rating */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Mức độ hài lòng tổng quan
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      data-testid={`overall-star-${star}`}
                      onClick={() => setRating(star)}
                      className="p-1.5 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating <= 2 && (
                  <p className="text-[11px] text-rose-400 font-medium mt-2 animate-pulse">
                    ⚠️ Chúng tôi rất tiếc vì bạn chưa hài lòng. Ý kiến của bạn sẽ được chuyển ngay đến Trưởng bộ phận CSKH.
                  </p>
                )}
              </div>

              {/* Multi-criteria Ratings */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Đánh giá chi tiết
                </h4>
                {renderStarRating(organizationRating, setOrganizationRating, 'Công tác tổ chức & đúng giờ', 'org')}
                {renderStarRating(guideRating, setGuideRating, 'Thái độ hướng dẫn viên / điều phối', 'guide')}
                {renderStarRating(valueRating, setValueRating, 'Độ hài lòng so với chi phí', 'value')}
              </div>

              {/* Comments */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  Ý kiến đóng góp thêm
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  data-testid="feedback-comments-input"
                  placeholder="Chia sẻ thêm cảm nhận hoặc góp ý để chúng tôi phục vụ tốt hơn..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-feedback-button"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6" data-testid="feedback-success-state">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Cảm Ơn Phản Hồi Của Quý Khách!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto mb-4 leading-relaxed">
              {submittedResponse?.escalated
                ? 'Đánh giá của bạn đã được chuyển khẩn cấp tới Giám đốc chăm sóc khách hàng để nâng cấp chất lượng dịch vụ.'
                : 'Ý kiến quý báu của bạn giúp chúng tôi không ngừng hoàn thiện trải nghiệm trên mỗi hải trình.'}
            </p>
            <button
              onClick={onClose}
              data-testid="feedback-done-button"
              className="px-6 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
