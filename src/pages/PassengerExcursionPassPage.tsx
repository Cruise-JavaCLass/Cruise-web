import React, { useState, useEffect, useId } from 'react';
import { Ticket, Bus, Calendar, Clock, MapPin, AlertCircle, X, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchMyExcursionBookings, cancelExcursionBooking } from '../services/excursionService';
import { resolvePassengerId } from '../services/passengerIdentity';
import type { PassengerExcursionBooking } from '../services/excursionService';

export const PassengerExcursionPassPage: React.FC = () => {
  const cancelReasonSelectId = useId();
  const [bookings, setBookings] = useState<PassengerExcursionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<PassengerExcursionBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('Thay đổi lịch trình cá nhân');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const activePassengerId = resolvePassengerId() ?? 1;
      const data = await fetchMyExcursionBookings(activePassengerId);
      setBookings(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách vé tour của bạn';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setCancellingId(cancelModalBooking.bookingId);
    setError(null);
    try {
      const res = await cancelExcursionBooking(
        cancelModalBooking.excursionId,
        cancelModalBooking.bookingId,
        cancelReason
      );

      const cur = res.currency || cancelModalBooking.currency || 'USD';
      setCancelSuccessMsg(
        `Hủy tour thành công! Số tiền hoàn: ${formatCurrency(res.refundAmount, cur)} (Phí phạt: ${formatCurrency(res.penaltyFee, cur)})`
      );
      setCancelModalBooking(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hủy tour thất bại';
      setError(msg);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-cyan-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span>Đang tải thông tin vé điện tử của bạn...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-[#171717] max-w-5xl mx-auto dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#171717] pb-5 dark:border-slate-700">
        <div>
          <span className="border border-[#171717] bg-[#D9FF43] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#171717]">
            PASSENGER PORTAL // BOARDING
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase text-[#171717] mt-2 flex items-center gap-2.5 dark:text-white">
            <Ticket className="w-6 h-6 text-[#3155E7] dark:text-[#D9FF43]" />
            Vé Tour Bờ & Thẻ Lên Xe (Excursion Boarding Pass)
          </h1>
          <p className="text-xs font-bold text-neutral-600 mt-1 dark:text-neutral-400">
            Xem mã vé điện tử, phân xe bus và chủ động quản lý hủy vé theo quy định cảng tàu.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2 border-2 border-[#171717] bg-white hover:bg-[#E7E4DC] text-black text-xs font-black uppercase shadow-[2px_2px_0px_#171717] flex items-center gap-2 transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm Mới
        </button>
      </div>

      {cancelSuccessMsg && (
        <div className="p-3 border-2 border-[#171717] bg-emerald-100 shadow-[3px_3px_0px_#171717] flex items-center gap-2 text-emerald-800 text-xs font-black">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 border-2 border-[#171717] bg-rose-100 shadow-[3px_3px_0px_#171717] flex items-center gap-2 text-rose-800 text-xs font-black">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Pass List */}
      {bookings.length === 0 ? (
        <div className="border-2 border-[#171717] bg-white p-12 text-center space-y-3 shadow-[6px_6px_0px_#171717] dark:bg-slate-800">
          <Ticket className="w-12 h-12 text-neutral-400 mx-auto" />
          <h3 className="text-lg font-black uppercase text-black dark:text-white">Quý khách chưa đặt tour bờ nào</h3>
          <p className="text-xs font-medium text-neutral-600 max-w-md mx-auto dark:text-neutral-400">
            Khám phá các hành trình tham quan đặc sắc tại danh mục Tour Trên Bờ để đăng ký cùng gia đình.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.bookingId}
              className="border-3 border-[#171717] bg-white overflow-hidden shadow-[6px_6px_0px_#171717] relative flex flex-col justify-between dark:bg-slate-800"
            >
              {/* Ticket Top Ribbon */}
              <div className="bg-[#171717] p-4 border-b-2 border-black flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] font-mono font-black text-[#D9FF43] uppercase tracking-widest block">
                    BOARDING PASS
                  </span>
                  <h3 className="text-base font-black uppercase text-white line-clamp-1">{booking.excursionTitle}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 block uppercase">TICKET CODE</span>
                  <span className="text-xs font-mono font-black text-[#D9FF43]">{booking.ticketCode}</span>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-5 space-y-4 text-xs font-bold">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b-2 border-dashed border-[#171717]/20">
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase block">Hành khách:</span>
                    <span className="text-black font-black dark:text-white">{booking.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase block">Số Cabin:</span>
                    <span className="text-[#3155E7] font-mono font-black dark:text-[#D9FF43]">{booking.cabinNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b-2 border-dashed border-[#171717]/20">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-neutral-500 text-[10px] uppercase block">Xe vận chuyển:</span>
                      <span className="text-black font-black dark:text-white">{booking.busNumber || 'Đang xếp xe'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-neutral-500 text-[10px] uppercase block">Cảng đến:</span>
                      <span className="text-black font-black dark:text-white">{booking.portName}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-2 border-[#171717] bg-[#F7F5F0] p-3 text-center shadow-[2px_2px_0px_#171717] dark:bg-slate-900">
                  <div>
                    <span className="text-[10px] font-black uppercase text-neutral-500 block">Tập trung</span>
                    <span className="text-black font-mono font-black flex items-center justify-center gap-1 mt-0.5 dark:text-white">
                      <Clock className="w-3 h-3 text-[#3155E7]" />
                      {booking.gatheringTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-neutral-500 block">Khởi hành</span>
                    <span className="text-black font-mono font-black mt-0.5 block dark:text-white">
                      {booking.departureTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-neutral-500 block">Về tàu</span>
                    <span className="text-rose-600 font-mono font-black mt-0.5 block dark:text-rose-400">
                      {booking.returnToShipTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase block">Cước phí vé:</span>
                    <span className="text-sm font-black text-black dark:text-white">
                      {booking.isIncluded ? 'MIỄN PHÍ' : formatCurrency(booking.chargedAmount ?? 0, booking.currency || 'USD')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500 text-[10px] uppercase block">Trạng thái:</span>
                    <span className="border border-black bg-[#E7E4DC] px-2 py-0.5 text-[10px] font-black uppercase text-black shadow-[1px_1px_0px_#171717]">
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Footer Action */}
              <div className="p-4 border-t-2 border-[#171717] bg-[#E7E4DC] flex items-center justify-between dark:bg-slate-900">
                <span className="text-[11px] font-black uppercase text-neutral-700 flex items-center gap-1.5 dark:text-neutral-300">
                  <Calendar className="w-3.5 h-3.5 text-black dark:text-white" />
                  Ngày đi: {booking.excursionDate}
                </span>

                <button
                  onClick={() => setCancelModalBooking(booking)}
                  className="px-3.5 py-1.5 border-2 border-[#171717] bg-[#DC2626] text-white text-xs font-black uppercase shadow-[2px_2px_0px_#171717] hover:bg-rose-700 transition-all active:translate-x-[1px] active:translate-y-[1px]"
                >
                  Hủy Vé Tour
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <div className="border-4 border-[#171717] bg-[#F7F5F0] w-full max-w-md p-6 shadow-[8px_8px_0px_#171717] relative text-[#171717] dark:bg-slate-900 dark:text-white">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="absolute top-4 right-4 border border-black bg-white p-1 text-black hover:bg-neutral-200 transition-colors shadow-[1px_1px_0px_#171717] dark:bg-slate-800 dark:text-white"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 border-2 border-[#171717] bg-rose-200 flex items-center justify-center text-rose-700 shadow-[2px_2px_0px_#171717]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-black dark:text-white">Xác Nhận Hủy Vé Tour Bờ</h3>
                <p className="text-xs font-mono font-bold text-neutral-500">Vé: {cancelModalBooking.ticketCode}</p>
              </div>
            </div>

            <p className="text-xs font-bold leading-relaxed mb-4 border-2 border-[#171717] bg-white p-3 shadow-[2px_2px_0px_#171717] dark:bg-slate-800">
              Hệ thống sẽ tính toán hoàn tiền tự động theo thời điểm hủy so với giờ tàu cập bến (Port Cut-off Policy):
              <br />• <strong>Trước 24h:</strong> Hoàn 100% tiền vào Cabin Folio.
              <br />• <strong>Từ 12-24h:</strong> Phạt 50% chi phí.
              <br />• <strong>Dưới 12h:</strong> Phạt 100% (Trừ trường hợp thời tiết bão hủy cảng).
            </p>

            <div className="mb-4">
              <label htmlFor={cancelReasonSelectId} className="block text-xs font-black uppercase mb-1">Lý do hủy vé:</label>
              <select
                id={cancelReasonSelectId}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border-2 border-[#171717] bg-white text-xs font-bold text-black shadow-[2px_2px_0px_#171717] focus:outline-none dark:bg-slate-800 dark:text-white"
              >
                <option value="Thay đổi lịch trình cá nhân">Thay đổi lịch trình cá nhân</option>
                <option value="Sức khỏe không đảm bảo">Sức khỏe không đảm bảo</option>
                <option value="Thời tiết xấu hoặc cảng bị hủy">Thời tiết xấu hoặc cảng bị hủy (Weather Force Majeure)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="flex-1 py-2 border-2 border-[#171717] bg-white text-black text-xs font-black uppercase shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
              >
                Giữ Lại Vé
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="flex-1 py-2 border-2 border-[#171717] bg-[#DC2626] text-white text-xs font-black uppercase shadow-[2px_2px_0px_#171717] hover:bg-rose-700 transition-all active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
              >
                {cancellingId !== null ? 'Đang Hủy...' : 'Xác Nhận Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
