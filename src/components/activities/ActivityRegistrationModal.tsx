import React, { useState } from 'react';
import {
  X,
  Users,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ShieldAlert
} from 'lucide-react';
import {
  activityRegistrationService,
  type ActivityRegistrationResponse
} from '../../services/activityRegistrationService';

export interface ActivityRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: {
    id: number;
    title: string;
    location: string;
    activityDate: string;
    startTime: string;
    endTime: string;
    price: number;
    remainingCapacity?: number;
    maxCapacity?: number;
    currentParticipants?: number;
    isIncluded?: boolean;
    cancellationCutOffMinutes?: number;
  };
  currentPassenger?: {
    id: number;
    fullName: string;
    cabinNumber: string;
  };
  onSuccess?: (response: ActivityRegistrationResponse) => void;
}

export const ActivityRegistrationModal: React.FC<ActivityRegistrationModalProps> = ({
  isOpen,
  onClose,
  activity,
  currentPassenger = { id: 101, fullName: 'Trần Minh Hoàng', cabinNumber: '812' },
  onSuccess
}) => {
  const [passengerId, setPassengerId] = useState<number>(currentPassenger.id);
  const [cabinNumber, setCabinNumber] = useState<string>(currentPassenger.cabinNumber);
  const [notes, setNotes] = useState<string>('');
  const [agreedToPolicy, setAgreedToPolicy] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<ActivityRegistrationResponse | null>(null);

  if (!isOpen) return null;

  const remaining = activity.remainingCapacity !== undefined
    ? activity.remainingCapacity
    : (activity.maxCapacity !== undefined ? Math.max(0, activity.maxCapacity - (activity.currentParticipants || 0)) : 0);

  const isWaitlist = remaining <= 0;
  const isPaid = !activity.isIncluded && activity.price > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToPolicy) {
      setErrorMessage('Vui lòng đồng ý với chính sách hủy và điều khoản trừ nợ Folio');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await activityRegistrationService.registerActivity(activity.id, {
        passengerId: Number(passengerId),
        cabinNumber: cabinNumber.trim(),
        notes: notes.trim() || undefined
      });

      setSuccessResult(response);
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } } };
      if (errorObj?.response?.status === 409) {
        setErrorMessage('Hành khách này đã đăng ký tham gia hoặc đang trong danh sách chờ của hoạt động!');
      } else if (errorObj?.response?.status === 402) {
        setErrorMessage('Tài khoản cabin Folio đang bị tạm khóa chi tiêu hoặc không đủ hạn mức thanh toán.');
      } else {
        setErrorMessage(errorObj?.response?.data?.message || 'Có lỗi xảy ra khi thực hiện đăng ký. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-registration-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl border border-[#E5E0D7] text-[#252B32]">
        {/* Header */}
        <div className={`p-6 border-b border-[#E5E0D7] ${isWaitlist ? 'bg-amber-50/70' : 'bg-[#F7F4ED]'}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-5 right-5 rounded-lg p-1.5 text-[#252B32]/60 hover:text-[#102A43] hover:bg-[#ECE7DC] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
              isWaitlist
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/15'
            }`}>
              {isWaitlist ? 'Hàng Đợi Waitlist' : 'Đăng Ký Hoạt Động'}
            </span>
          </div>

          <h2 id="modal-registration-title" className="font-serif text-xl font-bold text-[#102A43]">{activity.title}</h2>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#252B32]/80">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-[#397C80]" /> {activity.activityDate}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-[#397C80]" /> {activity.startTime} - {activity.endTime}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#397C80]" /> {activity.location}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white">
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#102A43]">
                {successResult.status === 'CONFIRMED' ? 'Đăng Ký Thành Công!' : 'Đã Gia Nhập Danh Sách Chờ!'}
              </h3>
              <p className="text-sm text-[#252B32]/80">
                {successResult.status === 'CONFIRMED'
                  ? `Suất tham gia của quý khách đã được xác nhận. Mã giao dịch Folio: ${successResult.transactionId || 'Miễn phí'}`
                  : `Hoạt động hiện đã kín chỗ. Quý khách đang ở vị trí thứ ${successResult.waitlistPosition || 1} trong danh sách chờ. Khi có hành khách hủy, hệ thống sẽ tự động đôn suất cho quý khách.`}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white font-bold shadow-xs transition-colors"
                >
                  Hoàn Tất
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Capacity Status Badge */}
              <div className="p-3.5 rounded-xl bg-[#F7F4ED]/60 border border-[#E5E0D7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#397C80]" />
                  <span className="text-xs font-semibold text-[#102A43]">Trạng thái chỗ ngồi:</span>
                </div>
                {isWaitlist ? (
                  <span data-testid="status-badge-waitlist" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" /> Hết chỗ - Tham gia danh sách chờ (Waitlist)
                  </span>
                ) : (
                  <span data-testid="status-badge-available" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Còn {remaining} chỗ trống
                  </span>
                )}
              </div>

              {/* Price & Billing Information */}
              <div className="p-3.5 rounded-xl bg-[#F7F4ED]/60 border border-[#E5E0D7] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#397C80]" />
                  <span className="text-xs font-semibold text-[#102A43]">Chi phí dịch vụ:</span>
                </div>
                <div className="text-right">
                  {isPaid ? (
                    <div>
                      <span className="text-sm font-extrabold text-[#102A43]">
                        {activity.price.toLocaleString('vi-VN')} VND
                      </span>
                      <span className="block text-[10px] text-[#252B32]/60">Trừ trực tiếp vào cabin Folio</span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700">
                      Miễn Phí (Đã bao gồm)
                    </span>
                  )}
                </div>
              </div>

              {/* Passenger ID & Cabin input */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-passenger-id" className="block text-xs font-semibold text-[#102A43] mb-1">
                    ID Hành Khách
                  </label>
                  <input
                    id="reg-passenger-id"
                    type="number"
                    value={passengerId}
                    onChange={(e) => setPassengerId(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E0D7] bg-white text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-cabin-number" className="block text-xs font-semibold text-[#102A43] mb-1">
                    Số Cabin
                  </label>
                  <input
                    id="reg-cabin-number"
                    type="text"
                    value={cabinNumber}
                    onChange={(e) => setCabinNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E0D7] bg-white text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label htmlFor="reg-notes" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Ghi chú hoặc yêu cầu đặc biệt (tùy chọn)
                </label>
                <textarea
                  id="reg-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Dị ứng thực phẩm, cần hỗ trợ chỗ ngồi xe lăn..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E0D7] bg-white text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] resize-none"
                />
              </div>

              {/* Cancellation Policy Notice */}
              <div className="p-3 rounded-xl bg-[#F7F4ED] border border-[#E5E0D7] text-[11px] text-[#252B32] flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#397C80]" />
                <div>
                  <strong>Chính sách hủy:</strong> Hủy trước {activity.cancellationCutOffMinutes || 120} phút sẽ được hoàn 100% vào tài khoản Folio. Hủy sau thời hạn trên có thể bị phạt phí hoặc không được hoàn tiền.
                </div>
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={(e) => setAgreedToPolicy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#102A43] focus:ring-[#102A43] border-[#E5E0D7]"
                />
                <span className="text-xs text-[#252B32]/80">
                  Tôi xác nhận thông tin đăng ký chính xác và đồng ý với điều khoản dịch vụ du thuyền.
                </span>
              </label>

              {/* Error banner */}
              {errorMessage && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-xs transition-colors ${
                    isWaitlist
                      ? 'bg-[#397C80] hover:bg-[#2e6467]'
                      : 'bg-[#102A43] hover:bg-[#0B1F33]'
                  } disabled:opacity-50`}
                >
                  {isSubmitting
                    ? 'Đang xử lý...'
                    : (isWaitlist ? 'Gia Nhập Danh Sách Chờ (Waitlist)' : 'Xác Nhận Đăng Ký')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
