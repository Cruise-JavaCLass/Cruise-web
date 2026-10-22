import React, { useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';
import type { AdjustmentType, CreateAdjustmentRequest } from '../../services/providerSettlementService';

interface DisputeAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdjustmentRequest) => Promise<void>;
  settlementTitle: string;
}

export const DisputeAdjustmentModal: React.FC<DisputeAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  settlementTitle,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('PENALTY_WEATHER_DELAY');
  const [amount, setAmount] = useState<number | ''>('');
  const [invoiceReference, setInvoiceReference] = useState('');
  const [explanation, setExplanation] = useState('');
  const [recordedBy, setRecordedBy] = useState('SHORE_EXCURSION_MANAGER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Vui lòng nhập số tiền điều chỉnh hợp lệ (> 0)');
      return;
    }
    if (!explanation.trim()) {
      setError('Vui lòng nhập lý do giải trình chi tiết');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        adjustmentType,
        amount: Number(amount),
        invoiceReference: invoiceReference.trim() || undefined,
        explanation: explanation.trim(),
        recordedBy: recordedBy.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu điều chỉnh');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispute-modal-title"
    >
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 id="dispute-modal-title" className="text-base font-semibold text-white">
              Ghi Nhận Điều Chỉnh / Tranh Chấp Chi Phí
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Đóng dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Tour đối soát: <span className="text-cyan-300 font-medium">{settlementTitle}</span>
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-medium">Loại Điều Chỉnh</label>
            <select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="PENALTY_WEATHER_DELAY">Phạt Trễ Do Thời Tiết (Khấu trừ)</option>
              <option value="PENALTY_VEHICLE_DEFECT">Phạt Phương Tiện Không Đạt Chuẩn (Khấu trừ)</option>
              <option value="PENALTY_GUIDE_NO_SHOW">Phạt Hướng Dẫn Viên Vắng Mặt (Khấu trừ)</option>
              <option value="EXTRA_SERVICE">Phụ Phí Dịch Vụ Phát Sinh (Cộng thêm)</option>
              <option value="OTHER_COMPENSATION">Bồi Thường Khác (Cộng thêm)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Số Tiền (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="VD: 150.00"
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Mã Hóa Đơn / Chứng Từ Đối Soát</label>
            <input
              type="text"
              value={invoiceReference}
              onChange={(e) => setInvoiceReference(e.target.value)}
              placeholder="VD: INV-DISPUTE-2026-09"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-medium">Lý Do Giải Trình Chi Tiết *</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Giải trình cụ thể sự cố, chênh lệch thực tế so với hợp đồng..."
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'Đang lưu...' : 'Lưu Điều Chỉnh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
