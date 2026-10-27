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
        className="bg-white border border-[#E5E0D7] rounded-xl p-6 shadow-xs animate-pulse"
      >
        <div className="h-4 w-40 bg-[#F7F4ED] rounded mb-4" />
        <div className="h-10 w-56 bg-[#F7F4ED] rounded mb-6" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-[#F7F4ED] rounded" />
          <div className="h-3 w-5/6 bg-[#F7F4ED] rounded" />
          <div className="h-3 w-4/6 bg-[#F7F4ED] rounded" />
        </div>
        <span className="sr-only">Đang tải bản tóm tắt tất toán...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-800 flex items-start gap-3 font-medium"
      >
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
        <div>
          <p className="font-semibold text-sm">Không thể tải folio</p>
          <p className="text-xs mt-1 text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div
        role="status"
        className="bg-white border border-dashed border-[#E5E0D7] rounded-xl p-8 text-center text-[#687787]"
      >
        <Receipt className="w-8 h-8 mx-auto mb-3 text-[#102A43]" />
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
      className="bg-white border border-[#E5E0D7] rounded-2xl p-6 shadow-xs"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#102A43]">
            Cabin {preview.cabinNumber}
          </p>
          <h2 className="text-lg font-serif font-bold text-[#102A43] mt-1">{preview.primaryGuestName}</h2>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#687787]">
            Tổng thanh toán
          </p>
          <p className="text-3xl font-serif font-bold text-[#102A43] mt-1">
            {formatCurrency(preview.netAmountDue, preview.currency)}
          </p>
        </div>
      </div>

      {preview.heldDisputeAmount > 0 && (
        <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Đang giữ {formatCurrency(preview.heldDisputeAmount, preview.currency)} cho{' '}
            {preview.openDisputeCount} khiếu nại chưa xử lý.
          </span>
        </div>
      )}

      <div className="mt-5 border-t border-[#E5E0D7] pt-4 space-y-2 text-xs">
        {breakdown.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-[#687787]">
            <span className="font-medium">{row.label}</span>
            <span className="font-mono font-bold text-[#252B32]">
              {formatCurrency(row.value, preview.currency)}
            </span>
          </div>
        ))}
        {!preview.eligibleForSettlement && (
          <div className="flex items-start gap-2 pt-2 text-rose-700 font-medium">
            <TrendingDown className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
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
