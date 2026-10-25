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
import { MaritimeLottie } from '../components/common/MaritimeLottie';

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
      {/* Top Welcome & Navigation Header — Retro-Futuristic Maritime Telemetry Banner */}
      <div className="bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[0_4px_24px_rgba(7,11,22,0.8)] relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="hidden sm:block shrink-0">
            <MaritimeLottie variant="ship" className="w-16 h-16 sm:w-20 sm:h-20" title="Du thuyền Grand Pearl" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-[#4169FF]/20 text-[#42E8F5] border border-[#42E8F5]/40">
                GUEST CONCIERGE
              </span>
              <span className="text-[10px] font-mono text-[#A7B4C9]">
                • ONBOARD TERMINAL // LAT 20°57'N • LON 107°04'E
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-[#F4F4F0] uppercase tracking-wide flex items-center gap-2">
              Chào mừng lên tàu,{' '}
              <span className="text-[#42E8F5]">
                {bookingSummary?.fullName || 'Quý Khách'}
              </span>
            </h1>
            <p className="text-xs font-mono text-[#A7B4C9] mt-1">
              Cập nhật thẻ lên tàu RFID, lịch trình cá nhân, tour bờ và các thông báo hải trình thời
              gian thực.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="w-10 h-10 bg-[#10182A] hover:bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/30 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#42E8F5]' : ''}`} />
          </button>
          <Link
            to="/catalog"
            className="py-2.5 px-4 text-xs font-mono font-bold uppercase rounded-lg bg-[#42E8F5] hover:bg-[#32d8e5] text-[#070B16] flex items-center gap-1.5 shadow-lg shadow-[#42E8F5]/20 transition-all"
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
          className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-xl shadow-lg text-rose-200 text-xs font-mono flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-100 uppercase tracking-wider">Đã xảy ra sự cố tải dữ liệu!</p>
              <p className="text-rose-300 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => void loadData()}
            className="px-3.5 py-1.5 bg-rose-900 hover:bg-rose-800 text-rose-100 border border-rose-500/40 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !isError && (
        <div data-testid="passenger-home-loading" className="space-y-6 animate-pulse">
          <div className="h-44 bg-[#151F33] border border-[#42E8F5]/20 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-[#151F33] border border-[#42E8F5]/20 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && !isError && bookingSummary && (
        <div className="space-y-8">
          {/* Hero Digital Boarding Pass & Cabin Card — Futuristic HUD Panel */}
          <div className="bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl p-6 sm:p-8 shadow-[0_6px_28px_rgba(7,11,22,0.8)] relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded bg-[#10182A] text-[#42E8F5] border border-[#42E8F5]/40">
                    MÃ ĐẶT CHỖ: {bookingSummary.tourCode}
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {bookingSummary.checkInStatus === 'BOARDED'
                      ? 'Đã Check-in Lên Tàu'
                      : 'Chưa Check-in'}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-[#F4F4F0] uppercase tracking-wide">
                    {bookingSummary.tourName}
                  </h2>
                  <p className="text-xs font-mono text-[#A7B4C9] mt-1 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-[#42E8F5]" /> Du Thuyền Grand Pearl Voyager •
                    Hải Trình 4 Ngày 3 Đêm
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#10182A] border border-[#42E8F5]/20 rounded-xl">
                    <span className="text-[10px] text-[#A7B4C9] uppercase font-mono">Số Cabin</span>
                    <p className="text-base font-display font-black text-[#F4F4F0] mt-0.5">
                      {bookingSummary.cabinNumber}
                    </p>
                    <span className="text-[10px] font-mono text-[#42E8F5]">
                      {bookingSummary.cabinCategory}
                    </span>
                  </div>
                  <div className="p-3 bg-[#10182A] border border-[#42E8F5]/20 rounded-xl">
                    <span className="text-[10px] text-[#A7B4C9] uppercase font-mono">
                      Thẻ RFID & Zone
                    </span>
                    <p className="text-base font-display font-black text-[#FFBD59] mt-0.5">{bookingSummary.rfidTag}</p>
                    <span className="text-[10px] font-mono text-[#A7B4C9]">
                      {bookingSummary.bleZone || 'Zone A - Sky Lounge'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#10182A] border border-[#42E8F5]/20 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#A7B4C9] uppercase font-mono">Gói Tour</span>
                    <p className="text-base font-display font-black text-[#F4F4F0] mt-0.5 truncate">
                      {bookingSummary.tourPackage}
                    </p>
                    <span className="text-[10px] font-mono text-[#42E8F5]">Trọn gói cao cấp</span>
                  </div>
                </div>
              </div>

              {/* Digital Boarding Pass QR Box */}
              <div className="shrink-0 bg-[#10182A] border border-[#42E8F5]/30 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3 min-w-[200px]">
                <div className="p-3 bg-white rounded-lg shadow-md">
                  <QrCode className="w-24 h-24 text-[#070B16]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#42E8F5] font-bold tracking-widest uppercase">
                    PASSENGER BOARDING PASS
                  </span>
                  <p className="text-xs font-mono text-[#F4F4F0] mt-0.5 font-bold">
                    {bookingSummary.qrCode || 'QR-CRUISE-99412'}
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#A7B4C9] flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[#42E8F5] animate-pulse" />
                  <span>Sẵn sàng quét tại cổng cảng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar — Retro-Futuristic 4-Up Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151F33] border border-[#42E8F5]/25 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#10182A] rounded-lg border border-[#42E8F5]/30 flex items-center justify-center text-[#42E8F5]">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#A7B4C9] uppercase">Tour bờ đã đăng ký</span>
                <p className="text-xl font-display font-black text-[#F4F4F0]">
                  {bookingSummary.totalRegisteredExcursions} tour
                </p>
              </div>
            </div>

            <div className="bg-[#151F33] border border-[#42E8F5]/25 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#10182A] rounded-lg border border-[#FFBD59]/40 flex items-center justify-center text-[#FFBD59]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#A7B4C9] uppercase">Chi phí tour bờ</span>
                <p className="text-xl font-display font-black text-[#FFBD59]">
                  ${bookingSummary.totalExcursionSpent} USD
                </p>
              </div>
            </div>

            <div className="bg-[#151F33] border border-[#42E8F5]/25 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#10182A] rounded-lg border border-[#42E8F5]/30 flex items-center justify-center text-[#42E8F5]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#A7B4C9] uppercase">Trạng thái đăng ký</span>
                <p className="text-sm font-mono font-bold text-[#42E8F5] uppercase">Đã xác nhận</p>
              </div>
            </div>

            <div className="bg-[#151F33] border border-[#42E8F5]/25 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#10182A] rounded-lg border border-[#4169FF]/40 flex items-center justify-center text-[#4169FF]">
                <Clock className="w-5 h-5 text-[#42E8F5]" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#A7B4C9] uppercase">Giờ lên tàu</span>
                <p className="text-sm font-mono font-bold text-[#F4F4F0]">
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
          <div className="bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#42E8F5]/20 gap-2">
              <div>
                <h3 className="text-base font-display font-black text-[#F4F4F0] uppercase tracking-wide flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#42E8F5]" />
                  Danh Sách Vé & Tour Bờ Đã Đặt (Excursions)
                </h3>
                <p className="text-xs font-mono text-[#A7B4C9]">
                  Theo dõi giờ tập trung, số xe đưa đón và số vé điện tử
                </p>
              </div>
              <Link
                to="/catalog?itemType=SHORE_EXCURSION"
                className="text-xs font-mono font-semibold text-[#42E8F5] hover:underline flex items-center gap-1 uppercase"
              >
                Đặt thêm tour bờ <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {bookingSummary.registeredExcursions.length === 0 ? (
              <div className="py-8 text-center text-[#A7B4C9] font-mono text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40 text-[#42E8F5]" />
                <span>Quý khách chưa đăng ký tour tham quan trên bờ nào.</span>
                <Link
                  to="/catalog?itemType=SHORE_EXCURSION"
                  className="mt-2 text-[#42E8F5] hover:underline font-bold uppercase"
                >
                  Khám phá các tour trên bờ ngay &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingSummary.registeredExcursions.map((exc) => (
                  <div
                    key={exc.excursionId}
                    className="p-4 bg-[#10182A] border border-[#42E8F5]/25 rounded-xl space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#42E8F5] uppercase">
                          Vé: {exc.ticketCode}
                        </span>
                        <h4 className="text-sm font-display font-bold text-[#F4F4F0] uppercase mt-0.5">
                          {exc.excursionTitle}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#FFBD59]/20 text-[#FFBD59] border border-[#FFBD59]/40">
                        {exc.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#F4F4F0] bg-[#151F33] p-3 rounded-lg border border-[#42E8F5]/15">
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Phân đoàn:</span>
                        <span className="font-bold">{exc.groupName}</span>
                      </div>
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Xe đưa đón:</span>
                        <span className="font-bold text-[#42E8F5]">{exc.busNumber}</span>
                      </div>
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Giờ tập trung:</span>
                        <span className="font-mono text-[#F4F4F0] font-bold">
                          {exc.gatheringTime || '08:00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Giờ về tàu:</span>
                        <span className="font-mono text-[#FFBD59] font-bold">
                          {exc.returnToShipTime || '16:00'}
                        </span>
                      </div>
                    </div>

                    {exc.portName && (
                      <div className="text-[11px] font-mono text-[#A7B4C9] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#42E8F5]" />
                        <span>Điểm cập cảng: {exc.portName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Onboard Activities (KAN-217) */}
          <div className="bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#42E8F5]/20 gap-2">
              <div>
                <h3 className="text-base font-display font-black text-[#F4F4F0] uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#42E8F5]" />
                  Hoạt Động Trên Du Thuyền Đã Đăng Ký (Onboard Activities)
                </h3>
                <p className="text-xs font-mono text-[#A7B4C9]">
                  Theo dõi trạng thái xác nhận, thứ tự hàng đợi Waitlist và thẻ tham gia QR Pass
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/my-schedule"
                  className="py-1.5 px-3 text-xs rounded-lg bg-[#10182A] border border-[#42E8F5]/30 text-[#42E8F5] flex items-center gap-1.5 font-mono font-medium hover:bg-[#151F33] transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-[#42E8F5]" /> Lịch Trình My Day
                </Link>
                <Link
                  to="/catalog?itemType=ONBOARD_ACTIVITY"
                  className="text-xs font-mono font-semibold text-[#42E8F5] hover:underline flex items-center gap-1 uppercase"
                >
                  Khám phá thêm hoạt động <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {registeredActivities.length === 0 ? (
              <div className="py-8 text-center text-[#A7B4C9] font-mono text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40 text-[#42E8F5]" />
                <span>Quý khách chưa đăng ký hoạt động giải trí nào trên du thuyền.</span>
                <Link
                  to="/catalog?itemType=ONBOARD_ACTIVITY"
                  className="mt-2 text-[#42E8F5] hover:underline font-bold uppercase"
                >
                  Xem danh mục hoạt động &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredActivities.map((reg) => (
                  <div
                    key={reg.registrationId}
                    className="p-4 bg-[#10182A] border border-[#42E8F5]/25 rounded-xl space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#A7B4C9] uppercase">
                          {reg.category} • Mã: #{reg.registrationId}
                        </span>
                        <h4 className="text-sm font-display font-bold text-[#F4F4F0] uppercase mt-0.5">{reg.activityTitle}</h4>
                      </div>
                      {reg.status === 'CONFIRMED' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Đã xác nhận
                        </span>
                      )}
                      {reg.status === 'WAITLISTED' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-950/40 text-[#FFBD59] border border-amber-500/40 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-[#FFBD59]" /> Hàng đợi #{reg.waitlistPosition || 1}
                        </span>
                      )}
                      {reg.status === 'CANCELLED' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-950/40 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Đã hủy
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#F4F4F0] bg-[#151F33] p-3 rounded-lg border border-[#42E8F5]/15">
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Địa điểm:</span>
                        <span className="font-bold">{reg.location}</span>
                      </div>
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Thời gian:</span>
                        <span className="font-bold text-[#42E8F5]">
                          {reg.startTime} - {reg.endTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Chi phí:</span>
                        <span className="font-bold text-[#F4F4F0]">
                          {reg.chargedAmount > 0
                            ? `${reg.chargedAmount.toLocaleString('vi-VN')} VND`
                            : 'Miễn phí'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#A7B4C9] text-[10px] block uppercase font-medium">Mã giao dịch:</span>
                        <span className="text-[10px] font-mono text-[#A7B4C9]">
                          {reg.transactionId || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#42E8F5]/15">
                      {reg.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => setPassModalActivity(reg)}
                          className="py-1.5 px-3 text-xs rounded bg-[#42E8F5] hover:bg-[#32d8e5] text-[#070B16] flex items-center gap-1.5 font-mono font-bold uppercase cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Thẻ QR Pass
                        </button>
                      )}
                      {reg.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => setCancellingReg(reg)}
                          className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40 rounded text-xs font-mono font-bold uppercase flex items-center gap-1 cursor-pointer"
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
