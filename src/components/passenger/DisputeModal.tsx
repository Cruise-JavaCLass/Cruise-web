import React, { useState } from 'react';
import { FolioTransaction, DisputePayload } from '../../services/passengerFolioService';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Khiếu nại giao dịch</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{transaction.transactionUuid}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span>Địa điểm:</span>
              <span className="font-medium text-gray-800">{transaction.locationCounter}</span>
            </div>
            <div className="flex justify-between">
              <span>Thời gian:</span>
              <span>{new Date(transaction.time).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Tổng hoá đơn gốc:</span>
              <span className="font-semibold text-gray-900">${transaction.amount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Lý do khiếu nại</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputePayload['reason'])}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="INCORRECT_AMOUNT">Số tiền không chính xác (Tính sai đơn giá / sai món)</option>
              <option value="DUPLICATE_BILLING">Giao dịch bị trùng lặp (Quẹt 2 lần)</option>
              <option value="UNRECOGNIZED_CHARGE">Giao dịch không nhận diện (Tôi không sử dụng dịch vụ này)</option>
              <option value="SERVICE_NOT_DELIVERED">Dịch vụ chưa được cung cấp</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Số tiền khiếu nại ($)</label>
            <input
              type="number"
              step="0.01"
              value={disputeAmount}
              onChange={(e) => setDisputeAmount(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Nhập số tiền yêu cầu hoàn / điều chỉnh"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mô tả chi tiết sự việc</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Cung cấp lý do cụ thể để bộ phận Lễ tân & Kế toán kiểm tra..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? 'Đang gửi...' : 'Gửi khiếu nại đến Lễ tân'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
