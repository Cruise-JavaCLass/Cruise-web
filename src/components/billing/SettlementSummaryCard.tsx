import React from 'react';
import { AlertTriangle, Receipt, TrendingDown } from 'lucide-react';
import type { SettlementPreview } from '../../services/settlementService';

interface SettlementSummaryCardProps {
  preview: SettlementPreview | null;
  loading: boolean;
  error: string | null;
}

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const SettlementSummaryCard: React.FC<SettlementSummaryCardProps> = ({
  preview,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div
        role="status"
        aria-label="Đang tải bản tóm tắt tất toán"
        className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 animate-pulse"
      >
        <div className="h-4 w-40 bg-white/10 rounded mb-4" />
        <div className="h-10 w-56 bg-white/10 rounded mb-6" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-3 w-5/6 bg-white/5 rounded" />
          <div className="h-3 w-4/6 bg-white/5 rounded" />
        </div>
        <span className="sr-only">Đang tải bản tóm tắt tất toán...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-300 flex items-start gap-3"
      >
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Không thể tải folio</p>
          <p className="text-xs mt-1 text-rose-200/80">{error}</p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div
        role="status"
        className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-8 text-center text-slate-400"
      >
        <Receipt className="w-8 h-8 mx-auto mb-3 text-slate-500" />
        <p className="text-sm">Nhập số cabin và tải folio để xem bản tóm tắt tất toán.</p>
      </div>
    );
  }

  const breakdown = [
    { label: 'Tạm tính', value: preview.subtotal },
    { label: 'Thuế', value: preview.taxTotal },
    { label: 'Phí phục vụ (Gratuity)', value: preview.gratuityTotal },
    { label: 'Giảm giá', value: -Math.abs(preview.discountTotal) },
    { label: 'Hoàn / đảo khoản', value: -Math.abs(preview.reversalsTotal) },
  ];

  return (
    <section
      aria-label="Bản tóm tắt tất toán"
      className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            Cabin {preview.cabinNumber}
          </p>
          <h2 className="text-lg font-semibold text-white mt-1">{preview.primaryGuestName}</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Tổng thanh toán
          </p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">
            {formatCurrency(preview.netAmountDue, preview.currency)}
          </p>
        </div>
      </div>

      {preview.heldDisputeAmount > 0 && (
        <div className="mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Đang giữ {formatCurrency(preview.heldDisputeAmount, preview.currency)} cho{' '}
            {preview.openDisputeCount} khiếu nại chưa xử lý.
          </span>
        </div>
      )}

      <div className="mt-5 border-t border-white/5 pt-4 space-y-2 text-xs">
        {breakdown.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-slate-400">
            <span>{row.label}</span>
            <span className="font-mono text-slate-200">
              {formatCurrency(row.value, preview.currency)}
            </span>
          </div>
        ))}
        {!preview.eligibleForSettlement && (
          <div className="flex items-start gap-2 pt-2 text-rose-300">
            <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {preview.blockingReasons.length > 0
                ? preview.blockingReasons.join(' • ')
                : 'Folio chưa đủ điều kiện tất toán.'}
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
