import React, { useMemo } from 'react';
import { Receipt } from 'lucide-react';
import type { SettlementLineItem } from '../../services/settlementService';

interface SettlementLineItemTableProps {
  lineItems: SettlementLineItem[];
  currency: string;
}

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const formatPostedAt = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

export const SettlementLineItemTable: React.FC<SettlementLineItemTableProps> = ({
  lineItems,
  currency,
}) => {
  const sortedItems = useMemo(
    () => [...lineItems].sort((a, b) => new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime()),
    [lineItems],
  );

  return (
    <section
      aria-label="Chi tiết khoản mục folio"
      className="bg-white border border-[#E5E0D7] rounded-2xl overflow-hidden shadow-xs"
    >
      <div className="px-5 py-4 border-b border-[#E5E0D7] flex items-center gap-2 bg-[#F7F4ED]">
        <Receipt className="w-4 h-4 text-[#102A43]" />
        <h3 className="text-sm font-serif font-bold text-[#102A43]">Chi tiết khoản mục</h3>
        <span className="ml-auto text-[10px] font-semibold text-[#687787] uppercase tracking-wider">
          {sortedItems.length} mục
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[#687787] border-b border-[#E5E0D7] bg-[#F7F4ED] text-[10px] font-semibold uppercase tracking-wider">
              <th className="px-5 py-3">Mô tả</th>
              <th className="px-5 py-3">Khu vực</th>
              <th className="px-5 py-3">Thời điểm</th>
              <th className="px-5 py-3 text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-[#687787]">
                  Chưa có khoản mục nào trong folio.
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const displayAmount = item.isReversal ? -Math.abs(item.amount) : item.amount;
                return (
                  <tr
                    key={`${item.postedAt}-${item.description}-${index}`}
                    className="border-b border-[#E5E0D7] last:border-b-0 text-[#252B32] hover:bg-[#F7F4ED]/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className={item.isReversal ? 'text-rose-600 font-semibold' : 'text-[#252B32] font-medium'}>
                        {item.description}
                      </span>
                      {item.isReversal && (
                        <span className="ml-2 text-[10px] font-mono font-bold uppercase text-rose-600">
                          Reversal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[#687787]">{item.serviceArea}</td>
                    <td className="px-5 py-3 text-[#687787] font-mono">
                      {formatPostedAt(item.postedAt)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-mono font-semibold ${
                        item.isReversal ? 'text-rose-600' : 'text-[#252B32]'
                      }`}
                    >
                      {formatCurrency(displayAmount, currency)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
