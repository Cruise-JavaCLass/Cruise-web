import React, { useState, useEffect } from 'react';
import { posService, type PosTransaction } from '../../services/posService';
import { AlertTriangle, ShieldCheck, X, RotateCcw, DollarSign } from 'lucide-react';

interface ManagerVoidRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: PosTransaction | null;
  mode: 'VOID' | 'REFUND';
}

export const ManagerVoidRefundModal: React.FC<ManagerVoidRefundModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
  mode,
}) => {
  const [reason, setReason] = useState('');
  const [performedBy, setPerformedBy] = useState('SUPERVISOR-LE');
  const [managerPin, setManagerPin] = useState('8888');
  const [managerId] = useState('MGR-MAIN');
  const [refundAmount, setRefundAmount] = useState<number>(
    transaction?.remainingRefundableAmount ?? transaction?.totalAmount ?? 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setReason('');
      setPerformedBy('SUPERVISOR-LE');
      setManagerPin('8888');
      setRefundAmount(transaction.remainingRefundableAmount ?? transaction.totalAmount ?? 0);
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, transaction, mode]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reason.trim()) {
      setErrorMsg('Vui lòng nhập lý do thực hiện thao tác!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'VOID') {
        await posService.voidTransaction(transaction.id, {
          voidReason: reason,
          performedBy,
          managerPin,
        });
      } else {
        if (!managerPin || managerPin.length < 4) {
          setErrorMsg('Mã PIN Quản lý phải có ít nhất 4 chữ số!');
          setIsSubmitting(false);
          return;
        }

        const remaining = transaction.remainingRefundableAmount ?? transaction.totalAmount;
        if (refundAmount <= 0 || refundAmount > remaining) {
          setErrorMsg(`Số tiền hoàn phải lớn hơn 0 và không vượt quá $${remaining.toFixed(2)}!`);
          setIsSubmitting(false);
          return;
        }

        await posService.refundTransaction(transaction.id, {
          refundAmount,
          refundReason: reason,
          performedBy,
          managerPin,
          managerId,
        });
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu!';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVoid = mode === 'VOID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-2">
            {isVoid ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <RotateCcw className="w-5 h-5 text-[#397C80]" />
            )}
            <h3 className="font-serif font-bold text-[#102A43] text-base">
              {isVoid ? 'Ủy Quyền Hủy Giao Dịch (Void)' : 'Ủy Quyền Hoàn Tiền (Refund)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#252B32]">
          {/* Target transaction summary */}
          <div className="bg-[#F7F4ED] p-3.5 rounded-xl border border-[#E5E0D7] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#687787]">Mã giao dịch:</span>
              <span className="font-mono text-[#252B32]">{transaction.transactionUuid}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#687787]">Phòng / Khách hàng:</span>
              <span className="font-semibold text-[#102A43]">
                {transaction.cabinNumber || 'N/A'} - {transaction.guestName || 'Khách vãng lai'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#687787]">Tổng tiền ban đầu:</span>
              <span className="font-bold font-mono text-[#102A43]">${transaction.totalAmount?.toFixed(2)}</span>
            </div>
            {!isVoid && (
              <div className="flex justify-between items-center text-xs pt-1 border-t border-[#E5E0D7]">
                <span className="text-[#687787]">Số dư có thể hoàn lại:</span>
                <span className="font-bold text-[#8C6D37] font-mono">
                  ${(transaction.remainingRefundableAmount ?? transaction.totalAmount).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Refund Amount input */}
          {!isVoid && (
            <div>
              <label htmlFor="modal-refund-amount" className="font-semibold text-[#102A43] block mb-1">
                Số Tiền Hoàn ($):
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687787]" />
                <input
                  id="modal-refund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={transaction.remainingRefundableAmount ?? transaction.totalAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] font-mono"
                  required
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label htmlFor="modal-reason" className="font-semibold text-[#102A43] block mb-1">
              Lý Do {isVoid ? 'Hủy' : 'Hoàn Tiền'} <span className="text-rose-600">*</span>:
            </label>
            <textarea
              id="modal-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isVoid ? 'VD: Thu ngân nhập sai món ăn, khách đổi ý ngay tại bàn' : 'VD: Khách khiếu nại chất lượng dịch vụ, trả lại hàng duty-free'}
              className="w-full p-2.5 bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] resize-none"
              required
            />
          </div>

          {/* Manager Authorization PIN */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="modal-manager-pin" className="font-semibold text-[#102A43] block mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#397C80]" /> Mã PIN Quản Lý:
              </label>
              <input
                id="modal-manager-pin"
                type="password"
                maxLength={6}
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="4-6 chữ số (VD: 8888)"
                className="w-full p-2 bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43] font-mono text-center tracking-widest"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-performed-by" className="font-semibold text-[#102A43] block mb-1">Người Duyệt / Quản Lý:</label>
              <input
                id="modal-performed-by"
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full p-2 bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-[#E5E0D7] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F7F4ED] text-[#687787] hover:text-[#102A43] border border-[#E5E0D7] rounded-xl font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                isVoid
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#102A43] hover:bg-[#183B5B]'
              }`}
            >
              {isSubmitting ? 'Đang xử lý...' : isVoid ? 'Xác Nhận Hủy (Void)' : 'Xác Nhận Hoàn Tiền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
