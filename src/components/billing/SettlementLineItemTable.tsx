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
      className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-xl"
    >
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <Receipt className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Chi tiết khoản mục</h3>
        <span className="ml-auto text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          {sortedItems.length} mục
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 border-b border-white/5">
              <th className="px-5 py-3 font-medium">Mô tả</th>
              <th className="px-5 py-3 font-medium">Khu vực</th>
              <th className="px-5 py-3 font-medium">Thời điểm</th>
              <th className="px-5 py-3 font-medium text-right">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                  Chưa có khoản mục nào trong folio.
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const displayAmount = item.isReversal ? -Math.abs(item.amount) : item.amount;
                return (
                  <tr
                    key={`${item.postedAt}-${item.description}-${index}`}
                    className="border-b border-white/5 last:border-b-0 text-slate-300"
                  >
                    <td className="px-5 py-3">
                      <span className={item.isReversal ? 'text-rose-400' : 'text-slate-200'}>
                        {item.description}
                      </span>
                      {item.isReversal && (
                        <span className="ml-2 text-[10px] font-mono uppercase text-rose-400/80">
                          Reversal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{item.serviceArea}</td>
                    <td className="px-5 py-3 text-slate-400 font-mono">
                      {formatPostedAt(item.postedAt)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-mono ${
                        item.isReversal ? 'text-rose-400' : 'text-slate-200'
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
