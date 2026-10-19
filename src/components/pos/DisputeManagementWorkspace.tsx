import React, { useState } from 'react';
import {
  FileQuestion,
  Search,
  Eye,
} from 'lucide-react';
import {
  type DisputeCase,
  type ResolveDisputePayload,
} from '../../services/reconciliationService';

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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số phòng, mã khiếu nại, tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#030712] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'SUBMITTED', 'APPROVED_ADJUSTED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
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
      <div className="bg-[#030303]/60 border border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-amber-400" /> Danh Sách Hồ Sơ Khiếu Nại Chi Phí
          </span>
          <span className="text-[11px] text-slate-400">
            {filteredDisputes.length} Hồ sơ
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Đang tải hồ sơ khiếu nại...</div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Không có hồ sơ khiếu nại nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredDisputes.map((d) => (
              <div
                key={d.id}
                className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {d.disputeNumber}
                    </span>
                    <span className="text-xs text-white font-medium">{d.cabinNumber}</span>
                    <span className="text-xs text-slate-400">({d.passengerName || 'Khách phòng'})</span>
                  </div>

                  <p className="text-xs text-slate-300 italic">"{d.passengerNote}"</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                    <span>Lý do: <strong className="text-slate-300">{d.reason}</strong></span>
                    <span>•</span>
                    <span>Mã Tx: <span className="font-mono text-cyan-300">{d.transactionId}</span></span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="block text-sm font-bold font-mono text-amber-400">
                      ${d.disputeAmount.toFixed(2)} USD
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${
                        d.status === 'APPROVED_ADJUSTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : d.status === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : d.status === 'UNDER_INVESTIGATION'
                          ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-[#090d16] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-cyan-400" /> Thẩm Định Khiếu Nại #{selectedDispute.disputeNumber}
              </h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Cabin / Khách hàng:</span>
                <span className="text-white font-semibold">
                  {selectedDispute.cabinNumber} • {selectedDispute.passengerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Mã giao dịch chi tiêu:</span>
                <span className="text-cyan-400 font-mono">{selectedDispute.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền khiếu nại:</span>
                <span className="text-amber-400 font-mono font-bold text-sm">
                  ${selectedDispute.disputeAmount.toFixed(2)} USD
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-400 block mb-0.5">Nội dung hành khách phản ánh:</span>
                <p className="text-white bg-black/40 p-2.5 rounded-xl border border-white/5 italic">
                  "{selectedDispute.passengerNote}"
                </p>
              </div>
            </div>

            {selectedDispute.status === 'SUBMITTED' || selectedDispute.status === 'UNDER_INVESTIGATION' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="approved-amount-input" className="block text-xs font-medium text-slate-300 mb-1">
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
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="review-note-input" className="block text-xs font-medium text-slate-300 mb-1">
                    Ghi Chú Thẩm Định Của Kế Toán / Purser <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="review-note-input"
                    rows={3}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Nhập lý do phê duyệt hoàn tiền hoặc căn cứ từ chối..."
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('REJECTED')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer"
                  >
                    Từ Chối Khiếu Nại
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleDecision('APPROVED_ADJUSTED')}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    {isProcessing ? 'Đang duyệt...' : 'Phê Duyệt & Bù Trừ Folio (1-Click)'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                <span className="text-slate-400">Trạng thái hồ sơ:</span>
                <p className="text-white font-bold">{selectedDispute.status}</p>
                {selectedDispute.reviewerNote && (
                  <p className="text-slate-300 pt-1">
                    Ghi chú của {selectedDispute.reviewerId}: "{selectedDispute.reviewerNote}"
                  </p>
                )}
                {selectedDispute.adjustmentTransactionId && (
                  <p className="text-emerald-400 font-mono text-[11px]">
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
