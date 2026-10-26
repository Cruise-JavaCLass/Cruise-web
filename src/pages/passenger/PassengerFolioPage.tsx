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
    <div
      className="min-h-screen bg-[#F7F4ED] text-[#252B32] p-4 md:p-8 font-sans"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title & Export Button — Luxury Maritime Folio Header */}
        <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                FOLIO AUDIT
              </span>
              <span className="text-xs text-[#252B32]/60">• SỔ CÁI TRỰC TUYẾN // SECURE NFC</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-[#102A43] uppercase tracking-wide">
              Chi Phí Phòng & Sao Kê Trực Tuyến
            </h1>
            <p className="text-xs text-[#252B32]/70 mt-1">
              Theo dõi chi tiêu theo thời gian thực trên hải trình không dùng tiền mặt (Cashless Cruise)
            </p>
          </div>
          <button
            onClick={handleExportStatement}
            disabled={!summary}
            className="py-2.5 px-4 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span>📥</span> Xuất Sao Kê Tạm Tính (Interim Statement)
          </button>
        </div>

        {/* Alerts / Feedback Message */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl text-xs flex justify-between items-center shadow-sm ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
                : 'bg-rose-50 border border-rose-200 text-rose-800 font-medium'
            }`}
          >
            <span>{feedbackMessage.text}</span>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="px-2 py-0.5 rounded border border-current text-xs font-bold uppercase cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 80% and 100% Visual Alerts */}
        {summary && summary.limitExceeded && (
          <div className="bg-rose-50 text-rose-900 border border-rose-300 rounded-2xl p-5 flex items-center gap-3.5 shadow-sm">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-display font-bold text-base uppercase text-rose-900">
                Cảnh báo: Đã đạt 100% hạn mức tín dụng cabin!
              </div>
              <div className="text-xs text-rose-800/90 mt-0.5">
                Tổng chi tiêu ({formatCurrency(summary.currentBalance)}) đã chạm hoặc vượt mức hạn mức cho phép ({formatCurrency(summary.creditLimit)}).
                Vui lòng thanh toán bớt tại Quầy Lễ Tân (Front Desk) để tiếp tục chi tiêu.
              </div>
            </div>
          </div>
        )}

        {summary && !summary.limitExceeded && summary.warningThresholdReached && (
          <div className="bg-amber-50 text-amber-950 border border-amber-300 rounded-2xl p-5 flex items-center gap-3.5 shadow-sm">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-display font-bold text-base uppercase text-amber-900">
                Cảnh báo: Đã dùng hơn 80% hạn mức tín dụng cabin
              </div>
              <div className="text-xs text-amber-800/90 mt-0.5 font-medium">
                Cabin đã sử dụng {summary.spendingPercentage.toFixed(1)}% hạn mức tín dụng. Bạn còn lại{' '}
                {formatCurrency(summary.availableLimit)} trước khi chạm ngưỡng tối đa.
              </div>
            </div>
          </div>
        )}

        {/* Summary Dashboard Grid */}
        {isLoadingSummary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-36 bg-white border border-[#E5E0D7] rounded-3xl"></div>
            <div className="h-36 bg-white border border-[#E5E0D7] rounded-3xl"></div>
            <div className="h-36 bg-white border border-[#E5E0D7] rounded-3xl"></div>
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Balance & Cabin */}
            <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-wider text-[#252B32]/60">
                  <span>Cabin {summary.cabinNumber}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] text-[10px] font-semibold">
                    {summary.status}
                  </span>
                </div>
                <div className="text-[#102A43] font-display font-bold text-lg mt-1 uppercase">
                  {summary.passengerName}
                </div>
                <div className="mt-4">
                  <div className="text-[10px] uppercase text-[#252B32]/60 font-medium">Tổng chi tiêu hiện tại</div>
                  <div className="text-3xl font-display font-bold text-[#102A43] mt-0.5 tabular-nums">
                    {formatCurrency(summary.currentBalance)}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-[#252B32]/70 border-t border-[#E5E0D7] pt-3">
                Hạn mức cho phép: <span className="font-bold text-[#102A43] tabular-nums">{formatCurrency(summary.creditLimit)}</span>
              </div>
            </div>

            {/* Card 2: Progress & Credit Limit */}
            <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[#252B32]/60 font-medium">
                  Tỷ lệ hạn mức sử dụng
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-display font-bold text-[#102A43] tabular-nums">
                    {summary.spendingPercentage.toFixed(1)}%
                  </span>
                  <span className="text-xs text-[#252B32]/70 tabular-nums">
                    (Còn lại {formatCurrency(summary.availableLimit)})
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-[#F7F4ED] border border-[#E5E0D7] h-3 rounded-full mt-4 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.limitExceeded
                        ? 'bg-rose-500'
                        : summary.warningThresholdReached
                        ? 'bg-amber-500'
                        : 'bg-[#397C80]'
                    }`}
                    style={{ width: `${Math.min(summary.spendingPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="mt-4 text-[10px] text-[#252B32]/60 border-t border-[#E5E0D7] pt-3 flex justify-between uppercase font-medium">
                <span>Ngưỡng cảnh báo: 80%</span>
                <span>Khóa quẹt thẻ: 100%</span>
              </div>
            </div>

            {/* Card 3: Spending Breakdown by Category */}
            <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm">
              <div className="text-[10px] uppercase tracking-wider text-[#252B32]/60 font-medium mb-3">
                Phân bổ theo danh mục
              </div>
              <div className="space-y-2.5">
                {Object.entries(summary.spendingByCategory).map(([cat, amt]) => {
                  const percent = summary.currentBalance > 0 ? (amt / summary.currentBalance) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#252B32]/80 font-medium">{CATEGORY_LABELS[cat] || cat}</span>
                        <span className="font-bold text-[#102A43] tabular-nums">{formatCurrency(amt)}</span>
                      </div>
                      <div className="w-full bg-[#F7F4ED] border border-[#E5E0D7] h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#397C80] rounded-full"
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
          <div className="flex justify-between items-center pb-2 border-b border-[#E5E0D7]">
            <h2 className="text-base font-display font-bold text-[#102A43] uppercase tracking-wide">
              Nhật Ký Giao Dịch Chi Tiết
            </h2>
            <span className="text-xs text-[#252B32]/60">Món miễn phí trong gói được thể hiện $0.00</span>
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
