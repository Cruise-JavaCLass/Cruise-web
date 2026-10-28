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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-[#E5E0D7] rounded-2xl shadow-2xl text-[#252B32] overflow-hidden">
        {/* Header */}
        <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C5A572]/15 border border-[#C5A572]/30 flex items-center justify-center text-[#9E7A3E]">
              <FileQuestion className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#102A43]">Khiếu Nại Chi Phí Phòng</h3>
              <p className="text-xs text-[#5A6B7C]">Yêu cầu đối soát & hoàn tiền vào tài khoản cabin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 text-[#5A6B7C] hover:text-[#102A43] rounded-xl hover:bg-[#E5E0D7]/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Selected Transaction Summary */}
          <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#E5E0D7] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5A6B7C]">Mã giao dịch:</span>
              <span className="font-mono text-[#397C80] font-semibold">{item.transactionId}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5A6B7C]">Dịch vụ:</span>
              <span className="text-[#102A43] font-medium">{item.description}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#5A6B7C]">Số tiền gốc đã ghi nợ:</span>
              <span className="text-[#102A43] font-bold font-mono text-sm">
                ${item.amount.toFixed(2)} USD
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="passenger-dispute-reason" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Lý Do Khiếu Nại <span className="text-rose-500">*</span>
              </label>
              <select
                id="passenger-dispute-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as DisputeReason)}
                className="w-full bg-[#F7F4ED]/40 border border-[#E5E0D7] rounded-xl px-3.5 py-2.5 text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] transition-colors"
              >
                <option value="DUPLICATE_BILLING">Bị tính tiền 2 lần (Duplicate Charge)</option>
                <option value="UNRECOGNIZED_CHARGE">Khoản phí lạ không chi tiêu (Unrecognized Charge)</option>
                <option value="INCORRECT_AMOUNT">Số tiền tính sai so với giá niêm yết (Incorrect Amount)</option>
                <option value="SERVICE_NOT_DELIVERED">Dịch vụ/Món chưa được cung cấp (Not Delivered)</option>
              </select>
            </div>

            <div>
              <label htmlFor="passenger-dispute-amount" className="block text-xs font-semibold text-[#102A43] mb-1.5 flex items-center justify-between">
                <span>Số Tiền Yêu Cầu Hoàn Lại (USD)</span>
                <span className="text-[10px] text-[#5A6B7C]">Tối đa ${item.amount.toFixed(2)}</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#5A6B7C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="passenger-dispute-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={item.amount}
                  value={disputeAmount}
                  onChange={(e) => setDisputeAmount(e.target.value)}
                  className="w-full bg-[#F7F4ED]/40 border border-[#E5E0D7] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] transition-colors font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="passenger-dispute-note" className="block text-xs font-semibold text-[#102A43] mb-1.5">
                Mô Tả Chi Tiết Hoàn Cảnh <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="passenger-dispute-note"
                rows={3}
                value={passengerNote}
                onChange={(e) => setPassengerNote(e.target.value)}
                placeholder="Ví dụ: Tôi chỉ gọi 1 phần nước ép lúc 15:30 nhưng hóa đơn xuất hiện 2 lần quẹt thẻ..."
                className="w-full bg-[#F7F4ED]/40 border border-[#E5E0D7] rounded-xl px-3.5 py-2.5 text-xs text-[#252B32] placeholder-[#5A6B7C]/70 focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] transition-colors"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-[#397C80]/10 border border-[#397C80]/20 text-[11px] text-[#397C80] flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#397C80] mt-0.5" />
              <span>
                Yêu cầu của bạn sẽ được chuyển ngay đến Văn phòng Kế toán Purser Desk. Tiền hoàn trả sẽ ghi có trực tiếp vào Folio phòng khi được duyệt.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#5A6B7C] hover:text-[#102A43] bg-[#F7F4ED] border border-[#E5E0D7] hover:bg-[#ECE7DC] transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#102A43] hover:bg-[#0B1F33] shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Khiếu Nại'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
