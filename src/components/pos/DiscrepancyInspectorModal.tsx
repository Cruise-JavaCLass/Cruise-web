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
import { useFocusTrap } from '../../hooks/useFocusTrap';

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
  const modalRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(isOpen, modalRef, onClose);

  React.useEffect(() => {
    if (record) {
      setResolutionNotes('');
    }
  }, [record]);

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
    } catch (err) {
      console.error('Failed to resolve discrepancy:', err);
      alert('Đã xảy ra lỗi khi xử lý sai lệch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discrepancy-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E0D7] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-[#252B32]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="discrepancy-inspector-title" className="text-lg font-serif font-bold text-[#102A43]">
                Soi Chi Tiết Sai Lệch Đối Soát
              </h3>
              <p className="text-xs text-[#687787]">
                Mã giao dịch: <span className="font-mono text-[#102A43] font-medium">{record.transactionId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#687787] hover:text-[#102A43] rounded-xl hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Side-by-Side Diff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* POS Terminal Column */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                1. Nhật Ký Trạm POS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                Journal Record
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#687787]">Khu vực:</span>
                <span className="text-[#252B32] font-medium">{record.serviceArea || 'Sky Bar'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687787]">Cabin / Khách:</span>
                <span className="text-[#252B32] font-semibold">{record.cabinNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687787]">Số tiền POS:</span>
                <span className="font-mono font-bold text-[#B45309]">
                  ${(record.posAmount || 0).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Folio Master Column */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D7] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">
                2. Sổ Cái Cabin Folio
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                Folio Ledger
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#687787]">Mã Folio:</span>
                <span className="text-[#252B32] font-mono font-medium">{record.folioId || 'CHƯA GHI NHẬN'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687787]">Tên hành khách:</span>
                <span className="text-[#252B32] font-medium">{record.passengerName || 'Chưa định danh'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#687787]">Số tiền Folio:</span>
                <span className="font-mono font-bold text-[#047857]">
                  ${(record.folioAmount || 0).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Variance Highlight Bar */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span>Chênh lệch phát hiện ({record.discrepancyType}):</span>
          </div>
          <span className="font-mono font-bold text-sm text-amber-900">
            ${record.variance.toFixed(2)} USD
          </span>
        </div>

        {/* Resolution Notes Input */}
        <div className="space-y-2">
          <label htmlFor="discrepancy-resolution-notes" className="block text-xs font-medium text-[#252B32]">
            Ghi Chú Giải Trình & Hướng Xử Lý <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="discrepancy-resolution-notes"
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Ví dụ: Đã kiểm tra bill giấy tại quầy, đồng ý tạo bút toán điều chỉnh bổ sung cho Folio..."
            className="w-full bg-[#FAF8F5] border border-[#E5E0D7] rounded-xl px-3.5 py-2.5 text-xs text-[#252B32] placeholder-[#687787] focus:outline-none focus:border-[#102A43] transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-medium text-[#687787] hover:text-[#102A43] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleResolveAction('WRITTEN_OFF')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-medium text-[#102A43] bg-white border border-[#E5E0D7] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            >
              Bỏ Qua / Xóa Lệch
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleResolveAction('RESOLVED')}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-[#102A43] hover:bg-[#183B5B] shadow-sm disabled:opacity-50 transition-all cursor-pointer"
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
