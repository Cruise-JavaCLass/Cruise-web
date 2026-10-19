import React from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import {
  type DiscrepancyRecord,
  type ResolveDiscrepancyPayload,
} from '../../services/reconciliationService';

interface DiscrepancyInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: DiscrepancyRecord | null;
  onResolve: (id: number, payload: ResolveDiscrepancyPayload) => Promise<void>;
}

export const DiscrepancyInspectorModal: React.FC<DiscrepancyInspectorModalProps> = ({
  isOpen,
  onClose,
  record,
  onResolve,
}) => {
  const [resolutionNotes, setResolutionNotes] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen || !record) return null;

  const handleResolveAction = async (status: 'RESOLVED' | 'WRITTEN_OFF') => {
    if (!resolutionNotes.trim()) {
      alert('Vui lòng nhập ghi chú giải trình trước khi xử lý sai lệch');
      return;
    }

    setIsSubmitting(true);
    try {
      await onResolve(record.id, {
        status,
        resolutionNotes: resolutionNotes.trim(),
        resolvedBy: 'PURSER_OFFICER',
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#090d16] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Soi Chi Tiết Sai Lệch Đối Soát</h3>
              <p className="text-xs text-slate-400">
                Mã giao dịch: <span className="font-mono text-cyan-400">{record.transactionId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Side-by-Side Diff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* POS Terminal Column */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                1. Nhật Ký Trạm POS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                Journal Record
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Khu vực:</span>
                <span className="text-white">{record.serviceArea || 'Sky Bar'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cabin / Khách:</span>
                <span className="text-white font-medium">{record.cabinNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền POS:</span>
                <span className="font-mono font-bold text-amber-400">
                  ${(record.posAmount || 0).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Folio Master Column */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                2. Sổ Cái Cabin Folio
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300">
                Folio Ledger
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã Folio:</span>
                <span className="text-white font-mono">{record.folioId || 'CHƯA GHI NHẬN'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tên hành khách:</span>
                <span className="text-white">{record.passengerName || 'Chưa định danh'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền Folio:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${(record.folioAmount || 0).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Variance Highlight Bar */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Chênh lệch phát hiện ({record.discrepancyType}):</span>
          </div>
          <span className="font-mono font-bold text-sm text-amber-300">
            ${record.variance.toFixed(2)} USD
          </span>
        </div>

        {/* Resolution Notes Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Ghi Chú Giải Trình & Hướng Xử Lý <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Ví dụ: Đã kiểm tra bill giấy tại quầy, đồng ý tạo bút toán điều chỉnh bổ sung cho Folio..."
            className="w-full bg-[#030712] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleResolveAction('WRITTEN_OFF')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
            >
              Bỏ Qua / Xóa Lệch
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleResolveAction('RESOLVED')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting ? 'Đang lưu...' : 'Xác Nhận Đã Giải Quyết'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
