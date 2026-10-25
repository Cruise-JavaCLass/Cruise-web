import React, { useState, useEffect } from 'react';
import {
  Ship,
  CreditCard,
  QrCode,
  Radio,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Ticket,
  UserCheck,
  Tag,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getPassengerBookingSummary,
  type PassengerBookingSummary,
} from '../services/passengerService';
import {
  passengerCatalogService,
  type PassengerCatalogItem,
} from '../services/passengerCatalogService';
import { getTourNotifications, type TourNotification } from '../services/dailyItineraryService';
import {
  activityRegistrationService,
  type PassengerRegistrationItem,
} from '../services/activityRegistrationService';
import { resolvePassengerId } from '../services/passengerIdentity';
import { UpcomingActivitiesAndNotifications } from '../components/passenger/UpcomingActivitiesAndNotifications';
import { CancelActivityModal } from '../components/activities/CancelActivityModal';
import { ActivityPassModal } from '../components/activities/ActivityPassModal';

export const PassengerHomePage: React.FC = () => {
  const [bookingSummary, setBookingSummary] = useState<PassengerBookingSummary | null>(null);
  const [activities, setActivities] = useState<PassengerCatalogItem[]>([]);
  const [registeredActivities, setRegisteredActivities] = useState<PassengerRegistrationItem[]>([]);
  const [cancellingReg, setCancellingReg] = useState<PassengerRegistrationItem | null>(null);
  const [passModalActivity, setPassModalActivity] = useState<PassengerRegistrationItem | null>(
    null
  );
  const [notifications, setNotifications] = useState<TourNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');
    try {
      const activePassengerId = resolvePassengerId(1);
      if (!activePassengerId) {
        throw new Error('Không tìm thấy danh tính hành khách hợp lệ. Vui lòng đăng nhập lại.');
      }

      const summary = await getPassengerBookingSummary(activePassengerId);
      if (!summary) {
        throw new Error('Không tìm thấy thông tin đặt chỗ của hành khách.');
      }

      const tourId = summary.tourId || 1;
      const [catalogRes, notifs, myRegs] = await Promise.all([
        passengerCatalogService.getCatalogItems(tourId, { size: 6 }),
        getTourNotifications(tourId),
        activityRegistrationService.getMyRegistrations(tourId, activePassengerId).catch(() => []),
      ]);

      setBookingSummary(summary);
      setActivities(catalogRes.content || []);
      setNotifications(notifs || []);
      setRegisteredActivities(myRegs || []);
    } catch (err: unknown) {
      console.error('Lỗi khi tải trang chủ hành khách:', err);
      setIsError(true);
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & Navigation Header — Luxury Broadsheet Banner */}
      <div className="neo-card bg-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[6px_6px_0px_#171717]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#3155E7] text-white">GUEST CONCIERGE</span>
            <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• ONBOARD PORTAL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#171717] uppercase tracking-tight flex items-center gap-2">
            Chào mừng lên tàu,{' '}
            <span className="text-[#3155E7]">
              {bookingSummary?.fullName || 'Quý Khách'}
            </span>
          </h1>
          <p className="text-xs font-mono text-[#171717]/70 mt-1">
            Cập nhật thẻ lên tàu RFID, lịch trình cá nhân, tour bờ và các thông báo hải trình thời
            gian thực.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="w-10 h-10 bg-white hover:bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#3155E7]' : ''}`} />
          </button>
          <Link
            to="/catalog"
            className="neo-btn neo-btn-acid py-2 px-4 text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Duyệt Hoạt Động & Tour Bờ
          </Link>
        </div>
      </div>

      {/* Error State Banner */}
      {isError && (
        <div
          data-testid="passenger-error-banner"
          className="p-4 bg-[#DC2626] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] text-white text-xs font-mono font-bold flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[#D9FF43] shrink-0" />
            <div>
              <p className="font-bold text-white uppercase">Đã xảy ra sự cố tải dữ liệu!</p>
              <p className="text-white/90 mt-0.5 font-normal">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => void loadData()}
            className="px-3 py-1.5 bg-white text-[#171717] border border-[#171717] text-xs font-bold uppercase active:translate-x-0.5 active:translate-y-0.5"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !isError && (
        <div data-testid="passenger-home-loading" className="space-y-6 animate-pulse">
          <div className="h-44 neo-card bg-[#E7E4DC] border-2 border-[#171717]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 neo-card bg-[#E7E4DC] border-2 border-[#171717]" />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && !isError && bookingSummary && (
        <div className="space-y-8">
          {/* Hero Digital Boarding Pass & Cabin Card — Architectural Neo-Card */}
          <div className="neo-card bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#171717] relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="neo-badge bg-[#171717] text-white">
                    MÃ ĐẶT CHỖ: {bookingSummary.tourCode}
                  </span>
                  <span className="neo-badge bg-[#D9FF43] text-[#171717] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {bookingSummary.checkInStatus === 'BOARDED'
                      ? 'Đã Check-in Lên Tàu'
                      : 'Chưa Check-in'}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-[#171717] uppercase tracking-tight">
                    {bookingSummary.tourName}
                  </h2>
                  <p className="text-xs font-mono text-[#171717]/70 mt-1 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-[#3155E7]" /> Du Thuyền Grand Pearl Voyager •
                    Hải Trình 4 Ngày 3 Đêm
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                    <span className="text-[10px] text-[#171717]/70 uppercase font-mono font-bold">Số Cabin</span>
                    <p className="text-sm font-display font-black text-[#171717] mt-0.5">
                      {bookingSummary.cabinNumber}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-[#3155E7]">
                      {bookingSummary.cabinCategory}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                    <span className="text-[10px] text-[#171717]/70 uppercase font-mono font-bold">
                      Thẻ RFID & Zone
                    </span>
                    <p className="text-sm font-display font-black text-[#171717] mt-0.5">{bookingSummary.rfidTag}</p>
                    <span className="text-[10px] font-mono font-semibold text-[#171717]/60">
                      {bookingSummary.bleZone || 'Zone A - Sky Lounge'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#171717]/70 uppercase font-mono font-bold">Gói Tour</span>
                    <p className="text-sm font-display font-black text-[#171717] mt-0.5 truncate">
                      {bookingSummary.tourPackage}
                    </p>
                    <span className="text-[10px] font-mono font-bold text-[#3155E7]">Trọn gói cao cấp</span>
                  </div>
                </div>
              </div>

              {/* Digital Boarding Pass QR Box */}
              <div className="shrink-0 bg-[#F7F5F0] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] p-5 flex flex-col items-center justify-center text-center space-y-3 min-w-[200px]">
                <div className="p-3 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <QrCode className="w-24 h-24 text-[#171717]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#3155E7] font-bold tracking-widest uppercase">
                    PASSENGER BOARDING PASS
                  </span>
                  <p className="text-xs font-mono text-[#171717] mt-0.5 font-bold">
                    {bookingSummary.qrCode || 'QR-CRUISE-99412'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#171717]/70 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[#3155E7] animate-pulse" />
                  <span>Sẵn sàng quét tại cổng cảng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar — Neo-Brutalist 4-Up Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="neo-card bg-white p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
                <Ticket className="w-5 h-5 text-[#3155E7]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase">Tour bờ đã đăng ký</span>
                <p className="text-xl font-display font-black text-[#171717]">
                  {bookingSummary.totalRegisteredExcursions} tour
                </p>
              </div>
            </div>

            <div className="neo-card bg-white p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#D9FF43] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase">Chi phí tour bờ</span>
                <p className="text-xl font-display font-black text-[#171717]">
                  ${bookingSummary.totalExcursionSpent} USD
                </p>
              </div>
            </div>

            <div className="neo-card bg-white p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase">Trạng thái đăng ký</span>
                <p className="text-sm font-mono font-black text-[#3155E7] uppercase">Đã xác nhận</p>
              </div>
            </div>

            <div className="neo-card bg-white p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#171717] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#D9FF43]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase">Giờ lên tàu</span>
                <p className="text-sm font-mono font-black text-[#171717]">
                  {bookingSummary.boardedAt
                    ? new Date(bookingSummary.boardedAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '08:30'}
                </p>
              </div>
            </div>
          </div>

          {/* Registered Excursions Table / Cards */}
          <div className="neo-card bg-white p-6 shadow-[6px_6px_0px_#171717] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#171717] gap-2">
              <div>
                <h3 className="text-base font-display font-black text-[#171717] uppercase tracking-tight flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#3155E7]" />
                  Danh Sách Vé & Tour Bờ Đã Đặt (Excursions)
                </h3>
                <p className="text-xs font-mono text-[#171717]/70">
                  Theo dõi giờ tập trung, số xe đưa đón và số vé điện tử
                </p>
              </div>
              <Link
                to="/catalog?itemType=SHORE_EXCURSION"
                className="text-xs font-mono font-bold text-[#3155E7] hover:underline flex items-center gap-1 uppercase"
              >
                Đặt thêm tour bờ <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {bookingSummary.registeredExcursions.length === 0 ? (
              <div className="py-8 text-center text-[#171717]/70 font-mono text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40 text-[#171717]" />
                <span>Quý khách chưa đăng ký tour tham quan trên bờ nào.</span>
                <Link
                  to="/catalog?itemType=SHORE_EXCURSION"
                  className="mt-2 text-[#3155E7] hover:underline font-bold uppercase"
                >
                  Khám phá các tour trên bờ ngay &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingSummary.registeredExcursions.map((exc) => (
                  <div
                    key={exc.excursionId}
                    className="p-4 bg-[#F7F5F0] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#3155E7] uppercase">
                          Vé: {exc.ticketCode}
                        </span>
                        <h4 className="text-sm font-display font-black text-[#171717] uppercase mt-0.5">
                          {exc.excursionTitle}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-[#171717] bg-[#D9FF43] text-[#171717]">
                        {exc.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#171717] bg-white p-3 border-2 border-[#171717]">
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Phân đoàn:</span>
                        <span className="font-bold">{exc.groupName}</span>
                      </div>
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Xe đưa đón:</span>
                        <span className="font-bold text-[#3155E7]">{exc.busNumber}</span>
                      </div>
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Giờ tập trung:</span>
                        <span className="font-mono text-[#171717] font-bold">
                          {exc.gatheringTime || '08:00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Giờ về tàu:</span>
                        <span className="font-mono text-[#3155E7] font-bold">
                          {exc.returnToShipTime || '16:00'}
                        </span>
                      </div>
                    </div>

                    {exc.portName && (
                      <div className="text-[11px] font-mono text-[#171717]/70 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#3155E7]" />
                        <span>Điểm cập cảng: {exc.portName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Onboard Activities (KAN-217) */}
          <div className="neo-card bg-white p-6 shadow-[6px_6px_0px_#171717] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b-2 border-[#171717] gap-2">
              <div>
                <h3 className="text-base font-display font-black text-[#171717] uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#3155E7]" />
                  Hoạt Động Trên Du Thuyền Đã Đăng Ký (Onboard Activities)
                </h3>
                <p className="text-xs font-mono text-[#171717]/70">
                  Theo dõi trạng thái xác nhận, thứ tự hàng đợi Waitlist và thẻ tham gia QR Pass
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/my-schedule"
                  className="neo-btn neo-btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 font-mono font-bold"
                >
                  <Clock className="w-3.5 h-3.5 text-[#3155E7]" /> Lịch Trình My Day
                </Link>
                <Link
                  to="/catalog?itemType=ONBOARD_ACTIVITY"
                  className="text-xs font-mono font-bold text-[#3155E7] hover:underline flex items-center gap-1 uppercase"
                >
                  Khám phá thêm hoạt động <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {registeredActivities.length === 0 ? (
              <div className="py-8 text-center text-[#171717]/70 font-mono text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40 text-[#171717]" />
                <span>Quý khách chưa đăng ký hoạt động giải trí nào trên du thuyền.</span>
                <Link
                  to="/catalog?itemType=ONBOARD_ACTIVITY"
                  className="mt-2 text-[#3155E7] hover:underline font-bold uppercase"
                >
                  Xem danh mục hoạt động &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredActivities.map((reg) => (
                  <div
                    key={reg.registrationId}
                    className="p-4 bg-[#F7F5F0] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#171717]/60 uppercase">
                          {reg.category} • Mã: #{reg.registrationId}
                        </span>
                        <h4 className="text-sm font-display font-black text-[#171717] uppercase mt-0.5">{reg.activityTitle}</h4>
                      </div>
                      {reg.status === 'CONFIRMED' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-[#171717] bg-[#D9FF43] text-[#171717] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
                        </span>
                      )}
                      {reg.status === 'WAITLISTED' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-[#171717] bg-amber-300 text-[#171717] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Hàng đợi #{reg.waitlistPosition || 1}
                        </span>
                      )}
                      {reg.status === 'CANCELLED' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-[#171717] bg-[#DC2626] text-white flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Đã hủy
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#171717] bg-white p-3 border-2 border-[#171717]">
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Địa điểm:</span>
                        <span className="font-bold">{reg.location}</span>
                      </div>
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Thời gian:</span>
                        <span className="font-bold text-[#3155E7]">
                          {reg.startTime} - {reg.endTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Chi phí:</span>
                        <span className="font-bold text-[#171717]">
                          {reg.chargedAmount > 0
                            ? `${reg.chargedAmount.toLocaleString('vi-VN')} VND`
                            : 'Miễn phí'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#171717]/60 text-[10px] block uppercase font-bold">Mã giao dịch:</span>
                        <span className="text-[10px] font-mono text-[#171717]/70">
                          {reg.transactionId || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#171717]">
                      {reg.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => setPassModalActivity(reg)}
                          className="neo-btn neo-btn-acid py-1.5 px-3 text-xs flex items-center gap-1.5 font-mono font-bold"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Thẻ QR Pass
                        </button>
                      )}
                      {reg.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => setCancellingReg(reg)}
                          className="px-3 py-1.5 bg-[#DC2626] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-xs font-mono font-bold uppercase flex items-center gap-1 active:translate-x-0.5 active:translate-y-0.5"
                        >
                          Hủy Chỗ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Activities & Notifications (KAN-199) */}
          <UpcomingActivitiesAndNotifications
            activities={activities}
            notifications={notifications}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Cancel Activity Modal */}
      {cancellingReg && (
        <CancelActivityModal
          isOpen={Boolean(cancellingReg)}
          onClose={() => setCancellingReg(null)}
          registration={{
            registrationId: cancellingReg.registrationId,
            activityId: cancellingReg.activityId,
            activityTitle: cancellingReg.activityTitle,
            activityDate: cancellingReg.activityDate,
            startTime: cancellingReg.startTime,
            chargedAmount: cancellingReg.chargedAmount,
            cancellationCutOffMinutes: cancellingReg.cancellationCutOffMinutes,
            passengerId: bookingSummary?.passengerId,
          }}
          onSuccess={() => {
            void loadData();
          }}
        />
      )}

      {/* Activity QR Pass Modal */}
      {passModalActivity && bookingSummary && (
        <ActivityPassModal
          isOpen={Boolean(passModalActivity)}
          onClose={() => setPassModalActivity(null)}
          activityId={passModalActivity.activityId}
          passengerId={bookingSummary.passengerId}
          activityTitle={passModalActivity.activityTitle}
        />
      )}
    </div>
  );
};

export default PassengerHomePage;
