import React, { useState, useEffect, useRef } from 'react';
import type { VietQrPaymentResponse } from '../../services/paymentGatewayTypes';
import { paymentGatewayService } from '../../services/paymentGatewayService';

interface SettlementCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabinNumber: string;
  amount: number;
  onPaymentSuccess?: () => void;
}

export const SettlementCheckoutModal: React.FC<SettlementCheckoutModalProps> = ({
  isOpen,
  onClose,
  cabinNumber,
  amount,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<VietQrPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('PENDING');

  // Track completed payment references so onPaymentSuccess is called at most once per reference
  const completedRefs = useRef<Set<string>>(new Set());

  // Keep latest onPaymentSuccess callback in a ref to prevent effect re-runs
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
  });

  useEffect(() => {
    let isCancelled = false;

    if (isOpen && cabinNumber && amount > 0) {
      setLoading(true);
      setError(null);
      setQrData(null); // Clear previous QR immediately on change
      setPollingStatus('PENDING');

      paymentGatewayService
        .generateVietQr({
          cabinNumber,
          amount,
          description: `FOLIO SETTLEMENT ${cabinNumber}`,
        })
        .then((data) => {
          if (!isCancelled) {
            setLoading(false);
            const status = data.status || 'PENDING';
            setPollingStatus(status);

            if (status === 'PAID') {
              setQrData(data);
              if (!completedRefs.current.has(data.paymentReference)) {
                completedRefs.current.add(data.paymentReference);
                onPaymentSuccessRef.current?.();
              }
            } else if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED') {
              // Terminal failure: Do not leave a scannable QR
              setQrData(null);
            } else {
              // PENDING / ACTIVE
              setQrData(data);
            }
          }
        })
        .catch((err: Error) => {
          if (!isCancelled) {
            setError(err.message || 'Không thể tạo mã VietQR');
            setLoading(false);
          }
        });
    } else if (!isOpen) {
      setQrData(null);
      setError(null);
      setLoading(false);
      setPollingStatus('PENDING');
    } else {
      setQrData(null);
      setLoading(false);
      setPollingStatus('PENDING');
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, cabinNumber, amount]);

  // Polling for payment status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let isPollingActive = true;

    if (isOpen && qrData && pollingStatus === 'PENDING') {
      const currentRef = qrData.paymentReference;

      const checkStatus = async () => {
        try {
          const status = await paymentGatewayService.getPaymentStatus(currentRef);
          if (!isPollingActive) return;

          setPollingStatus(status);
          if (status === 'PAID') {
            if (!completedRefs.current.has(currentRef)) {
              completedRefs.current.add(currentRef);
              onPaymentSuccessRef.current?.();
            }
          } else if (status === 'FAILED' || status === 'EXPIRED' || status === 'CANCELLED') {
            // Dismiss scannable QR upon terminal failure
            setQrData(null);
          }
        } catch {
          // ignore transient polling network errors
        }
      };

      // Trigger immediate check then interval
      void checkStatus();
      interval = setInterval(checkStatus, 2000);
    }

    return () => {
      isPollingActive = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen, qrData, pollingStatus]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settlement-modal-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 id="settlement-modal-title" className="text-lg font-bold text-gray-900">
              Thanh Toán Tất Toán VietQR
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-4">
          {loading && (
            <div className="py-12 text-sm font-semibold text-gray-500 animate-pulse">
              Đang kết nối cổng thanh toán ngân hàng & tạo mã VietQR...
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {/* Terminal status when no active QR */}
          {!loading && (pollingStatus === 'FAILED' || pollingStatus === 'EXPIRED' || pollingStatus === 'CANCELLED') && (
            <div className="pt-2 space-y-2">
              {pollingStatus === 'FAILED' && (
                <div className="rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200 space-y-1">
                  <p className="font-bold">❌ Giao dịch thanh toán thất bại!</p>
                  <p className="text-[11px] text-rose-600">Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
                </div>
              )}
              {pollingStatus === 'EXPIRED' && (
                <div className="rounded-xl bg-amber-50 p-4 text-xs text-amber-700 border border-amber-200 space-y-1">
                  <p className="font-bold">⏰ Mã VietQR đã hết hạn hiệu lực!</p>
                  <p className="text-[11px] text-amber-600">Vui lòng đóng modal và tạo mã thanh toán mới.</p>
                </div>
              )}
              {pollingStatus === 'CANCELLED' && (
                <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-700 border border-slate-200 space-y-1">
                  <p className="font-bold">⛔ Giao dịch đã bị hủy bỏ.</p>
                  <p className="text-[11px] text-slate-600">Vui lòng liên hệ quầy thu ngân hoặc thử lại.</p>
                </div>
              )}
            </div>
          )}

          {/* Active scannable QR when payment is pending */}
          {qrData && !loading && pollingStatus !== 'PAID' && (
            <>
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Cabin {cabinNumber} • Số tiền cần thanh toán
                </span>
                <div className="text-2xl font-black text-emerald-800">
                  {(qrData.amount ?? amount).toLocaleString('vi-VN')} {qrData.currency || 'đ'}
                </div>
              </div>

              {/* QR Image Box */}
              <div className="mx-auto flex w-64 h-64 items-center justify-center rounded-2xl border-2 border-emerald-500 bg-white p-2 shadow-inner">
                {qrData.qrImageUrl ? (
                  <img
                    src={qrData.qrImageUrl}
                    alt="Mã VietQR Thanh Toán"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-gray-400">Không có hình ảnh QR</div>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  Ngân hàng: <span className="font-semibold text-gray-800">{qrData.bankCode}</span> • TK:{' '}
                  <span className="font-semibold text-gray-800">{qrData.accountNumber}</span>
                </p>
                <p>
                  Người nhận: <span className="font-semibold text-gray-800">{qrData.accountName}</span>
                </p>
                <p>
                  Nội dung chuyển khoản:{' '}
                  <span className="font-mono font-bold text-indigo-600">{qrData.description}</span>
                </p>
              </div>

              {/* Polling Status Badge */}
              <div className="pt-2">
                {pollingStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Đang chờ hệ thống ngân hàng xác nhận tiền về...
                  </span>
                )}
              </div>
            </>
          )}

          {/* Success confirmation view - QR is hidden upon successful payment */}
          {!loading && pollingStatus === 'PAID' && (
            <div className="py-6 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl font-bold shadow-inner">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Thanh toán thành công!</h3>
                <p className="text-sm text-gray-600">
                  Cabin {cabinNumber} đã tất toán số tiền{' '}
                  <span className="font-bold text-emerald-700">
                    {(qrData?.amount ?? amount).toLocaleString('vi-VN')} {qrData?.currency || 'đ'}
                  </span>
                </p>
              </div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  ✓ Đã nhận thanh toán thành công! Folio đã được tất toán.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
