import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  passengerFolioService,
  type PassengerFolioSummary,
  type FolioTransaction,
  type DisputePayload,
} from '../../services/passengerFolioService';
import { resolvePassengerId } from '../../services/passengerIdentity';
import { FolioTransactionList } from '../../components/passenger/FolioTransactionList';
import { DisputeModal } from '../../components/passenger/DisputeModal';

const CATEGORY_LABELS: Record<string, string> = {
  FOOD_AND_BEVERAGE: 'Ẩm thực & Bar',
  SHORE_EXCURSIONS: 'Tour tham quan bờ',
  SPA_AND_WELLNESS: 'Spa & Chăm sóc sức khỏe',
  RETAIL_SHOPPING: 'Mua sắm & Quà lưu niệm',
  SERVICE_FEES: 'Phí dịch vụ & Tiện ích',
};

const CATEGORY_COLORS: Record<string, string> = {
  FOOD_AND_BEVERAGE: 'bg-amber-500',
  SHORE_EXCURSIONS: 'bg-emerald-500',
  SPA_AND_WELLNESS: 'bg-purple-500',
  RETAIL_SHOPPING: 'bg-pink-500',
  SERVICE_FEES: 'bg-blue-500',
};

export const PassengerFolioPage: React.FC = () => {
  const [passengerId] = useState<number>(() => resolvePassengerId(101) ?? 101);
  const [summary, setSummary] = useState<PassengerFolioSummary | null>(null);
  const [transactions, setTransactions] = useState<FolioTransaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(true);
  const [isLoadingTx, setIsLoadingTx] = useState<boolean>(true);
  const [disputingTx, setDisputingTx] = useState<FolioTransaction | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const txRequestIdRef = useRef<number>(0);

  const fetchSummary = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      const data = await passengerFolioService.getFolioSummary(passengerId);
      setSummary(data);
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Không thể tải tóm tắt chi phí phòng.' });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [passengerId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const currentRequestId = ++txRequestIdRef.current;
    let isCancelled = false;

    setIsLoadingTx(true);
    passengerFolioService
      .getTransactions(passengerId, categoryFilter, page, 10)
      .then((data) => {
        if (!isCancelled && currentRequestId === txRequestIdRef.current) {
          setTransactions(data.content);
          setTotalPages(data.totalPages);
        }
      })
      .catch(() => {
        if (!isCancelled && currentRequestId === txRequestIdRef.current) {
          setFeedbackMessage({ type: 'error', text: 'Không thể tải lịch sử giao dịch.' });
        }
      })
      .finally(() => {
        if (!isCancelled && currentRequestId === txRequestIdRef.current) {
          setIsLoadingTx(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [passengerId, categoryFilter, page]);

  const handleDisputeSubmit = async (payload: DisputePayload) => {
    if (!disputingTx) return;
    try {
      await passengerFolioService.disputeTransaction(passengerId, disputingTx.id, payload);
      setFeedbackMessage({
        type: 'success',
        text: `Đã gửi khiếu nại giao dịch ${disputingTx.transactionUuid} thành công đến Lễ tân.`,
      });
      const data = await passengerFolioService.getTransactions(passengerId, categoryFilter, page, 10);
      setTransactions(data.content);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Khiếu nại thất bại';
      setFeedbackMessage({ type: 'error', text: msg });
      throw err;
    }
  };

  const handleExportStatement = () => {
    if (!summary) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const header = `SAO KE CHI TIET TAM TINH (INTERIM STATEMENT)\nCabin: ${summary.cabinNumber} | Hanh khach: ${summary.passengerName}\nNgay in: ${dateStr}\n`;
    const balanceInfo = `Tong chi tieu: $${summary.currentBalance.toFixed(2)} / Han muc: $${summary.creditLimit.toFixed(2)} (Con lai: $${summary.availableLimit.toFixed(2)})\n\n`;
    const rows = transactions
      .map(
        (t) =>
          `[${t.time}] ${t.locationCounter} | ${t.swipedBy} | $${t.amount.toFixed(2)} ${t.complimentary ? '(COMPLIMENTARY)' : ''}`
      )
      .join('\n');

    const blob = new Blob([header + balanceInfo + rows], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Interim-Statement-${summary.cabinNumber}-${dateStr}.txt`);
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title & Export Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Chi Phí Phòng & Sao Kê Trực Tuyến</h1>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi chi tiêu theo thời gian thực trên hải trình không dùng tiền mặt (Cashless Cruise)
            </p>
          </div>
          <button
            onClick={handleExportStatement}
            disabled={!summary}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📥</span> Xuất Sao Kê Tạm Tính (Interim Statement)
          </button>
        </div>

        {/* Alerts / Feedback Message */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-xl text-sm border flex justify-between items-center ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="font-bold text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* 80% and 100% Visual Alerts */}
        {summary && summary.limitExceeded && (
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-md flex items-center gap-3 animate-pulse">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-base">Cảnh báo: Đã đạt 100% hạn mức tín dụng cabin!</div>
              <div className="text-xs text-red-100 mt-0.5">
                Tổng chi tiêu ({formatCurrency(summary.currentBalance)}) đã chạm hoặc vượt mức hạn mức cho phép ({formatCurrency(summary.creditLimit)}).
                Vui lòng thanh toán bớt tại Quầy Lễ Tân (Front Desk) để tiếp tục chi tiêu.
              </div>
            </div>
          </div>
        )}

        {summary && !summary.limitExceeded && summary.warningThresholdReached && (
          <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-md flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-bold text-base">Cảnh báo: Đã dùng hơn 80% hạn mức tín dụng cabin</div>
              <div className="text-xs text-amber-100 mt-0.5">
                Cabin đã sử dụng {summary.spendingPercentage.toFixed(1)}% hạn mức tín dụng. Bạn còn lại{' '}
                {formatCurrency(summary.availableLimit)} trước khi chạm ngưỡng tối đa.
              </div>
            </div>
          </div>
        )}

        {/* Summary Dashboard Grid */}
        {isLoadingSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-36 bg-gray-200 rounded-2xl"></div>
            <div className="h-36 bg-gray-200 rounded-2xl"></div>
            <div className="h-36 bg-gray-200 rounded-2xl"></div>
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Balance & Cabin */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <span>Cabin {summary.cabinNumber}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{summary.status}</span>
                </div>
                <div className="text-gray-900 font-bold text-base mt-1">{summary.passengerName}</div>
                <div className="mt-4">
                  <div className="text-xs text-gray-500">Tổng chi tiêu hiện tại</div>
                  <div className="text-3xl font-black text-gray-900 mt-0.5">
                    {formatCurrency(summary.currentBalance)}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                Hạn mức cho phép: <span className="font-semibold text-gray-800">{formatCurrency(summary.creditLimit)}</span>
              </div>
            </div>

            {/* Card 2: Progress & Credit Limit */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tỷ lệ hạn mức sử dụng
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-gray-900">
                    {summary.spendingPercentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    (Còn lại {formatCurrency(summary.availableLimit)})
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.limitExceeded
                        ? 'bg-red-500'
                        : summary.warningThresholdReached
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(summary.spendingPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3 flex justify-between">
                <span>Ngưỡng cảnh báo: 80%</span>
                <span>Khóa quẹt thẻ: 100%</span>
              </div>
            </div>

            {/* Card 3: Spending Breakdown by Category */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                Phân bổ theo danh mục
              </div>
              <div className="space-y-2">
                {Object.entries(summary.spendingByCategory).map(([cat, amt]) => {
                  const percent = summary.currentBalance > 0 ? (amt / summary.currentBalance) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 font-medium">{CATEGORY_LABELS[cat] || cat}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(amt)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-400'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Itemized Transaction Ledger */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Nhật Ký Giao Dịch Chi Tiết</h2>
            <span className="text-xs text-gray-500">Món miễn phí trong gói được thể hiện $0.00</span>
          </div>

          <FolioTransactionList
            transactions={transactions}
            isLoading={isLoadingTx}
            onOpenDispute={(tx) => setDisputingTx(tx)}
            selectedCategory={categoryFilter}
            onSelectCategory={(cat) => setCategoryFilter(cat)}
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>

        {/* Dispute Modal */}
        <DisputeModal
          key={disputingTx?.id ?? 'none'}
          isOpen={disputingTx !== null}
          onClose={() => setDisputingTx(null)}
          transaction={disputingTx}
          onSubmitDispute={handleDisputeSubmit}
        />
      </div>
    </div>
  );
};
export default PassengerFolioPage;
