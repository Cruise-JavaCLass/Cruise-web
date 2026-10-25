import React, { useState } from 'react';
import type { FolioTransaction } from '../../services/passengerFolioService';

interface FolioTransactionListProps {
  transactions: FolioTransaction[];
  isLoading: boolean;
  onOpenDispute: (tx: FolioTransaction) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CATEGORY_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'FOOD_AND_BEVERAGE', label: 'Ẩm thực & Bar' },
  { key: 'SHORE_EXCURSIONS', label: 'Tour trên bờ' },
  { key: 'SPA_AND_WELLNESS', label: 'Spa & Chăm sóc' },
  { key: 'RETAIL_SHOPPING', label: 'Mua sắm' },
  { key: 'SERVICE_FEES', label: 'Phí dịch vụ' },
];

export const FolioTransactionList: React.FC<FolioTransactionListProps> = ({
  transactions,
  isLoading,
  onOpenDispute,
  selectedCategory,
  onSelectCategory,
  page,
  totalPages,
  onPageChange,
}) => {
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-[#151F33] rounded-2xl border border-[#42E8F5]/30 overflow-hidden shadow-xl text-[#F4F4F0]">
      {/* Category Tabs */}
      <div className="flex border-b border-[#42E8F5]/20 overflow-x-auto p-2 gap-1.5 bg-[#10182A]">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              onSelectCategory(tab.key);
              onPageChange(0);
            }}
            className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === tab.key
                ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/50 shadow-[0_0_8px_rgba(66,232,245,0.2)]'
                : 'text-[#A7B4C9] hover:text-[#F4F4F0] hover:bg-[#151F33]/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <div className="p-8 text-center text-[#A7B4C9] font-mono text-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#42E8F5] mx-auto mb-2"></div>
          Đang tải nhật ký giao dịch...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-[#A7B4C9] font-mono text-xs">
          Không có giao dịch nào trong danh mục này.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#10182A] text-[#A7B4C9] border-b border-[#42E8F5]/15 font-mono uppercase text-[11px]">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Địa điểm / Quầy</th>
                <th className="py-3 px-4">Mã POS</th>
                <th className="py-3 px-4">Người quẹt thẻ</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#42E8F5]/10">
              {transactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr className="hover:bg-[#10182A]/50 transition-colors">
                    <td className="py-3 px-4 text-[#A7B4C9]">
                      <div className="text-[#F4F4F0]">{formatDate(tx.time)}</div>
                      <div className="text-[10px] text-[#A7B4C9]/70 font-mono">{tx.transactionUuid}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#F4F4F0]">
                      <div>{tx.locationCounter}</div>
                      <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#10182A] text-[#42E8F5] border border-[#42E8F5]/20 mt-0.5">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#A7B4C9] font-mono text-[11px]">{tx.posCode}</td>
                    <td className="py-3 px-4 text-[#F4F4F0]">{tx.swipedBy}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {tx.complimentary || tx.amount === 0 ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="text-emerald-400 font-bold">$0.00</span>
                          <span className="text-[9px] bg-emerald-950/40 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                            Gói tặng kèm
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#F4F4F0]">{formatCurrency(tx.amount)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {tx.items && tx.items.length > 0 && (
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            className="text-xs font-mono text-[#42E8F5] hover:underline px-1.5 py-1 cursor-pointer"
                          >
                            {expandedTxId === tx.id ? 'Ẩn món' : `Chi tiết (${tx.items.length})`}
                          </button>
                        )}
                        {!tx.complimentary && tx.amount > 0 && (
                          <button
                            onClick={() => onOpenDispute(tx)}
                            className="text-[11px] font-mono font-bold uppercase bg-[#FFBD59]/15 hover:bg-[#FFBD59]/25 text-[#FFBD59] border border-[#FFBD59]/40 px-2.5 py-1 rounded transition cursor-pointer"
                          >
                            Khiếu nại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Itemized Breakdown */}
                  {expandedTxId === tx.id && tx.items && tx.items.length > 0 && (
                    <tr className="bg-[#10182A]/70">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="bg-[#151F33] rounded-xl border border-[#42E8F5]/25 p-4 shadow-inner">
                          <div className="text-[10px] font-mono font-bold text-[#42E8F5] uppercase tracking-wider mb-2">
                            Danh sách món / dịch vụ chi tiết
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[#A7B4C9] border-b border-[#42E8F5]/15 font-mono text-[10px] uppercase pb-1">
                                <th className="text-left py-1">Tên món</th>
                                <th className="text-center py-1">Số lượng</th>
                                <th className="text-right py-1">Đơn giá</th>
                                <th className="text-right py-1">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#42E8F5]/10 font-mono">
                              {tx.items.map((item, idx) => (
                                <tr key={idx} className="py-1">
                                  <td className="py-1.5 text-[#F4F4F0] font-sans">
                                    {item.itemName}
                                    {item.complimentary && (
                                      <span className="ml-2 text-[9px] bg-emerald-950/40 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                        Miễn phí trong tour
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center py-1.5 text-[#A7B4C9] tabular-nums">{item.quantity}</td>
                                  <td className="text-right py-1.5 text-[#A7B4C9] tabular-nums">{formatCurrency(item.unitPrice)}</td>
                                  <td className="text-right py-1.5 font-bold text-[#F4F4F0] tabular-nums">
                                    {item.complimentary ? '$0.00' : formatCurrency(item.totalPrice)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 border-t border-[#42E8F5]/15 bg-[#10182A] text-xs font-mono">
          <span className="text-[#A7B4C9]">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 bg-[#151F33] border border-[#42E8F5]/30 rounded text-[#42E8F5] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#10182A] cursor-pointer"
            >
              Trang trước
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 bg-[#151F33] border border-[#42E8F5]/30 rounded text-[#42E8F5] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#10182A] cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolioTransactionList;
