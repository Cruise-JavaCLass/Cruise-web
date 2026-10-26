import React from 'react';
import type { PosTransaction } from '../../services/posService';
import { CheckCircle2, Printer, X, ShieldCheck } from 'lucide-react';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PosTransaction | null;
  signatureBase64?: string;
  signerName?: string;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  signatureBase64,
  signerName,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-2 text-[#397C80]">
            <CheckCircle2 className="w-5 h-5 text-[#397C80]" />
            <h3 className="font-serif font-bold text-[#102A43] text-base">Hóa Đơn Điện Tử POS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4 text-[#252B32] text-sm overflow-y-auto max-h-[70vh]">
          <div className="text-center pb-3 border-b border-dashed border-[#E5E0D7]">
            <h4 className="text-base font-serif font-extrabold text-[#102A43] tracking-wide">CRUISE ONBOARD POS</h4>
            <p className="text-xs text-[#687787] mt-0.5">Trạm: {transaction.stationId} • Thu ngân: {transaction.cashierId}</p>
            <p className="text-xs text-[#687787] font-mono mt-1">Mã GD: {transaction.transactionUuid}</p>
            <p className="text-xs text-[#687787]">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</p>
          </div>

          {/* Guest info */}
          {transaction.cabinNumber && (
            <div className="bg-[#F7F4ED] p-3 rounded-xl border border-[#E5E0D7] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#687787]">Phòng / Cabin:</span>
                <span className="font-semibold text-[#102A43] font-mono">{transaction.cabinNumber}</span>
              </div>
              {(signerName || transaction.guestName) && (
                <div className="flex justify-between">
                  <span className="text-[#687787]">Hành khách:</span>
                  <span className="font-semibold text-[#102A43]">{signerName || transaction.guestName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#687787]">Thanh toán:</span>
                <span className="font-semibold text-[#8C6D37]">{transaction.paymentMethod}</span>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[#687787] border-b border-[#E5E0D7] pb-1 font-semibold uppercase">
              <span>Mặt hàng</span>
              <span>Thành tiền</span>
            </div>
            {transaction.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-medium text-[#102A43]">{item.itemName}</p>
                  <p className="text-[#687787]">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="font-semibold text-[#102A43] font-mono">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Summary Breakdown */}
          <div className="pt-3 border-t border-dashed border-[#E5E0D7] space-y-1.5 text-xs">
            <div className="flex justify-between text-[#687787]">
              <span>Tạm tính (Subtotal):</span>
              <span className="font-mono">${transaction.subtotal?.toFixed(2)}</span>
            </div>
            {transaction.tax > 0 && (
              <div className="flex justify-between text-[#687787]">
                <span>Thuế (Tax):</span>
                <span className="font-mono">${transaction.tax.toFixed(2)}</span>
              </div>
            )}
            {transaction.gratuity > 0 && (
              <div className="flex justify-between text-[#687787]">
                <span>Tip / Phí phục vụ:</span>
                <span className="font-mono">${transaction.gratuity.toFixed(2)}</span>
              </div>
            )}
            {transaction.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Chiết khấu (Discount):</span>
                <span className="font-mono">-${transaction.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#102A43] pt-2 border-t border-[#E5E0D7]">
              <span>Tổng thanh toán:</span>
              <span className="text-[#102A43] font-mono">${transaction.totalAmount?.toFixed(2)} {transaction.currency}</span>
            </div>
          </div>

          {/* Signature E-Archival Display */}
          {signatureBase64 && (
            <div className="pt-3 border-t border-dashed border-[#E5E0D7] space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-[#397C80] font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-[#397C80]" />
                <span>Chữ Ký Điện Tử Đã Lưu Trữ (Verified Digital Signature):</span>
              </div>
              <div className="bg-[#F7F4ED]/50 p-2 rounded-xl border border-[#E5E0D7] flex flex-col items-center">
                <img
                  src={signatureBase64}
                  alt="E-Signature"
                  className="max-h-20 object-contain rounded"
                />
                <p className="text-[10px] text-[#687787] mt-1">
                  Đã xác thực bởi khách: {signerName || transaction.guestName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F7F4ED]/50 border-t border-[#E5E0D7] flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" /> In Biên Lai
          </button>
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#102A43] hover:bg-[#183B5B] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
