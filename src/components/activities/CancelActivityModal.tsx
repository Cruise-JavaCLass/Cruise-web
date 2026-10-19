import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  activityRegistrationService,
  type ActivityCancellationResponse
} from '../../services/activityRegistrationService';

export interface CancelActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: {
    registrationId: number;
    activityId: number;
    activityTitle: string;
    activityDate?: string;
    startTime?: string;
    chargedAmount?: number;
    cancellationCutOffMinutes?: number;
    passengerId?: number;
  };
  onSuccess?: (result: ActivityCancellationResponse) => void;
}

export const CancelActivityModal: React.FC<CancelActivityModalProps> = ({
  isOpen,
  onClose,
  registration,
  onSuccess
}) => {
  const [reason, setReason] = useState<string>('Thay đổi kế hoạch cá nhân');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cancelResult, setCancelResult] = useState<ActivityCancellationResponse | null>(null);

  if (!isOpen) return null;

  const charged = registration.chargedAmount || 0;
  const cutOffMinutes = registration.cancellationCutOffMinutes || 120;

  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await activityRegistrationService.cancelRegistration(
        registration.activityId,
        registration.registrationId,
        {
          passengerId: registration.passengerId,
          reason: reason.trim()
        }
      );
      setCancelResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMessage(errorObj?.response?.data?.message || 'Không thể hủy hoạt động vào lúc này. Vui lòng liên hệ quầy lễ tân.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cancel-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 to-red-600 p-6 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
              Xác Nhận Hủy Đặt Chỗ
            </span>
          </div>
          <h2 id="modal-cancel-title" className="text-xl font-bold">{registration.activityTitle}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {cancelResult ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hủy Đăng Ký Thành Công!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Suất tham gia của quý khách đã được hủy.
                {cancelResult.refundAmount > 0
                  ? ` Số tiền ${cancelResult.refundAmount.toLocaleString('vi-VN')} VND đã được hoàn vào tài khoản Folio.`
                  : ' Không có số tiền hoàn theo quy định cắt giờ.'}
              </p>
              {cancelResult.waitlistPromotedPassengerId && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-xs text-blue-700 dark:text-blue-300">
                  Hệ thống đã tự động phân bổ suất trống cho hành khách tiếp theo trong hàng đợi Waitlist.
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Warning Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Quy định hủy (Cut-off policy):</strong>
                  <p className="mt-1">
                    Thời hạn hủy miễn phí kết thúc trước <strong>{cutOffMinutes} phút</strong> khi hoạt động diễn ra.
                    Hủy trước thời hạn được hoàn 100% vào Folio cabin.
                  </p>
                </div>
              </div>

              {/* Refund Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Số tiền hoàn dự kiến:</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {charged > 0 ? `${charged.toLocaleString('vi-VN')} VND (100%)` : 'Miễn phí'}
                </span>
              </div>

              {/* Cancellation Reason */}
              <div>
                <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Lý do hủy chỗ
                </label>
                <textarea
                  id="cancel-reason"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do quý khách muốn hủy..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              {errorMessage && (
                <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
                  {errorMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Giữ Chỗ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang hủy...' : 'Xác Nhận Hủy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
