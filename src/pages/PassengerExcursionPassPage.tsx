import React, { useState, useEffect } from 'react';
import { Ticket, Bus, Calendar, Clock, MapPin, AlertCircle, X, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchMyExcursionBookings, cancelExcursionBooking } from '../services/excursionService';
import type { PassengerExcursionBooking } from '../services/excursionService';

export const PassengerExcursionPassPage: React.FC = () => {
  const [bookings, setBookings] = useState<PassengerExcursionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<PassengerExcursionBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('Thay đổi lịch trình cá nhân');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyExcursionBookings(1);
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

      setCancelSuccessMsg(
        `Hủy tour thành công! Số tiền hoàn: $${res.refundAmount.toFixed(2)} USD (Phí phạt: $${res.penaltyFee.toFixed(2)} USD)`
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
    <div className="p-6 space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            Passenger Portal
          </span>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-cyan-400" />
            Vé Tour Bờ & Thẻ Lên Xe (Excursion Boarding Pass)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Xem mã vé điện tử, phân xe bus và chủ động quản lý hủy vé theo quy định cảng tàu.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-white/5 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm Mới
        </button>
      </div>

      {cancelSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Pass List */}
      {bookings.length === 0 ? (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-12 text-center space-y-3">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">Quý khách chưa đặt tour bờ nào</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Khám phá các hành trình tham quan đặc sắc tại danh mục Tour Trên Bờ để đăng ký cùng gia đình.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.bookingId}
              className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col justify-between"
            >
              {/* Ticket Top Ribbon */}
              <div className="bg-gradient-to-r from-cyan-950 to-blue-950 p-4 border-b border-cyan-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                    BOARDING PASS
                  </span>
                  <h3 className="text-base font-bold text-white line-clamp-1">{booking.excursionTitle}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">TICKET CODE</span>
                  <span className="text-xs font-mono font-bold text-cyan-300">{booking.ticketCode}</span>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Hành khách:</span>
                    <span className="text-white font-semibold">{booking.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Số Cabin:</span>
                    <span className="text-cyan-400 font-mono font-semibold">{booking.cabinNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[11px] block">Xe vận chuyển:</span>
                      <span className="text-amber-300 font-semibold">{booking.busNumber || 'Đang xếp xe'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cảng đến:</span>
                      <span className="text-white font-semibold">{booking.portName}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-3 rounded-xl border border-white/5 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tập trung</span>
                    <span className="text-white font-mono font-bold flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {booking.gatheringTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Khởi hành</span>
                    <span className="text-white font-mono font-bold mt-0.5 block">
                      {booking.departureTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Về tàu</span>
                    <span className="text-emerald-400 font-mono font-bold mt-0.5 block">
                      {booking.returnToShipTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Cước phí vé:</span>
                    <span className="text-sm font-bold text-white">
                      {booking.isIncluded ? 'MIỄN PHÍ' : `$${booking.chargedAmount?.toFixed(2)} USD`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Trạng thái:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Footer Action */}
              <div className="p-4 bg-slate-900/80 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Ngày đi: {booking.excursionDate}
                </span>

                <button
                  onClick={() => setCancelModalBooking(booking)}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-[#0b0f19] border border-rose-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Xác Nhận Hủy Vé Tour Bờ</h3>
                <p className="text-xs text-slate-400">Vé: {cancelModalBooking.ticketCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 bg-slate-900/60 p-3 rounded-xl border border-white/5">
              Hệ thống sẽ tính toán hoàn tiền tự động theo thời điểm hủy so với giờ tàu cập bến (Port Cut-off Policy):
              <br />• <strong>Trước 24h:</strong> Hoàn 100% tiền vào Cabin Folio.
              <br />• <strong>Từ 12-24h:</strong> Phạt 50% chi phí.
              <br />• <strong>Dưới 12h:</strong> Phạt 100% (Trừ trường hợp thời tiết bão hủy cảng).
            </p>

            <div className="mb-4">
              <label htmlFor="cancel-reason-select" className="block text-xs font-medium text-slate-300 mb-1">Lý do hủy vé:</label>
              <select
                id="cancel-reason-select"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
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
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Giữ Lại Vé
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-medium shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
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
