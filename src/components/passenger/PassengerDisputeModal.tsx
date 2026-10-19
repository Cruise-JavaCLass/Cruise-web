import React, { useState } from 'react';
import {
  AlertCircle,
  X,
  FileQuestion,
  Send,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import {
  type DisputeReason,
  type GuestFolioItem,
  type CreateDisputePayload,
  type DisputeCase,
  reconciliationService,
} from '../../services/reconciliationService';

interface PassengerDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: GuestFolioItem | null;
  onSuccess: (createdDispute: DisputeCase) => void;
}

export const PassengerDisputeModal: React.FC<PassengerDisputeModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [reason, setReason] = useState<DisputeReason>('DUPLICATE_BILLING');
  const [disputeAmount, setDisputeAmount] = useState<string>(
    item ? String(item.amount) : '0'
  );
  const [passengerNote, setPassengerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (item) {
      setDisputeAmount(String(item.amount));
      setPassengerNote('');
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = Number.parseFloat(disputeAmount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setError('Số tiền khiếu nại phải lớn hơn 0');
      return;
    }
    if (amountNum > item.amount) {
      setError(`Số tiền khiếu nại không được vượt quá số tiền gốc ($${item.amount.toFixed(2)})`);
      return;
    }
    if (!passengerNote.trim()) {
      setError('Vui lòng nhập lý do giải thích chi tiết cho khiếu nại này');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateDisputePayload = {
        transactionId: item.transactionId,
        folioId: item.folioId,
        cabinNumber: item.cabinNumber,
        passengerName: item.passengerName,
        reason,
        disputeAmount: amountNum,
        passengerNote: passengerNote.trim(),
      };

      const created = await reconciliationService.createDispute(payload);
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi khiếu nại. Vui lòng thử lại sau.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#090d16] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Khiếu Nại Chi Phí Phòng</h3>
              <p className="text-xs text-slate-400">Yêu cầu đối soát & hoàn tiền vào tài khoản cabin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Transaction Summary */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Mã giao dịch:</span>
            <span className="font-mono text-cyan-400 font-semibold">{item.transactionId}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Dịch vụ:</span>
            <span className="text-white font-medium">{item.description}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Số tiền gốc đã ghi nợ:</span>
            <span className="text-amber-400 font-bold font-mono text-sm">
              ${item.amount.toFixed(2)} USD
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="passenger-dispute-reason" className="block text-xs font-medium text-slate-300 mb-1.5">
              Lý Do Khiếu Nại <span className="text-rose-400">*</span>
            </label>
            <select
              id="passenger-dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="DUPLICATE_BILLING">Bị tính tiền 2 lần (Duplicate Charge)</option>
              <option value="UNRECOGNIZED_CHARGE">Khoản phí lạ không chi tiêu (Unrecognized Charge)</option>
              <option value="INCORRECT_AMOUNT">Số tiền tính sai so với giá niêm yết (Incorrect Amount)</option>
              <option value="SERVICE_NOT_DELIVERED">Dịch vụ/Món chưa được cung cấp (Not Delivered)</option>
            </select>
          </div>

          <div>
            <label htmlFor="passenger-dispute-amount" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Số Tiền Yêu Cầu Hoàn Lại (USD)</span>
              <span className="text-[10px] text-slate-400">Tối đa ${item.amount.toFixed(2)}</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="passenger-dispute-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={item.amount}
                value={disputeAmount}
                onChange={(e) => setDisputeAmount(e.target.value)}
                className="w-full bg-[#030712] border border-white/10 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="passenger-dispute-note" className="block text-xs font-medium text-slate-300 mb-1.5">
              Mô Tả Chi Tiết Hoàn Cảnh <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="passenger-dispute-note"
              rows={3}
              value={passengerNote}
              onChange={(e) => setPassengerNote(e.target.value)}
              placeholder="Ví dụ: Tôi chỉ gọi 1 phần nước ép lúc 15:30 nhưng hóa đơn xuất hiện 2 lần quẹt thẻ..."
              className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <span>
              Yêu cầu của bạn sẽ được chuyển ngay đến Văn phòng Kế toán Purser Desk. Tiền hoàn trả sẽ ghi có trực tiếp vào Folio phòng khi được duyệt.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Khiếu Nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
