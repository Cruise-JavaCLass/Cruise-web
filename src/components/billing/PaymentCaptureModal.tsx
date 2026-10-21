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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Xác nhận tất toán folio"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2 text-cyan-400">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Xác nhận tất toán</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại tất toán"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-300">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400">
              Cabin {preview.cabinNumber} • {preview.primaryGuestName}
            </span>
            <span className="text-base font-bold text-emerald-400">
              {formatCurrency(netAmountDue, preview.currency)}
            </span>
          </div>

          <div>
            <label htmlFor="payment-method" className="block font-medium text-slate-400 mb-1">
              Phương thức thanh toán
            </label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500/60"
            >
              <option value="CASH">Tiền mặt (CASH)</option>
              <option value="CREDIT_CARD">Thẻ tín dụng (CREDIT_CARD)</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount-tendered" className="block font-medium text-slate-400 mb-1">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div
            aria-live="polite"
            className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2"
          >
            <span className="text-slate-400">Tiền thừa trả khách</span>
            <span className="font-mono font-semibold text-emerald-300">
              {formatCurrency(changeGiven, preview.currency)}
            </span>
          </div>

          <div>
            <label htmlFor="settlement-notes" className="block font-medium text-slate-400 mb-1">
              Ghi chú
            </label>
            <textarea
              id="settlement-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ghi chú cho giao dịch tất toán (không bắt buộc)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 resize-none focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          {validationError && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLocked}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
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
