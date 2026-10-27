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
      {/* Top Welcome & Navigation Header — Luxury Maritime Concierge Banner */}
      <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="hidden sm:block shrink-0">
            <MaritimeLottie variant="ship" className="w-16 h-16 sm:w-20 sm:h-20" title="Du thuyền Grand Pearl" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-full bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                GUEST CONCIERGE
              </span>
              <span className="text-xs text-[#252B32]/60">
                • TERMINAL DU THUYỀN // 20°57'N • 107°04'E
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#102A43] uppercase tracking-wide flex items-center gap-2">
              Chào mừng lên tàu,{' '}
              <span className="text-[#397C80]">
                {bookingSummary?.fullName || 'Quý Khách'}
              </span>
            </h1>
            <p className="text-xs text-[#252B32]/70 mt-1">
              Cập nhật thẻ lên tàu RFID, lịch trình cá nhân, tour bờ và các thông báo hải trình thời gian thực.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="w-10 h-10 bg-[#F7F4ED] hover:bg-[#E5E0D7] text-[#102A43] border border-[#E5E0D7] rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#397C80]' : ''}`} />
          </button>
          <Link
            to="/catalog"
            className="py-2.5 px-4 text-xs font-semibold uppercase rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A572]" />
            Duyệt Hoạt Động & Tour Bờ
          </Link>
        </div>
      </div>

      {/* Error State Banner */}
      {isError && (
        <div
          data-testid="passenger-error-banner"
          className="p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm text-rose-800 text-xs flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-rose-900 uppercase tracking-wider">Đã xảy ra sự cố tải dữ liệu!</p>
              <p className="text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => void loadData()}
            className="px-3.5 py-1.5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl text-xs font-semibold uppercase transition-colors cursor-pointer shadow-xs"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !isError && (
        <div data-testid="passenger-home-loading" className="space-y-6 animate-pulse">
          <div className="h-44 bg-white border border-[#E5E0D7] rounded-3xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white border border-[#E5E0D7] rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && !isError && bookingSummary && (
        <div className="space-y-8">
          {/* Hero Digital Boarding Pass & Cabin Card */}
          <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                    MÃ ĐẶT CHỖ: {bookingSummary.tourCode}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {bookingSummary.checkInStatus === 'BOARDED'
                      ? 'Đã Check-in Lên Tàu'
                      : 'Chưa Check-in'}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-[#102A43] uppercase tracking-wide">
                    {bookingSummary.tourName}
                  </h2>
                  <p className="text-xs text-[#252B32]/70 mt-1 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-[#397C80]" /> Du Thuyền Grand Pearl Voyager • Hải Trình 4 Ngày 3 Đêm
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl">
                    <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">Số Cabin</span>
                    <p className="text-base font-display font-bold text-[#102A43] mt-0.5">
                      {bookingSummary.cabinNumber}
                    </p>
                    <span className="text-[11px] font-medium text-[#397C80]">
                      {bookingSummary.cabinCategory}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl">
                    <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">
                      Thẻ RFID & Zone
                    </span>
                    <p className="text-base font-display font-bold text-[#102A43] mt-0.5">{bookingSummary.rfidTag}</p>
                    <span className="text-[11px] text-[#252B32]/70">
                      {bookingSummary.bleZone || 'Zone A - Sky Lounge'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">Gói Tour</span>
                    <p className="text-base font-display font-bold text-[#102A43] mt-0.5 truncate">
                      {bookingSummary.tourPackage}
                    </p>
                    <span className="text-[11px] font-medium text-[#397C80]">Trọn gói cao cấp</span>
                  </div>
                </div>
              </div>

              {/* Digital Boarding Pass QR Box */}
              <div className="shrink-0 bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 min-w-[200px]">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-[#E5E0D7]">
                  <QrCode className="w-24 h-24 text-[#102A43]" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#397C80] tracking-widest uppercase">
                    PASSENGER BOARDING PASS
                  </span>
                  <p className="text-xs text-[#102A43] mt-0.5 font-bold">
                    {bookingSummary.qrCode || 'QR-CRUISE-99412'}
                  </p>
                </div>
                <div className="text-[10px] text-[#252B32]/70 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-[#397C80] animate-pulse" />
                  <span>Sẵn sàng quét tại cổng cảng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-center text-[#397C80]">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">Tour bờ đã đăng ký</span>
                <p className="text-xl font-display font-bold text-[#102A43]">
                  {bookingSummary.totalRegisteredExcursions} tour
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-center text-[#C5A572]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">Chi phí tour bờ</span>
                <p className="text-xl font-display font-bold text-[#102A43]">
                  ${bookingSummary.totalExcursionSpent} USD
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-center text-[#397C80]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">Trạng thái đăng ký</span>
                <p className="text-sm font-semibold text-[#397C80] uppercase">Đã xác nhận</p>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-center text-[#397C80]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">Giờ lên tàu</span>
                <p className="text-sm font-semibold text-[#102A43]">
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
          <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E0D7] gap-2">
              <div>
                <h3 className="text-base font-display font-bold text-[#102A43] uppercase tracking-wide flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#397C80]" />
                  Danh Sách Vé & Tour Bờ Đã Đặt (Excursions)
                </h3>
                <p className="text-xs text-[#252B32]/70">
                  Theo dõi giờ tập trung, số xe đưa đón và số vé điện tử
                </p>
              </div>
              <Link
                to="/catalog?itemType=SHORE_EXCURSION"
                className="text-xs font-semibold text-[#397C80] hover:text-[#2D6468] hover:underline flex items-center gap-1 uppercase"
              >
                Đặt thêm tour bờ <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {bookingSummary.registeredExcursions.length === 0 ? (
              <div className="py-8 text-center text-[#252B32]/60 text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40 text-[#397C80]" />
                <span>Quý khách chưa đăng ký tour tham quan trên bờ nào.</span>
                <Link
                  to="/catalog?itemType=SHORE_EXCURSION"
                  className="mt-2 text-[#397C80] hover:underline font-bold uppercase"
                >
                  Khám phá các tour trên bờ ngay &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingSummary.registeredExcursions.map((exc) => (
                  <div
                    key={exc.excursionId}
                    className="p-4 bg-[#F7F4ED]/60 border border-[#E5E0D7] hover:border-[#C5A572] rounded-2xl space-y-3 shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-[#397C80] uppercase">
                          Vé: {exc.ticketCode}
                        </span>
                        <h4 className="text-sm font-display font-bold text-[#102A43] uppercase mt-0.5">
                          {exc.excursionTitle}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                        {exc.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#102A43] bg-white p-3 rounded-xl border border-[#E5E0D7]">
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Phân đoàn:</span>
                        <span className="font-semibold">{exc.groupName}</span>
                      </div>
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Xe đưa đón:</span>
                        <span className="font-semibold text-[#397C80]">{exc.busNumber}</span>
                      </div>
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Giờ tập trung:</span>
                        <span className="font-semibold text-[#102A43]">
                          {exc.gatheringTime || '08:00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Giờ về tàu:</span>
                        <span className="font-semibold text-[#102A43]">
                          {exc.returnToShipTime || '16:00'}
                        </span>
                      </div>
                    </div>

                    {exc.portName && (
                      <div className="text-[11px] text-[#252B32]/70 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C5A572]" />
                        <span>Điểm cập cảng: {exc.portName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Onboard Activities (KAN-217) */}
          <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E0D7] gap-2">
              <div>
                <h3 className="text-base font-display font-bold text-[#102A43] uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A572]" />
                  Hoạt Động Trên Du Thuyền Đã Đăng Ký (Onboard Activities)
                </h3>
                <p className="text-xs text-[#252B32]/70">
                  Theo dõi trạng thái xác nhận, thứ tự hàng đợi Waitlist và thẻ tham gia QR Pass
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/my-schedule"
                  className="py-1.5 px-3 text-xs rounded-xl bg-[#F7F4ED] border border-[#E5E0D7] text-[#102A43] flex items-center gap-1.5 font-semibold hover:border-[#397C80] transition-colors shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5 text-[#397C80]" /> Lịch Trình My Day
                </Link>
                <Link
                  to="/catalog?itemType=ONBOARD_ACTIVITY"
                  className="text-xs font-semibold text-[#397C80] hover:text-[#2D6468] hover:underline flex items-center gap-1 uppercase"
                >
                  Khám phá thêm hoạt động <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {registeredActivities.length === 0 ? (
              <div className="py-8 text-center text-[#252B32]/60 text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40 text-[#397C80]" />
                <span>Quý khách chưa đăng ký hoạt động giải trí nào trên du thuyền.</span>
                <Link
                  to="/catalog?itemType=ONBOARD_ACTIVITY"
                  className="mt-2 text-[#397C80] hover:underline font-bold uppercase"
                >
                  Xem danh mục hoạt động &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredActivities.map((reg) => (
                  <div
                    key={reg.registrationId}
                    className="p-4 bg-[#F7F4ED]/60 border border-[#E5E0D7] hover:border-[#C5A572] rounded-2xl space-y-3 shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#252B32]/60 uppercase font-medium">
                          {reg.category} • Mã: #{reg.registrationId}
                        </span>
                        <h4 className="text-sm font-display font-bold text-[#102A43] uppercase mt-0.5">{reg.activityTitle}</h4>
                      </div>
                      {reg.status === 'CONFIRMED' && (
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xác nhận
                        </span>
                      )}
                      {reg.status === 'WAITLISTED' && (
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-700" /> Hàng đợi #{reg.waitlistPosition || 1}
                        </span>
                      )}
                      {reg.status === 'CANCELLED' && (
                        <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Đã hủy
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#102A43] bg-white p-3 rounded-xl border border-[#E5E0D7]">
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Địa điểm:</span>
                        <span className="font-semibold">{reg.location}</span>
                      </div>
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Thời gian:</span>
                        <span className="font-semibold text-[#397C80]">
                          {reg.startTime} - {reg.endTime}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Chi phí:</span>
                        <span className="font-semibold text-[#102A43]">
                          {reg.chargedAmount > 0
                            ? `${reg.chargedAmount.toLocaleString('vi-VN')} VND`
                            : 'Miễn phí'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#252B32]/60 text-[10px] block uppercase font-medium">Mã giao dịch:</span>
                        <span className="text-[10px] text-[#252B32]/60">
                          {reg.transactionId || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D7]">
                      {reg.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => setPassModalActivity(reg)}
                          className="py-1.5 px-3 text-xs rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white flex items-center gap-1.5 font-semibold uppercase shadow-xs cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#397C80]" /> Thẻ QR Pass
                        </button>
                      )}
                      {reg.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => setCancellingReg(reg)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold uppercase flex items-center gap-1 cursor-pointer"
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
