import React, { useState } from 'react';
import {
  promoteWaitlistPassenger,
  cancelBookingWithMedicalWaiver,
  type ExcursionWaitlistEntry,
  type ExcursionPassengerRosterItem,
} from '../../services/excursionService';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  excursionId: number;
  excursionTitle: string;
  waitlist: ExcursionWaitlistEntry[];
  onPromoted: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  excursionId,
  excursionTitle,
  waitlist,
  onPromoted,
}) => {
  const [isPromoting, setIsPromoting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePromoteNext = async () => {
    setIsPromoting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const res = await promoteWaitlistPassenger(excursionId);
      setSuccessMsg(res.message || `Đã đôn hành khách ${res.passengerName} lên vé chính thức!`);
      onPromoted();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi khi đôn vé danh sách chờ');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              Hàng Đợi Danh Sách Chờ (Waitlist Queue)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{excursionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
              ⚠ {errorMsg}
            </div>
          )}

          {waitlist.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-base font-medium">Hàng đợi danh sách chờ đang trống</p>
              <p className="text-xs text-slate-500 mt-1">Khi tour đạt maxCapacity, các lượt đặt mới sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                  Tổng lượt chờ: <span className="text-amber-400">{waitlist.length} khách</span>
                </span>
                <button
                  onClick={handlePromoteNext}
                  disabled={isPromoting}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPromoting ? 'Đang đôn vé...' : '⚡ Đôn Khách Kế Tiếp (FIFO)'}
                </button>
              </div>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                {waitlist.map((entry) => (
                  <div key={entry.bookingId} className="p-3.5 flex items-center justify-between hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs border border-amber-500/40">
                        #{entry.position}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-2">
                          {entry.passengerName}
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-cyan-300 border border-slate-700">
                            Cabin {entry.cabinNumber}
                          </span>
                        </div>
                        {entry.specialRequirements && (
                          <div className="text-xs text-amber-300/80 mt-0.5 flex items-center gap-1">
                            ♿ {entry.specialRequirements}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-[11px] rounded-full font-semibold uppercase tracking-wide bg-amber-950/80 text-amber-300 border border-amber-700/50">
                        Chờ Đôn Vé
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

interface MedicalWaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ExcursionPassengerRosterItem | null;
  onCancelled: () => void;
}

export const MedicalWaiverModal: React.FC<MedicalWaiverModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCancelled,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Vui lòng nhập lý do giải trình y tế/khẩn cấp bắt buộc');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await cancelBookingWithMedicalWaiver(booking.excursionId, booking.id, {
        reason: reason.trim(),
        approvedByStaffId: 'SHORE_EXCURSION_MANAGER',
      });
      onCancelled();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi khi thực hiện hủy miễn phạt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-rose-950/20">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-rose-400">🩺</span> Miễn Phạt Y Tế Khẩn Cấp (Medical Waiver)
            </h2>
            <p className="text-xs text-rose-300/70 mt-0.5">Quyền điều phối viên: Hoàn tiền 100% vào Folio</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-sm">
              ⚠ {errorMsg}
            </div>
          )}

          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-1.5">
            <div className="text-sm font-semibold text-white">{booking.passengerName}</div>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span>Cabin: <strong className="text-slate-200">{booking.cabinNumber}</strong></span>
              <span>Mã vé: <strong className="text-slate-200">{booking.ticketCode}</strong></span>
              <span>Số tiền hoàn: <strong className="text-emerald-400">${booking.chargedAmount}</strong></span>
            </div>
          </div>

          <div>
            <label htmlFor="medical-reason-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Lý Do Giải Trình Y Tế / Khẩn Cấp (Bắt buộc)
            </label>
            <textarea
              id="medical-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Hành khách bị chấn thương/sốt cao, có xác nhận từ Trạm xá tàu (Medical Center)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <span>ℹ</span>
            <span>Hệ thống sẽ ghi log kiểm toán bất biến và tự động kích hoạt đôn người đầu tiên trong hàng đợi Waitlist nếu còn lượt chờ.</span>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-semibold rounded-xl shadow transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Miễn Phạt 100%'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
