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
      <div className="flex items-center justify-center p-12 text-[#102A43] gap-3 text-xs font-semibold">
        <RefreshCw className="w-6 h-6 animate-spin text-[#397C80]" />
        <span>Đang tải thông tin vé điện tử của bạn...</span>
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6 space-y-6 text-[#252B32] max-w-5xl mx-auto font-sans"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D7] pb-5">
        <div>
          <span className="rounded-full bg-[#F7F4ED] border border-[#E5E0D7] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[#102A43]">
            PASSENGER PORTAL // BOARDING
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase text-[#102A43] mt-2 flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-[#397C80]" />
            Vé Tour Bờ & Thẻ Lên Xe (Excursion Boarding Pass)
          </h1>
          <p className="text-xs text-[#252B32]/70 mt-1">
            Xem mã vé điện tử, phân xe bus và chủ động quản lý hủy vé theo quy định cảng tàu.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2 rounded-xl border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] text-[#102A43] text-xs font-semibold uppercase flex items-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#397C80]" />
          Làm Mới
        </button>
      </div>

      {cancelSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs font-medium shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{cancelSuccessMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs font-medium shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Pass List */}
      {bookings.length === 0 ? (
        <div className="bg-white border border-[#E5E0D7] rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <MaritimeLottie variant="ship" className="w-20 h-20 mx-auto" title="Du thuyền" />
          <h3 className="text-lg font-display font-bold uppercase text-[#102A43]">Quý khách chưa đặt tour bờ nào</h3>
          <p className="text-xs text-[#252B32]/70 max-w-md mx-auto">
            Khám phá các hành trình tham quan đặc sắc tại danh mục Tour Trên Bờ để đăng ký cùng gia đình.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div
              key={booking.bookingId}
              className="bg-white border border-[#E5E0D7] rounded-3xl overflow-hidden shadow-sm relative flex flex-col justify-between"
            >
              {/* Ticket Top Ribbon */}
              <div className="bg-[#F7F4ED] p-4 border-b border-[#E5E0D7] flex items-center justify-between text-[#102A43]">
                <div>
                  <span className="text-[10px] font-semibold text-[#397C80] uppercase tracking-widest block">
                    BOARDING PASS
                  </span>
                  <h3 className="text-base font-bold text-[#102A43] line-clamp-1">{booking.excursionTitle}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#252B32]/60 block uppercase font-medium">TICKET CODE</span>
                  <span className="text-xs font-bold text-[#102A43] font-mono">{booking.ticketCode}</span>
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#E5E0D7]">
                  <div>
                    <span className="text-[#252B32]/60 text-[10px] uppercase block font-medium">Hành khách:</span>
                    <span className="text-[#102A43] font-bold">{booking.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-[#252B32]/60 text-[10px] uppercase block font-medium">Số Cabin:</span>
                    <span className="text-[#397C80] font-bold">{booking.cabinNumber}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#E5E0D7]">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-[#C5A572] shrink-0" />
                    <div>
                      <span className="text-[#252B32]/60 text-[10px] uppercase block font-medium">Xe vận chuyển:</span>
                      <span className="text-[#102A43] font-bold">{booking.busNumber || 'Đang xếp xe'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#397C80] shrink-0" />
                    <div>
                      <span className="text-[#252B32]/60 text-[10px] uppercase block font-medium">Cảng đến:</span>
                      <span className="text-[#102A43] font-bold">{booking.portName}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl p-3 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-[#252B32]/60 block font-medium">Tập trung</span>
                    <span className="text-[#102A43] font-bold flex items-center justify-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#397C80]" />
                      {booking.gatheringTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#252B32]/60 block font-medium">Khởi hành</span>
                    <span className="text-[#102A43] font-bold mt-0.5 block">
                      {booking.departureTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#252B32]/60 block font-medium">Về tàu</span>
                    <span className="text-rose-700 font-bold mt-0.5 block">
                      {booking.returnToShipTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[#252B32]/60 text-[10px] uppercase block font-medium">Cước phí vé:</span>
                    <span className="text-sm font-bold text-[#102A43]">
                      {booking.isIncluded ? 'MIỄN PHÍ' : formatCurrency(booking.chargedAmount ?? 0, booking.currency || 'USD')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#252B32]/60 text-[10px] uppercase block font-medium">Trạng thái:</span>
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#397C80]">
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Footer Action */}
              <div className="p-4 border-t border-[#E5E0D7] bg-[#F7F4ED] flex items-center justify-between">
                <span className="text-[11px] text-[#252B32]/70 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#397C80]" />
                  Ngày đi: {booking.excursionDate}
                </span>

                <button
                  onClick={() => setCancelModalBooking(booking)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold uppercase transition-all cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in" role="dialog" aria-modal="true">
          <div className="bg-white border border-[#E5E0D7] rounded-3xl w-full max-w-md p-6 shadow-xl relative text-[#252B32]">
            <button
              onClick={() => setCancelModalBooking(null)}
              className="absolute top-4 right-4 rounded-full bg-[#F7F4ED] hover:bg-[#E5E0D7] p-2 text-[#252B32]/70 hover:text-[#102A43] transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold uppercase text-[#102A43]">Xác Nhận Hủy Vé Tour Bờ</h3>
                <p className="text-xs text-[#252B32]/70 font-medium">Vé: {cancelModalBooking.ticketCode}</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed mb-4 bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl p-3.5 text-[#252B32]/80">
              Hệ thống sẽ tính toán hoàn tiền tự động theo thời điểm hủy so với giờ tàu cập bến (Port Cut-off Policy):
              <br />• <strong className="text-[#102A43]">Trước 24h:</strong> Hoàn 100% tiền vào Cabin Folio.
              <br />• <strong className="text-amber-800">Từ 12-24h:</strong> Phạt 50% chi phí.
              <br />• <strong className="text-rose-700">Dưới 12h:</strong> Phạt 100% (Trừ trường hợp thời tiết bão hủy cảng).
            </p>

            <div className="mb-4">
              <label htmlFor={cancelReasonSelectId} className="block text-xs uppercase text-[#252B32]/70 font-semibold mb-1.5">Lý do hủy vé:</label>
              <select
                id={cancelReasonSelectId}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E0D7] bg-white text-xs text-[#252B32] focus:outline-none focus:border-[#397C80] cursor-pointer"
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
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] text-xs font-semibold uppercase transition-all shadow-xs cursor-pointer"
              >
                Giữ Lại Vé
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancellingId !== null}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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
