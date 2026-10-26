import React, { useState, useEffect } from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-[#E5E0D7] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-5 border-b border-[#E5E0D7] flex justify-between items-center bg-[#F7F4ED]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#102A43] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C5A572] animate-pulse"></span>
              Hàng Đợi Danh Sách Chờ (Waitlist Queue)
            </h2>
            <p className="text-xs text-[#687787] mt-0.5">{excursionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#687787] hover:text-[#102A43] p-2 rounded-lg hover:bg-[#E5E0D7]/50 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
              ✓ {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
              ⚠ {errorMsg}
            </div>
          )}

          {waitlist.length === 0 ? (
            <div className="text-center py-12 text-[#687787]">
              <p className="text-base font-semibold text-[#252B32]">Hàng đợi danh sách chờ đang trống</p>
              <p className="text-xs text-[#687787] mt-1">Khi tour đạt maxCapacity, các lượt đặt mới sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-[#F7F4ED] p-3 rounded-xl border border-[#E5E0D7]">
                <span className="text-xs text-[#252B32] font-semibold uppercase tracking-wider">
                  Tổng lượt chờ: <span className="text-[#102A43] font-bold">{waitlist.length} khách</span>
                </span>
                <button
                  onClick={handlePromoteNext}
                  disabled={isPromoting}
                  className="px-3.5 py-1.5 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold text-xs rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isPromoting ? 'Đang đôn vé...' : '⚡ Đôn Khách Kế Tiếp (FIFO)'}
                </button>
              </div>

              <div className="divide-y divide-[#E5E0D7] border border-[#E5E0D7] rounded-xl overflow-hidden bg-white">
                {waitlist.map((entry) => (
                  <div key={entry.bookingId} className="p-3.5 flex items-center justify-between hover:bg-[#F7F4ED] transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C5A572]/20 text-[#102A43] font-bold flex items-center justify-center text-xs border border-[#C5A572]/40">
                        #{entry.position}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#252B32] flex items-center gap-2">
                          {entry.passengerName}
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                            Cabin {entry.cabinNumber}
                          </span>
                        </div>
                        {entry.specialRequirements && (
                          <div className="text-xs text-[#397C80] mt-0.5 flex items-center gap-1 font-medium">
                            ♿ {entry.specialRequirements}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-[11px] rounded-full font-semibold uppercase tracking-wide bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/40">
                        Chờ Đôn Vé
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#E5E0D7] bg-[#F7F4ED] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] text-sm font-semibold rounded-xl transition cursor-pointer"
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

  useEffect(() => {
    setReason('');
    setErrorMsg(null);
  }, [booking?.id, isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-[#E5E0D7] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#E5E0D7] flex justify-between items-center bg-rose-50/50">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#102A43] flex items-center gap-2">
              <span className="text-rose-600">🩺</span> Miễn Phạt Y Tế Khẩn Cấp (Medical Waiver)
            </h2>
            <p className="text-xs text-rose-700/80 mt-0.5">Quyền điều phối viên: Hoàn tiền 100% vào Folio</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#687787] hover:text-[#102A43] p-2 rounded-lg hover:bg-[#E5E0D7]/50 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-medium">
              ⚠ {errorMsg}
            </div>
          )}

          <div className="p-3.5 bg-[#F7F4ED] rounded-xl border border-[#E5E0D7] space-y-1.5">
            <div className="text-sm font-semibold text-[#252B32]">{booking.passengerName}</div>
            <div className="text-xs text-[#687787] flex items-center gap-3">
              <span>Cabin: <strong className="text-[#252B32]">{booking.cabinNumber}</strong></span>
              <span>Mã vé: <strong className="text-[#252B32]">{booking.ticketCode}</strong></span>
              <span>Số tiền hoàn: <strong className="text-emerald-700">${booking.chargedAmount}</strong></span>
            </div>
          </div>

          <div>
            <label htmlFor="medical-reason-input" className="block text-xs font-semibold text-[#252B32] uppercase tracking-wider mb-1.5">
              Lý Do Giải Trình Y Tế / Khẩn Cấp (Bắt buộc)
            </label>
            <textarea
              id="medical-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ví dụ: Hành khách bị chấn thương/sốt cao, có xác nhận từ Trạm xá tàu (Medical Center)..."
              className="w-full bg-white border border-[#E5E0D7] rounded-xl p-3 text-sm text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43] transition"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <span>ℹ</span>
            <span>Hệ thống sẽ ghi log kiểm toán bất biến và tự động kích hoạt đôn người đầu tiên trong hàng đợi Waitlist nếu còn lượt chờ.</span>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Miễn Phạt 100%'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
