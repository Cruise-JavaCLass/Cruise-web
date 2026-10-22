import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isOpen && cabinNumber && amount > 0) {
      setLoading(true);
      setError(null);
      setPollingStatus('PENDING');

      paymentGatewayService
        .generateVietQr({
          cabinNumber,
          amount,
          description: `FOLIO SETTLEMENT ${cabinNumber}`,
        })
        .then((data) => {
          setQrData(data);
          setLoading(false);
        })
        .catch((err: Error) => {
          setError(err.message || 'Không thể tạo mã VietQR');
          setLoading(false);
        });
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, cabinNumber, amount]);

  // Polling for payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (qrData && pollingStatus === 'PENDING') {
      const checkStatus = async () => {
        try {
          const status = await paymentGatewayService.getPaymentStatus(qrData.paymentReference);
          setPollingStatus(status);
          if (status === 'PAID') {
            if (onPaymentSuccess) onPaymentSuccess();
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
      if (interval) clearInterval(interval);
    };
  }, [qrData, pollingStatus, onPaymentSuccess]);

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

          {qrData && !loading && (
            <>
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Cabin {cabinNumber} • Số tiền cần thanh toán
                </span>
                <div className="text-2xl font-black text-emerald-800">
                  {amount.toLocaleString('vi-VN')} đ
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

              {/* Status Badge */}
              <div className="pt-2">
                {pollingStatus === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    Đang chờ hệ thống ngân hàng xác nhận tiền về...
                  </span>
                )}
                {pollingStatus === 'PAID' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    ✓ Đã nhận thanh toán thành công! Folio đã được tất toán.
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
