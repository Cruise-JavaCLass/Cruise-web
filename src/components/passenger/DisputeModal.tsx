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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#151F33] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#42E8F5]/30 text-[#F4F4F0] relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#42E8F5]/20">
          <div>
            <h3 className="text-lg font-display font-black text-[#F4F4F0] uppercase tracking-wide">
              Khiếu nại giao dịch
            </h3>
            <p className="text-xs text-[#42E8F5] font-mono mt-0.5">{transaction.transactionUuid}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#A7B4C9] hover:text-[#F4F4F0] p-1.5 rounded-lg hover:bg-[#10182A] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-[#10182A] rounded-xl p-3 text-xs space-y-1.5 font-mono text-[#A7B4C9] border border-[#42E8F5]/15">
            <div className="flex justify-between">
              <span>Địa điểm:</span>
              <span className="font-semibold text-[#F4F4F0]">{transaction.locationCounter}</span>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span className="text-[#F4F4F0]">{new Date(transaction.time).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng hoá đơn gốc:</span>
              <span className="font-bold text-[#FFBD59] tabular-nums">${transaction.amount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7B4C9] mb-1.5">
              Lý do khiếu nại
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputePayload['reason'])}
              className="w-full text-xs font-mono border border-[#42E8F5]/30 rounded-lg px-3 py-2.5 bg-[#10182A] text-[#F4F4F0] focus:ring-1 focus:ring-[#42E8F5] focus:border-[#42E8F5] outline-none cursor-pointer"
            >
              <option value="INCORRECT_AMOUNT">Số tiền không chính xác (Tính sai đơn giá / sai món)</option>
              <option value="DUPLICATE_BILLING">Giao dịch bị trùng lặp (Quẹt 2 lần)</option>
              <option value="UNRECOGNIZED_CHARGE">Giao dịch không nhận diện (Tôi không sử dụng dịch vụ này)</option>
              <option value="SERVICE_NOT_DELIVERED">Dịch vụ chưa được cung cấp</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7B4C9] mb-1.5">
              Số tiền khiếu nại ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={disputeAmount}
              onChange={(e) => setDisputeAmount(e.target.value)}
              className="w-full text-xs font-mono border border-[#42E8F5]/30 rounded-lg px-3 py-2.5 bg-[#10182A] text-[#F4F4F0] focus:ring-1 focus:ring-[#42E8F5] focus:border-[#42E8F5] outline-none"
              placeholder="Nhập số tiền yêu cầu hoàn / điều chỉnh"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#A7B4C9] mb-1.5">
              Mô tả chi tiết sự việc
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs font-mono border border-[#42E8F5]/30 rounded-lg px-3 py-2.5 bg-[#10182A] text-[#F4F4F0] focus:ring-1 focus:ring-[#42E8F5] focus:border-[#42E8F5] outline-none resize-none"
              placeholder="Cung cấp lý do cụ thể để bộ phận Lễ tân & Kế toán kiểm tra..."
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#42E8F5]/15">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-mono text-[#A7B4C9] hover:text-[#F4F4F0] hover:bg-[#10182A] rounded-lg transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-mono font-bold uppercase bg-[#4169FF] hover:bg-[#3458db] text-white rounded-lg shadow-lg shadow-[#4169FF]/25 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? 'Đang gửi...' : 'Gửi khiếu nại đến Lễ tân'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;
