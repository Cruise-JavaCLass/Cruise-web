import React from 'react';
import { PosTransaction } from '../../services/posService';
import { CheckCircle2, Printer, X, Receipt } from 'lucide-react';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PosTransaction | null;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Hóa Đơn Điện Tử POS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4 text-slate-300 text-sm overflow-y-auto max-h-[70vh]">
          <div className="text-center pb-3 border-b border-dashed border-slate-800">
            <h4 className="text-base font-extrabold text-white">CRUISE ONBOARD POS</h4>
            <p className="text-xs text-slate-400 mt-0.5">Trạm: {transaction.stationId} • Thu ngân: {transaction.cashierId}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">Mã GD: {transaction.transactionUuid}</p>
            <p className="text-xs text-slate-500">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</p>
          </div>

          {/* Guest info */}
          {transaction.cabinNumber && (
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Phòng / Cabin:</span>
                <span className="font-semibold text-white">{transaction.cabinNumber}</span>
              </div>
              {transaction.guestName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Hành khách:</span>
                  <span className="font-semibold text-white">{transaction.guestName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Thanh toán:</span>
                <span className="font-semibold text-amber-400">{transaction.paymentMethod}</span>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 border-b border-slate-800 pb-1">
              <span>Mặt hàng</span>
              <span>Thành tiền</span>
            </div>
            {transaction.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-medium text-white">{item.itemName}</p>
                  <p className="text-slate-500">{item.quantity} x ${item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="font-semibold text-white">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Summary Breakdown */}
          <div className="pt-3 border-t border-dashed border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Tạm tính (Subtotal):</span>
              <span>${transaction.subtotal?.toFixed(2)}</span>
            </div>
            {transaction.tax > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Thuế (Tax):</span>
                <span>${transaction.tax.toFixed(2)}</span>
              </div>
            )}
            {transaction.gratuity > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tip / Phí phục vụ:</span>
                <span>${transaction.gratuity.toFixed(2)}</span>
              </div>
            )}
            {transaction.discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Chiết khấu (Discount):</span>
                <span>-${transaction.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
              <span>Tổng thanh toán:</span>
              <span className="text-emerald-400">${transaction.totalAmount?.toFixed(2)} {transaction.currency}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> In Biên Lai
          </button>
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
