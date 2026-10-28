import React, { useState, useRef } from 'react';
import {
  FileQuestion,
  Search,
  Eye,
} from 'lucide-react';
import {
  type DisputeCase,
  type ResolveDisputePayload,
} from '../../services/reconciliationService';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface DisputeManagementWorkspaceProps {
  disputes: DisputeCase[];
  onResolveDispute: (id: number, payload: ResolveDisputePayload) => Promise<void>;
  isLoading: boolean;
}

export const DisputeManagementWorkspace: React.FC<DisputeManagementWorkspaceProps> = ({
  disputes,
  onResolveDispute,
  isLoading,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(!!selectedDispute, modalRef, () => setSelectedDispute(null));

  const filteredDisputes = disputes.filter((d) => {
    const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
    const matchSearch =
      d.disputeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cabinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.passengerName && d.passengerName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const handleOpenDetail = (d: DisputeCase) => {
    setSelectedDispute(d);
    setApprovedAmount(String(d.disputeAmount));
    setReviewNote('');
  };

  const handleDecision = async (decisionStatus: 'APPROVED_ADJUSTED' | 'REJECTED') => {
    if (!selectedDispute) return;
    if (!reviewNote.trim()) {
      alert('Vui lòng nhập lý do/ghi chú thẩm định khiếu nại');
      return;
    }

    const refund = Number.parseFloat(approvedAmount);
    if (decisionStatus === 'APPROVED_ADJUSTED') {
      if (Number.isNaN(refund) || refund <= 0) {
        alert('Số tiền hoàn trả phải lớn hơn 0');
        return;
      }
      if (refund > selectedDispute.disputeAmount) {
        alert(`Số tiền hoàn trả không được vượt quá số tiền khiếu nại ($${selectedDispute.disputeAmount.toFixed(2)})`);
        return;
      }
    }

    setIsProcessing(true);
    try {
      await onResolveDispute(selectedDispute.id, {
        decisionStatus,
        approvedRefundAmount: decisionStatus === 'APPROVED_ADJUSTED' ? refund : undefined,
        reviewerNote: reviewNote.trim(),
        reviewerId: 'PURSER_LEAD',
      });
      setSelectedDispute(null);
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
      alert('Đã xảy ra lỗi khi xử lý khiếu nại. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#687787] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số phòng, mã khiếu nại, tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#E5E0D7] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#252B32] placeholder-[#687787] focus:outline-none focus:border-[#102A43] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'SUBMITTED', 'APPROVED_ADJUSTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#102A43] text-white shadow-sm'
                  : 'bg-white border border-[#E5E0D7] text-[#687787] hover:text-[#102A43] hover:bg-[#FAF8F5]'
              }`}
            >
              {st === 'ALL' && 'Tất cả trạng thái'}
              {st === 'SUBMITTED' && 'Chờ xử lý'}
              {st === 'APPROVED_ADJUSTED' && 'Đã hoàn tiền'}
              {st === 'REJECTED' && 'Đã từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes List */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-[#E5E0D7] bg-[#F7F4ED] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#102A43] uppercase tracking-wider flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-[#397C80]" /> Danh Sách Hồ Sơ Khiếu Nại Chi Phí
          </span>
          <span className="text-[11px] text-[#687787]">
            {filteredDisputes.length} Hồ sơ
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-[#687787] text-xs">Đang tải hồ sơ khiếu nại...</div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-12 text-center text-[#687787] text-xs">
            Không có hồ sơ khiếu nại nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-[#E5E0D7]">
            {filteredDisputes.map((d) => (
              <div
                key={d.id}
                className="p-4 sm:p-5 hover:bg-[#FAF8F5] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#102A43]">
                      {d.disputeNumber}
                    </span>
                    <span className="text-xs text-[#252B32] font-semibold">{d.cabinNumber}</span>
                    <span className="text-xs text-[#687787]">({d.passengerName || 'Khách phòng'})</span>
                  </div>

                  <p className="text-xs text-[#252B32] italic">"{d.passengerNote}"</p>

                  <div className="flex items-center gap-3 text-[11px] text-[#687787] pt-0.5">
                    <span>Lý do: <strong className="text-[#252B32]">{d.reason}</strong></span>
                    <span>•</span>
                    <span>Mã Tx: <span className="font-mono text-[#102A43]">{d.transactionId}</span></span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="block text-sm font-bold font-mono text-[#047857]">
                      ${d.disputeAmount.toFixed(2)} USD
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${
                        d.status === 'APPROVED_ADJUSTED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : d.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : d.status === 'UNDER_INVESTIGATION'
                          ? 'bg-sky-50 text-sky-800 border border-sky-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {d.status === 'SUBMITTED'
                        ? 'Chờ duyệt'
                        : d.status === 'UNDER_INVESTIGATION'
                        ? 'Đang điều tra'
                        : d.status === 'APPROVED_ADJUSTED'
                        ? 'Đã duyệt hoàn'
                        : 'Từ chối'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenDetail(d)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#102A43] bg-[#FAF8F5] border border-[#E5E0D7] hover:bg-[#F7F4ED] hover:border-[#C5A572] transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#397C80]" />
                    Thẩm định
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dispute Review Modal */}
      {selectedDispute && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dispute-review-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-xl bg-white border border-[#E5E0D7] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5 text-[#252B32]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D7]">
              <h3 id="dispute-review-modal-title" className="text-base font-serif font-bold text-[#102A43] flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-[#397C80]" /> Thẩm Định Khiếu Nại #{selectedDispute.disputeNumber}
              </h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-[#687787] hover:text-[#102A43] p-1 rounded-lg hover:bg-[#FAF8F5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D7] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#687787]">Cabin / Khách hàng:</span>
                <span className="text-[#102A43] font-semibold">
                  {selectedDispute.cabinNumber} • {selectedDispute.passengerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687787]">Mã giao dịch chi tiêu:</span>
                <span className="text-[#102A43] font-mono font-medium">{selectedDispute.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687787]">Số tiền khiếu nại:</span>
                <span className="text-[#047857] font-mono font-bold text-sm">
                  ${selectedDispute.disputeAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[#687787] block mb-0.5">Nội dung hành khách phản ánh:</span>
                <p className="text-[#252B32] bg-white p-2.5 rounded-xl border border-[#E5E0D7] italic">
                  "{selectedDispute.passengerNote}"
                </p>
              </div>
            </div>

            {selectedDispute.status === 'SUBMITTED' || selectedDispute.status === 'UNDER_INVESTIGATION' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="approved-amount-input" className="block text-xs font-medium text-[#252B32] mb-1">
                    Số Tiền Chấp Thuận Hoàn Trả (USD)
                  </label>
                  <input
                    id="approved-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedDispute.disputeAmount}
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D7] rounded-xl px-3.5 py-2 text-xs text-[#252B32] font-mono focus:outline-none focus:border-[#102A43]"
                  />
                </div>

                <div>
                  <label htmlFor="review-note-input" className="block text-xs font-medium text-[#252B32] mb-1">
                    Ghi Chú Thẩm Định Của Kế Toán / Purser <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="review-note-input"
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Nhập lý do phê duyệt hoàn tiền hoặc căn cứ từ chối..."
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D7] rounded-xl px-3.5 py-2 text-xs text-[#252B32] placeholder-[#687787] focus:outline-none focus:border-[#102A43]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('REJECTED')}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                  >
                    Từ Chối Khiếu Nại
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('APPROVED_ADJUSTED')}
                    className="px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-[#102A43] hover:bg-[#183B5B] shadow-sm cursor-pointer"
                  >
                    {isProcessing ? 'Đang duyệt...' : 'Phê Duyệt & Bù Trừ Folio (1-Click)'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D7] text-xs space-y-1">
                <span className="text-[#687787]">Trạng thái hồ sơ:</span>
                <p className="text-[#102A43] font-bold">{selectedDispute.status}</p>
                {selectedDispute.reviewerNote && (
                  <p className="text-[#252B32] pt-1">
                    Ghi chú của {selectedDispute.reviewerId}: "{selectedDispute.reviewerNote}"
                  </p>
                )}
                {selectedDispute.adjustmentTransactionId && (
                  <p className="text-emerald-700 font-mono text-[11px]">
                    Bút toán điều chỉnh Folio: {selectedDispute.adjustmentTransactionId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
