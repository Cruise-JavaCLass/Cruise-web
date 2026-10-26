import { useState } from 'react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertOctagon,
} from 'lucide-react';
import {
  type ShoreExcursion,
  type ExcursionStatus,
  updateExcursionStatus,
  EXCURSION_STATUS_MAP,
  EXCURSION_STATUS_TRANSITIONS,
  canTransitionExcursionStatus,
} from '../../services/excursionService';

interface ExcursionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  excursion: ShoreExcursion;
}

export function ExcursionStatusModal({
  isOpen,
  onClose,
  onSuccess,
  excursion,
}: ExcursionStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ExcursionStatus>(excursion.status);
  const [reason, setReason] = useState<string>(
    excursion.delayReason || excursion.cancellationReason || ''
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const allowedTransitions = EXCURSION_STATUS_TRANSITIONS[excursion.status] || [];
  const statusConfig = EXCURSION_STATUS_MAP[excursion.status];

  const handleStatusSelect = (status: ExcursionStatus) => {
    setSelectedStatus(status);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedStatus === excursion.status) {
      onClose();
      return;
    }

    if (!canTransitionExcursionStatus(excursion.status, selectedStatus)) {
      setError(`Không thể chuyển đổi trực tiếp từ trạng thái ${excursion.status} sang ${selectedStatus}`);
      return;
    }

    if (selectedStatus === 'DELAYED' && (!reason || !reason.trim())) {
      setError('Vui lòng nhập lý do bị trễ giờ (để thông báo bộ phận điều phối và hành khách)');
      return;
    }

    if (selectedStatus === 'CANCELLED' && (!reason || !reason.trim())) {
      setError('Vui lòng nhập lý do hủy chuyến tour trên bờ');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await updateExcursionStatus(excursion.id, selectedStatus, reason.trim());
      onSuccess();
      onClose();
    } catch {
      setError('Không thể cập nhật trạng thái tour. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (st: ExcursionStatus) => {
    switch (st) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-[#397C80]" />;
      case 'IN_PROGRESS':
        return <PlayCircle className="w-4 h-4 text-blue-600" />;
      case 'DELAYED':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="excursion-status-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1F33]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white border border-[#E5E0D7] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#397C80]/10 border border-[#397C80]/20 flex items-center justify-center text-[#397C80]">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 id="excursion-status-modal-title" className="text-sm font-bold text-[#102A43] tracking-wide">
                Chuyển Đổi Trạng Thái Tour Trên Bờ
              </h3>
              <span className="text-xs text-[#252B32]/70 block truncate max-w-[280px]">
                {excursion.title} ({excursion.code})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#252B32]/60 hover:text-[#102A43] rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Status Box */}
          <div className="p-3.5 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl space-y-1">
            <span className="text-[11px] font-semibold text-[#102A43] uppercase tracking-wider block">
              Trạng thái hiện tại:
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.cls}`}>
                {getStatusIcon(excursion.status)}
                {statusConfig.label}
              </span>
            </div>
            <p className="text-[11px] text-[#252B32]/70 mt-1">{statusConfig.desc}</p>
          </div>

          {/* Target Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#102A43] block">
              Chọn trạng thái chuyển tiếp:
            </label>

            {allowedTransitions.length === 0 ? (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                Tour đã hoàn thành và đạt trạng thái cuối cùng, không thể chuyển đổi thêm.
              </p>
            ) : (
              <div className="space-y-2">
                {allowedTransitions.map((st) => {
                  const cfg = EXCURSION_STATUS_MAP[st];
                  const isSelected = selectedStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusSelect(st)}
                      className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#102A43] border-[#102A43] text-white shadow-sm'
                          : 'bg-white border-[#E5E0D7] hover:bg-[#F7F4ED] text-[#252B32]'
                      }`}
                    >
                      <div className="mt-0.5">{getStatusIcon(st)}</div>
                      <div>
                        <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#102A43]'}`}>{cfg.label}</p>
                        <p className={`text-[11px] ${isSelected ? 'text-slate-200' : 'text-[#252B32]/70'}`}>{cfg.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason input for DELAYED or CANCELLED */}
          {(selectedStatus === 'DELAYED' || selectedStatus === 'CANCELLED') && (
            <div>
              <label htmlFor="status-reason-input" className="block text-xs font-semibold text-[#102A43] mb-1">
                {selectedStatus === 'DELAYED' ? 'Lý do bị trễ giờ' : 'Lý do hủy tour'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="status-reason-input"
                rows={2}
                placeholder={
                  selectedStatus === 'DELAYED'
                    ? 'Ví dụ: Tắc đường cục bộ tại bến cảng, xe dự kiến về tàu muộn 15 phút...'
                    : 'Ví dụ: Cảnh báo bão gió giật mạnh, cảng đóng cửa không thể cập bến...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#102A43] placeholder-[#252B32]/40 focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
              />
            </div>
          )}

          {/* Modal Action Controls */}
          <div className="pt-3.5 border-t border-[#E5E0D7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-white text-[#252B32] border border-[#E5E0D7] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || allowedTransitions.length === 0}
              className="px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Đang cập nhật...' : 'Xác Nhận Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
