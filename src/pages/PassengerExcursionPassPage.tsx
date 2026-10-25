import React, { useState, useEffect, useId } from 'react';
import { Ticket, Bus, Calendar, Clock, MapPin, AlertCircle, X, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchMyExcursionBookings, cancelExcursionBooking } from '../services/excursionService';
import { resolvePassengerId } from '../services/passengerIdentity';
import type { PassengerExcursionBooking } from '../services/excursionService';
import { MaritimeLottie } from '../components/common/MaritimeLottie';

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
      <div className="flex items-center justify-center p-12 text-[#42E8F5] gap-3 font-mono text-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-[#42E8F5]" />
        <span>Đang tải thông tin vé điện tử của bạn...</span>
      </div>
    );
  }

  return (
    <div
      data-theme="passenger-retro"
      className="p-4 sm:p-6 space-y-6 text-[#F4F4F0] max-w-5xl mx-auto font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#42E8F5]/20 pb-5">
        <div>
          <span className="rounded bg-[#4169FF]/20 border border-[#42E8F5]/40 px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider text-[#42E8F5]">
            PASSENGER PORTAL // BOARDING
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-black uppercase text-[#F4F4F0] mt-2 flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-[#42E8F5]" />
            Vé Tour Bờ & Thẻ Lên Xe (Excursion Boarding Pass)
          </h1>
          <p className="text-xs font-mono text-[#A7B4C9] mt-1">
            Xem mã vé điện tử, phân xe bus và chủ động quản lý hủy vé theo quy định cảng tàu.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2 rounded-lg border border-[#42E8F5]/30 bg-[#151F33] hover:bg-[#10182A] text-[#42E8F5] text-xs font-mono font-bold uppercase flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm Mới
        </button>
      </div>

      {cancelSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-2.5 text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center gap-2.5 text-rose-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Pass List */}
      {bookings.length === 0 ? (
        <div className="bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <MaritimeLottie variant="ship" className="w-20 h-20 mx-auto" title="Du thuyền" />
          <h3 className="text-lg font-display font-black uppercase text-[#F4F4F0]">Quý khách chưa đặt tour bờ nào</h3>
          <p className="text-xs font-mono text-[#A7B4C9] max-w-md mx-auto">
            Khám phá các hành trình tham quan đặc sắc tại danh mục Tour Trên Bờ để đăng ký cùng gia đình.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.bookingId}
              className="bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl overflow-hidden shadow-xl relative flex flex-col justify-between"
            >
              {/* Ticket Top Ribbon */}
              <div className="bg-[#10182A] p-4 border-b border-[#42E8F5]/20 flex items-center justify-between text-white">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#42E8F5] uppercase tracking-widest block">
                    BOARDING PASS
                  </span>
                  <h3 className="text-base font-bold text-[#F4F4F0] line-clamp-1">{booking.excursionTitle}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#A7B4C9] block uppercase">TICKET CODE</span>
                  <span className="text-xs font-mono font-bold text-[#FFBD59]">{booking.ticketCode}</span>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#42E8F5]/15 font-mono">
                  <div>
                    <span className="text-[#A7B4C9] text-[10px] uppercase block">Hành khách:</span>
                    <span className="text-[#F4F4F0] font-bold">{booking.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-[#A7B4C9] text-[10px] uppercase block">Số Cabin:</span>
                    <span className="text-[#42E8F5] font-mono font-bold">{booking.cabinNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#42E8F5]/15 font-mono">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-[#FFBD59] shrink-0" />
                    <div>
                      <span className="text-[#A7B4C9] text-[10px] uppercase block">Xe vận chuyển:</span>
                      <span className="text-[#F4F4F0] font-bold">{booking.busNumber || 'Đang xếp xe'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#42E8F5] shrink-0" />
                    <div>
                      <span className="text-[#A7B4C9] text-[10px] uppercase block">Cảng đến:</span>
                      <span className="text-[#F4F4F0] font-bold">{booking.portName}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#10182A] border border-[#42E8F5]/20 rounded-xl p-3 text-center">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#A7B4C9] block">Tập trung</span>
                    <span className="text-[#F4F4F0] font-mono font-bold flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#42E8F5]" />
                      {booking.gatheringTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#A7B4C9] block">Khởi hành</span>
                    <span className="text-[#F4F4F0] font-mono font-bold mt-0.5 block">
                      {booking.departureTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#A7B4C9] block">Về tàu</span>
                    <span className="text-rose-400 font-mono font-bold mt-0.5 block">
                      {booking.returnToShipTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[#A7B4C9] text-[10px] font-mono uppercase block">Cước phí vé:</span>
                    <span className="text-sm font-mono font-bold text-[#F4F4F0]">
                      {booking.isIncluded ? 'MIỄN PHÍ' : formatCurrency(booking.chargedAmount ?? 0, booking.currency || 'USD')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#A7B4C9] text-[10px] font-mono uppercase block">Trạng thái:</span>
                    <span className="rounded bg-[#10182A] border border-[#42E8F5]/30 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-[#42E8F5]">
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Footer Action */}
              <div className="p-4 border-t border-[#42E8F5]/20 bg-[#10182A] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#A7B4C9] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#42E8F5]" />
                  Ngày đi: {booking.excursionDate}
                </span>

                <button
                  onClick={() => setCancelModalBooking(booking)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40 text-xs font-mono font-bold uppercase transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in" role="dialog" aria-modal="true">
          <div className="bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-[#F4F4F0]">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="absolute top-4 right-4 rounded-lg bg-[#10182A] p-1.5 text-[#A7B4C9] hover:text-white transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-display font-black uppercase text-[#F4F4F0]">Xác Nhận Hủy Vé Tour Bờ</h3>
                <p className="text-xs font-mono text-[#A7B4C9]">Vé: {cancelModalBooking.ticketCode}</p>
              </div>
            </div>

            <p className="text-xs font-mono leading-relaxed mb-4 bg-[#10182A] border border-[#42E8F5]/20 rounded-xl p-3 text-[#A7B4C9]">
              Hệ thống sẽ tính toán hoàn tiền tự động theo thời điểm hủy so với giờ tàu cập bến (Port Cut-off Policy):
              <br />• <strong className="text-[#F4F4F0]">Trước 24h:</strong> Hoàn 100% tiền vào Cabin Folio.
              <br />• <strong className="text-[#FFBD59]">Từ 12-24h:</strong> Phạt 50% chi phí.
              <br />• <strong className="text-rose-400">Dưới 12h:</strong> Phạt 100% (Trừ trường hợp thời tiết bão hủy cảng).
            </p>

            <div className="mb-4">
              <label htmlFor={cancelReasonSelectId} className="block text-xs font-mono uppercase text-[#A7B4C9] mb-1.5">Lý do hủy vé:</label>
              <select
                id={cancelReasonSelectId}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#42E8F5]/30 bg-[#10182A] text-xs font-mono text-[#F4F4F0] focus:outline-none focus:border-[#42E8F5] cursor-pointer"
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
                className="flex-1 py-2.5 rounded-lg bg-[#10182A] hover:bg-[#0c1221] text-[#A7B4C9] border border-[#42E8F5]/20 text-xs font-mono font-bold uppercase transition-all cursor-pointer"
              >
                Giữ Lại Vé
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold uppercase transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50 cursor-pointer"
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

export default PassengerExcursionPassPage;
