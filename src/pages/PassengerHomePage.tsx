import React, { useState, useEffect } from 'react';
import {
  Compass,
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
import {
  getTourNotifications,
  type TourNotification,
} from '../services/dailyItineraryService';
import {
  activityRegistrationService,
  type PassengerRegistrationItem,
} from '../services/activityRegistrationService';
import { UpcomingActivitiesAndNotifications } from '../components/passenger/UpcomingActivitiesAndNotifications';
import { CancelActivityModal } from '../components/activities/CancelActivityModal';
import { ActivityPassModal } from '../components/activities/ActivityPassModal';

export const PassengerHomePage: React.FC = () => {
  const [bookingSummary, setBookingSummary] = useState<PassengerBookingSummary | null>(null);
  const [activities, setActivities] = useState<PassengerCatalogItem[]>([]);
  const [registeredActivities, setRegisteredActivities] = useState<PassengerRegistrationItem[]>([]);
  const [cancellingReg, setCancellingReg] = useState<PassengerRegistrationItem | null>(null);
  const [passModalActivity, setPassModalActivity] = useState<PassengerRegistrationItem | null>(null);
  const [notifications, setNotifications] = useState<TourNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const resolvePassengerId = (): number | null => {
    // 1. Check URL search param (e.g. ?passengerId=5)
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('passengerId') || params.get('id');
    if (queryId && !isNaN(Number(queryId))) {
      return Number(queryId);
    }

    // 2. Check session / local storage for authenticated passenger or user
    try {
      const storedPassenger = localStorage.getItem('currentPassenger') || sessionStorage.getItem('currentPassenger');
      if (storedPassenger) {
        const parsed = JSON.parse(storedPassenger);
        if (parsed?.id || parsed?.passengerId) {
          return Number(parsed.id || parsed.passengerId);
        }
      }

      const storedUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser?.passengerId) {
          return Number(parsedUser.passengerId);
        }
      }

      const directId = localStorage.getItem('passengerId') || sessionStorage.getItem('passengerId');
      if (directId && !isNaN(Number(directId))) {
        return Number(directId);
      }
    } catch {
      // Storage parsing failed, continue to fallback
    }

    // Default to active test passenger 1 if no explicit session exists
    return 1;
  };

  const loadData = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');
    try {
      const activePassengerId = resolvePassengerId();
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Welcome & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>GUEST PORTAL • TRANG CHỦ HÀNH KHÁCH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Chào mừng lên tàu,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {bookingSummary?.fullName || 'Quý Khách'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cập nhật thẻ lên tàu RFID, lịch trình cá nhân, tour bờ và các thông báo hải trình thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadData()}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <Link
            to="/catalog"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
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
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-rose-200">Đã xảy ra sự cố tải dữ liệu!</p>
              <p className="text-rose-300/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => void loadData()}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-semibold text-rose-200 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !isError && (
        <div data-testid="passenger-home-loading" className="space-y-6 animate-pulse">
          <div className="h-44 rounded-3xl bg-white/[0.03] border border-white/5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.02] border border-white/5" />
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && !isError && bookingSummary && (
        <div className="space-y-8">
          {/* Hero Digital Boarding Pass & Cabin Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1427]/80 via-[#030712] to-[#040817] border border-cyan-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    MÃ ĐẶT CHỖ: {bookingSummary.tourCode}
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {bookingSummary.checkInStatus === 'BOARDED' ? 'Đã Check-in Lên Tàu' : 'Chưa Check-in'}
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {bookingSummary.tourName}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-cyan-400" /> Du Thuyền Grand Pearl Voyager • Hải Trình 4 Ngày 3 Đêm
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Số Cabin</span>
                    <p className="text-sm font-bold text-white mt-0.5">{bookingSummary.cabinNumber}</p>
                    <span className="text-[10px] text-cyan-400">{bookingSummary.cabinCategory}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Thẻ RFID & Zone</span>
                    <p className="text-sm font-bold text-white mt-0.5">{bookingSummary.rfidTag}</p>
                    <span className="text-[10px] text-slate-400">{bookingSummary.bleZone || 'Zone A - Sky Lounge'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Gói Tour</span>
                    <p className="text-sm font-bold text-amber-300 mt-0.5 truncate">{bookingSummary.tourPackage}</p>
                    <span className="text-[10px] text-emerald-400">Trọn gói cao cấp</span>
                  </div>
                </div>
              </div>

              {/* Digital Boarding Pass QR Box */}
              <div className="shrink-0 bg-[#030303]/80 border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xl space-y-3 min-w-[200px]">
                <div className="p-3 bg-white rounded-xl shadow-inner">
                  <QrCode className="w-24 h-24 text-black" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase">
                    PASSENGER BOARDING PASS
                  </span>
                  <p className="text-xs font-mono text-slate-300 mt-0.5 font-semibold">
                    {bookingSummary.qrCode || 'QR-CRUISE-99412'}
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>Sẵn sàng quét tại cổng cảng</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#030303]/60 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Tour bờ đã đăng ký</span>
                <p className="text-lg font-bold text-white">{bookingSummary.totalRegisteredExcursions} tour</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#030303]/60 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Chi phí tour bờ</span>
                <p className="text-lg font-bold text-white">${bookingSummary.totalExcursionSpent} USD</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#030303]/60 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Trạng thái đăng ký</span>
                <p className="text-sm font-bold text-emerald-400">Đã xác nhận</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#030303]/60 border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Giờ lên tàu</span>
                <p className="text-sm font-bold text-white">
                  {bookingSummary.boardedAt ? new Date(bookingSummary.boardedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '08:30'}
                </p>
              </div>
            </div>
          </div>

          {/* Registered Excursions Table / Cards */}
          <div className="bg-[#030303]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Danh Sách Vé & Tour Bờ Đã Đặt (Excursions)
                </h3>
                <p className="text-[11px] text-slate-400">Theo dõi giờ tập trung, số xe đưa đón và số vé điện tử</p>
              </div>
              <Link
                to="/catalog?itemType=SHORE_EXCURSION"
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                Đặt thêm tour bờ <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {bookingSummary.registeredExcursions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40" />
                <span>Quý khách chưa đăng ký tour tham quan trên bờ nào.</span>
                <Link
                  to="/catalog?itemType=SHORE_EXCURSION"
                  className="mt-2 text-cyan-400 hover:underline font-semibold"
                >
                  Khám phá các tour trên bờ ngay &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingSummary.registeredExcursions.map((exc) => (
                  <div
                    key={exc.excursionId}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                          Vé: {exc.ticketCode}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-0.5">{exc.excursionTitle}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {exc.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Phân đoàn:</span>
                        <span className="font-semibold">{exc.groupName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Xe đưa đón:</span>
                        <span className="font-semibold text-cyan-400">{exc.busNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Giờ tập trung:</span>
                        <span className="font-mono text-amber-300 font-semibold">{exc.gatheringTime || '08:00'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Giờ về tàu:</span>
                        <span className="font-mono text-cyan-300 font-semibold">{exc.returnToShipTime || '16:00'}</span>
                      </div>
                    </div>

                    {exc.portName && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>Điểm cập cảng: {exc.portName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registered Onboard Activities (KAN-217) */}
          <div className="bg-[#030303]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Hoạt Động Trên Du Thuyền Đã Đăng Ký (Onboard Activities)
                </h3>
                <p className="text-[11px] text-slate-400">Theo dõi trạng thái xác nhận, thứ tự hàng đợi Waitlist và thẻ tham gia QR Pass</p>
              </div>
              <Link
                to="/catalog?itemType=ONBOARD_ACTIVITY"
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
              >
                Khám phá thêm hoạt động <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {registeredActivities.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Ticket className="w-8 h-8 opacity-40" />
                <span>Quý khách chưa đăng ký hoạt động giải trí nào trên du thuyền.</span>
                <Link
                  to="/catalog?itemType=ONBOARD_ACTIVITY"
                  className="mt-2 text-cyan-400 hover:underline font-semibold"
                >
                  Xem danh mục hoạt động &rarr;
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registeredActivities.map((reg) => (
                  <div
                    key={reg.registrationId}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                          {reg.category} • Mã: #{reg.registrationId}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-0.5">{reg.activityTitle}</h4>
                      </div>
                      {reg.status === 'CONFIRMED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã xác nhận
                        </span>
                      )}
                      {reg.status === 'WAITLISTED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Hàng đợi #{reg.waitlistPosition || 1}
                        </span>
                      )}
                      {reg.status === 'CANCELLED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Đã hủy
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Địa điểm:</span>
                        <span className="font-semibold text-white">{reg.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Thời gian:</span>
                        <span className="font-mono text-cyan-300 font-semibold">{reg.startTime} - {reg.endTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Chi phí:</span>
                        <span className="font-semibold text-emerald-400">
                          {reg.chargedAmount > 0 ? `${reg.chargedAmount.toLocaleString('vi-VN')} VND` : 'Miễn phí'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Mã giao dịch:</span>
                        <span className="font-mono text-[10px] text-slate-400">{reg.transactionId || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
                      {reg.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          onClick={() => setPassModalActivity(reg)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-cyan-500/30"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Thẻ QR Pass
                        </button>
                      )}
                      {reg.status !== 'CANCELLED' && (
                        <button
                          type="button"
                          onClick={() => setCancellingReg(reg)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors border border-rose-500/20"
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
            passengerId: bookingSummary?.passengerId
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
