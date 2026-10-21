import React, { useState } from 'react';
import { FolioTransaction } from '../../services/passengerFolioService';

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Category Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto p-2 gap-1 bg-gray-50/50">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              onSelectCategory(tab.key);
              onPageChange(0);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Đang tải nhật ký giao dịch...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Không có giao dịch nào trong danh mục này.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50/75 text-gray-600 border-b border-gray-100 font-medium">
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Địa điểm / Quầy</th>
                <th className="py-3 px-4">Mã POS</th>
                <th className="py-3 px-4">Người quẹt thẻ</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <React.Fragment key={tx.id}>
                  <tr className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-4 text-gray-600">
                      <div>{formatDate(tx.time)}</div>
                      <div className="text-xs text-gray-400 font-mono">{tx.transactionUuid}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      <div>{tx.locationCounter}</div>
                      <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mt-0.5">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{tx.posCode}</td>
                    <td className="py-3 px-4 text-gray-700">{tx.swipedBy}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {tx.complimentary || tx.amount === 0 ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="text-emerald-600 font-bold">$0.00</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                            Gói tặng kèm
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-900">{formatCurrency(tx.amount)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {tx.items && tx.items.length > 0 && (
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline px-1.5 py-1"
                          >
                            {expandedTxId === tx.id ? 'Ẩn món' : `Chi tiết (${tx.items.length})`}
                          </button>
                        )}
                        {!tx.complimentary && tx.amount > 0 && (
                          <button
                            onClick={() => onOpenDispute(tx)}
                            className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md font-medium transition"
                          >
                            Khiếu nại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Itemized Breakdown */}
                  {expandedTxId === tx.id && tx.items && tx.items.length > 0 && (
                    <tr className="bg-gray-50/70">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-inner">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Danh sách món / dịch vụ chi tiết
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-100 pb-1">
                                <th className="text-left py-1">Tên món</th>
                                <th className="text-center py-1">Số lượng</th>
                                <th className="text-right py-1">Đơn giá</th>
                                <th className="text-right py-1">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {tx.items.map((item, idx) => (
                                <tr key={idx} className="py-1">
                                  <td className="py-1.5 text-gray-800 font-medium">
                                    {item.itemName}
                                    {item.complimentary && (
                                      <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">
                                        Miễn phí trong tour
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center py-1.5 text-gray-600">{item.quantity}</td>
                                  <td className="text-right py-1.5 text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                  <td className="text-right py-1.5 font-semibold text-gray-900">
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
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50/30 text-xs">
          <span className="text-gray-500">
            Trang {page + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-700 disabled:opacity-50 hover:bg-gray-50"
            >
              Trang trước
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-700 disabled:opacity-50 hover:bg-gray-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
