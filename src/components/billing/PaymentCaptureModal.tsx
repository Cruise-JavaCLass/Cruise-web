import React, { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, Loader2, X } from 'lucide-react';
import type { PaymentMethod, SettlementPreview } from '../../services/settlementService';

export interface PaymentCapturePayload {
  paymentMethod: PaymentMethod;
  amountTendered: number;
  notes?: string;
}

interface PaymentCaptureModalProps {
  open: boolean;
  preview: SettlementPreview | null;
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onConfirm: (payload: PaymentCapturePayload) => void;
}

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const PaymentCaptureModal: React.FC<PaymentCaptureModalProps> = ({
  open,
  preview,
  submitting,
  errorMessage,
  onClose,
  onConfirm,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [clicked, setClicked] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentMethod('CASH');
      setAmountTendered(preview ? preview.netAmountDue : 0);
      setNotes('');
      setClicked(false);
      setValidationError(null);
    }
  }, [open, preview]);

  useEffect(() => {
    if (errorMessage) {
      setClicked(false);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !preview) {
    return null;
  }

  const netAmountDue = preview.netAmountDue;
  const changeGiven = Math.max(0, amountTendered - netAmountDue);
  const isLocked = submitting || clicked;

  const handleConfirm = () => {
    if (isLocked) {
      return;
    }
    if (amountTendered < netAmountDue) {
      setValidationError(
        `Số tiền nhận chưa đủ. Cần tối thiểu ${formatCurrency(netAmountDue, preview.currency)}.`
      );
      return;
    }
    setValidationError(null);
    setClicked(true);
    const trimmedNotes = notes.trim();
    onConfirm({
      paymentMethod,
      amountTendered,
      notes: trimmedNotes ? trimmedNotes : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Xác nhận tất toán folio"
        className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-2 text-[#102A43]">
            <CreditCard className="w-5 h-5 text-[#102A43]" />
            <h3 className="font-serif font-bold text-[#102A43] text-base">Xác nhận tất toán</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại tất toán"
            className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-[#252B32]">
          <div className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl p-3 flex items-center justify-between">
            <span className="text-[#687787] font-medium">
              Cabin {preview.cabinNumber} • {preview.primaryGuestName}
            </span>
            <span className="text-base font-bold text-[#102A43]">
              {formatCurrency(netAmountDue, preview.currency)}
            </span>
          </div>

          <div>
            <label htmlFor="payment-method" className="block font-semibold text-[#252B32] mb-1">
              Phương thức thanh toán
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-2 text-[#252B32] focus:outline-none focus:border-[#102A43]"
            >
              <option value="CASH">Tiền mặt (CASH)</option>
              <option value="CREDIT_CARD">Thẻ tín dụng (CREDIT_CARD)</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount-tendered" className="block font-semibold text-[#252B32] mb-1">
              Số tiền nhận
            </label>
            <input
              id="amount-tendered"
              type="number"
              min={0}
              step="0.01"
              value={amountTendered}
              onChange={(event) => {
                const next = event.target.value === '' ? 0 : Number(event.target.value);
                setAmountTendered(Number.isFinite(next) ? next : 0);
              }}
              className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-2 text-[#252B32] font-mono focus:outline-none focus:border-[#102A43]"
            />
          </div>

          <div
            aria-live="polite"
            className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2"
          >
            <span className="text-[#687787] font-medium">Tiền thừa trả khách</span>
            <span className="font-mono font-bold text-emerald-700">
              {formatCurrency(changeGiven, preview.currency)}
            </span>
          </div>

          <div>
            <label htmlFor="settlement-notes" className="block font-semibold text-[#252B32] mb-1">
              Ghi chú
            </label>
            <textarea
              id="settlement-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ghi chú cho giao dịch tất toán (không bắt buộc)"
              className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-2 text-[#252B32] resize-none focus:outline-none focus:border-[#102A43] placeholder-[#687787]/60"
            />
          </div>

          {validationError && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E0D7] text-[#102A43] bg-white hover:bg-[#F7F4ED] font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLocked}
              className="px-4 py-2 rounded-xl bg-[#102A43] text-white font-semibold hover:bg-[#183B5B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận tất toán
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
