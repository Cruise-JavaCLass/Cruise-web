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
    <div className="bg-white rounded-2xl border border-[#E5E0D7] overflow-hidden shadow-sm text-[#252B32]">
      {/* Category Tabs */}
      <div className="flex border-b border-[#E5E0D7] overflow-x-auto p-2 gap-1.5 bg-[#F7F4ED]">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              onSelectCategory(tab.key);
              onPageChange(0);
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === tab.key
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#5A6B7C] hover:text-[#102A43] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <div className="p-8 text-center text-[#5A6B7C] text-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#397C80] mx-auto mb-2"></div>
          Đang tải nhật ký giao dịch...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-[#5A6B7C] text-xs">
          Không có giao dịch nào trong danh mục này.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F4ED] text-[#102A43] border-b border-[#E5E0D7] uppercase text-[11px] font-semibold">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Địa điểm / Quầy</th>
                <th className="py-3 px-4">Mã POS</th>
                <th className="py-3 px-4">Người quẹt thẻ</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D7]">
              {transactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr className="hover:bg-[#F7F4ED]/50 transition-colors">
                    <td className="py-3 px-4 text-[#5A6B7C]">
                      <div className="text-[#102A43] font-medium">{formatDate(tx.time)}</div>
                      <div className="text-[10px] text-[#5A6B7C]/70 font-mono">{tx.transactionUuid}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#252B32]">
                      <div>{tx.locationCounter}</div>
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-lg bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] mt-0.5 font-medium">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5A6B7C] font-mono text-[11px]">{tx.posCode}</td>
                    <td className="py-3 px-4 text-[#252B32]">{tx.swipedBy}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      {tx.complimentary || tx.amount === 0 ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="text-[#397C80] font-bold">$0.00</span>
                          <span className="text-[9px] bg-[#397C80]/10 text-[#397C80] px-1.5 py-0.5 rounded border border-[#397C80]/30 font-sans">
                            Gói tặng kèm
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#102A43]">{formatCurrency(tx.amount)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {tx.items && tx.items.length > 0 && (
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            className="text-xs font-semibold text-[#397C80] hover:text-[#2D6468] hover:underline px-1.5 py-1 cursor-pointer"
                          >
                            {expandedTxId === tx.id ? 'Ẩn món' : `Chi tiết (${tx.items.length})`}
                          </button>
                        )}
                        {!tx.complimentary && tx.amount > 0 && (
                          <button
                            onClick={() => onOpenDispute(tx)}
                            className="text-[11px] font-semibold uppercase bg-[#C5A572]/15 hover:bg-[#C5A572]/25 text-[#9E7A3E] border border-[#C5A572]/40 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            Khiếu nại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Itemized Breakdown */}
                  {expandedTxId === tx.id && tx.items && tx.items.length > 0 && (
                    <tr className="bg-[#F7F4ED]/40">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="bg-[#F7F4ED] rounded-xl border border-[#E5E0D7] p-4 shadow-xs">
                          <div className="text-[11px] font-bold text-[#102A43] uppercase tracking-wider mb-2">
                            Danh sách món / dịch vụ chi tiết
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[#5A6B7C] border-b border-[#E5E0D7] text-[10px] uppercase pb-1 font-semibold">
                                <th className="text-left py-1">Tên món</th>
                                <th className="text-center py-1">Số lượng</th>
                                <th className="text-right py-1">Đơn giá</th>
                                <th className="text-right py-1">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E0D7]/60 font-mono">
                              {tx.items.map((item, idx) => (
                                <tr key={idx} className="py-1">
                                  <td className="py-1.5 text-[#252B32] font-sans">
                                    {item.itemName}
                                    {item.complimentary && (
                                      <span className="ml-2 text-[9px] bg-[#397C80]/10 text-[#397C80] px-1.5 py-0.5 rounded border border-[#397C80]/30 font-sans">
                                        Miễn phí trong tour
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center py-1.5 text-[#5A6B7C] tabular-nums">{item.quantity}</td>
                                  <td className="text-right py-1.5 text-[#5A6B7C] tabular-nums">{formatCurrency(item.unitPrice)}</td>
                                  <td className="text-right py-1.5 font-bold text-[#102A43] tabular-nums">
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
        <div className="flex justify-between items-center px-4 py-3 border-t border-[#E5E0D7] bg-[#F7F4ED] text-xs">
          <span className="text-[#5A6B7C]">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 bg-white border border-[#E5E0D7] rounded-lg text-[#102A43] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#ECE7DC] cursor-pointer"
            >
              Trang trước
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 bg-white border border-[#E5E0D7] rounded-lg text-[#102A43] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#ECE7DC] cursor-pointer"
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
