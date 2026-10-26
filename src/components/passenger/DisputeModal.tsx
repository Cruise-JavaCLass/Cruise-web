import React, { useState, useEffect } from 'react';
import type { FolioTransaction, DisputePayload } from '../../services/passengerFolioService';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FolioTransaction | null;
  onSubmitDispute: (payload: DisputePayload) => Promise<void>;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSubmitDispute,
}) => {
  const [reason, setReason] = useState<DisputePayload['reason']>('INCORRECT_AMOUNT');
  const [disputeAmount, setDisputeAmount] = useState<string>(transaction ? transaction.amount.toString() : '');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transaction) {
      setReason('INCORRECT_AMOUNT');
      setDisputeAmount(transaction.amount.toString());
      setNote('');
      setError(null);
    }
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(disputeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Số tiền khiếu nại không hợp lệ');
      return;
    }
    if (amountNum > transaction.amount) {
      setError(`Số tiền khiếu nại không thể vượt quá $${transaction.amount.toFixed(2)}`);
      return;
    }
    if (!note.trim()) {
      setError('Vui lòng nhập lý do/mô tả chi tiết khiếu nại');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmitDispute({
        reason,
        disputeAmount: amountNum,
        disputeNote: note.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gửi khiếu nại thất bại';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E0D7] text-[#252B32] relative overflow-hidden">
        <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#102A43] uppercase tracking-wide">
              Khiếu nại giao dịch
            </h3>
            <p className="text-xs text-[#397C80] font-mono mt-0.5 font-semibold">{transaction.transactionUuid}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#5A6B7C] hover:text-[#102A43] p-1.5 rounded-lg hover:bg-[#E5E0D7]/40 transition cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#F7F4ED] rounded-xl p-3.5 text-xs space-y-1.5 font-mono text-[#5A6B7C] border border-[#E5E0D7]">
              <div className="flex justify-between">
                <span>Địa điểm:</span>
                <span className="font-semibold text-[#102A43]">{transaction.locationCounter}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian:</span>
                <span className="text-[#252B32]">{new Date(transaction.time).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng hoá đơn gốc:</span>
                <span className="font-bold text-[#102A43] font-mono tabular-nums">${transaction.amount.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#102A43] mb-1.5">
                Lý do khiếu nại
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as DisputePayload['reason'])}
                className="w-full text-xs border border-[#E5E0D7] rounded-xl px-3.5 py-2.5 bg-[#F7F4ED]/40 text-[#252B32] focus:ring-1 focus:ring-[#102A43] focus:border-[#102A43] outline-none cursor-pointer"
              >
                <option value="INCORRECT_AMOUNT">Số tiền không chính xác (Tính sai đơn giá / sai món)</option>
                <option value="DUPLICATE_BILLING">Giao dịch bị trùng lặp (Quẹt 2 lần)</option>
                <option value="UNRECOGNIZED_CHARGE">Giao dịch không nhận diện (Tôi không sử dụng dịch vụ này)</option>
                <option value="SERVICE_NOT_DELIVERED">Dịch vụ chưa được cung cấp</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#102A43] mb-1.5">
                Số tiền khiếu nại ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={disputeAmount}
                onChange={(e) => setDisputeAmount(e.target.value)}
                className="w-full text-xs font-mono border border-[#E5E0D7] rounded-xl px-3.5 py-2.5 bg-[#F7F4ED]/40 text-[#252B32] focus:ring-1 focus:ring-[#102A43] focus:border-[#102A43] outline-none"
                placeholder="Nhập số tiền yêu cầu hoàn / điều chỉnh"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-[#102A43] mb-1.5">
                Mô tả chi tiết sự việc
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs border border-[#E5E0D7] rounded-xl px-3.5 py-2.5 bg-[#F7F4ED]/40 text-[#252B32] focus:ring-1 focus:ring-[#102A43] focus:border-[#102A43] outline-none resize-none"
                placeholder="Cung cấp lý do cụ thể để bộ phận Lễ tân & Kế toán kiểm tra..."
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E5E0D7]">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-[#5A6B7C] hover:text-[#102A43] bg-[#F7F4ED] border border-[#E5E0D7] hover:bg-[#ECE7DC] rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold uppercase bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? 'Đang gửi...' : 'Gửi khiếu nại đến Lễ tân'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DisputeModal;
