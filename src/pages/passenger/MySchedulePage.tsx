import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Users,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  CheckCircle2,
  Compass,
  ArrowLeft,
  Bell,
} from 'lucide-react';
import {
  passengerScheduleService,
  type PersonalScheduleResponse,
  type PersonalScheduleItem,
  type ScheduleScope,
} from '../../services/passengerScheduleService';
import { ConflictAlertBanner } from '../../components/passenger/ConflictAlertBanner';
import { MyScheduleTimeline } from '../../components/passenger/MyScheduleTimeline';
import { ActivityPassModal } from '../../components/activities/ActivityPassModal';
import { NotificationCenterDrawer } from '../../components/passenger/NotificationCenterDrawer';
import { ActivityFeedbackModal } from '../../components/passenger/ActivityFeedbackModal';
import { passengerNotificationService } from '../../services/passengerNotificationService';
import { resolvePassengerId } from '../../services/passengerIdentity';

export const MySchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const passengerId = resolvePassengerId() ?? 1;

  const rawDayParam = searchParams.get('day');
  const parseDayParam = (param: string | null): number | undefined => {
    if (!param) return 1;
    if (param.toLowerCase() === 'all') return undefined;
    const parsed = parseInt(param, 10);
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : 1;
  };
  const initialDay = parseDayParam(rawDayParam);
  const initialScope = (searchParams.get('scope') === 'cabin' ? 'cabin' : 'my') as ScheduleScope;

  const [selectedDay, setSelectedDay] = useState<number | undefined>(initialDay);
  const [scope, setScope] = useState<ScheduleScope>(initialScope);
  const [scheduleData, setScheduleData] = useState<PersonalScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Pass Modal State
  const [selectedPassItem, setSelectedPassItem] = useState<PersonalScheduleItem | null>(null);

  // Notification Drawer & Badge State (KAN-366)
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);

  // Post-Activity Feedback Modal State (KAN-367)
  const [ratingItem, setRatingItem] = useState<PersonalScheduleItem | null>(null);

  // Sync online / offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestSeqRef = useRef<number>(0);

  const formatCachedTime = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return !Number.isNaN(date.getTime())
      ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : isoString;
  };

  const loadNotificationsSummary = useCallback(async () => {
    try {
      const summary = await passengerNotificationService.getNotificationSummary(passengerId);
      setUnreadNotificationCount(summary.totalUnread || 0);
    } catch {
      // ignore
    }
  }, [passengerId]);

  const loadSchedule = useCallback(async () => {
    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await passengerScheduleService.getPersonalSchedule(
        passengerId,
        selectedDay,
        scope
      );
      if (currentSeq !== requestSeqRef.current) return;
      setScheduleData(data);
      setLastUpdated(
        new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err) {
      if (currentSeq !== requestSeqRef.current) return;
      console.warn('Lỗi khi tải lịch trình:', err);
      // Kiểm tra cache ngoại tuyến
      const cached = passengerScheduleService.loadFromCache(passengerId, selectedDay, scope);
      if (cached) {
        setScheduleData(cached.data);
        setIsOffline(true);
        setLastUpdated(formatCachedTime(cached.cachedAt));
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Không thể tải lịch trình cá nhân');
      }
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [passengerId, selectedDay, scope]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    loadNotificationsSummary();
  }, [loadNotificationsSummary]);

  const handleDayChange = (day: number | undefined) => {
    setSelectedDay(day);
    const newParams = new URLSearchParams(searchParams);
    if (day !== undefined) {
      newParams.set('day', day.toString());
    } else {
      newParams.set('day', 'all');
    }
    setSearchParams(newParams);
  };

  const handleScopeChange = (newScope: ScheduleScope) => {
    setScope(newScope);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('scope', newScope);
    setSearchParams(newParams);
  };

  // Tính toán số liệu thống kê tổng quan
  const items = scheduleData?.items || [];
  const totalEvents = items.length;
  const checkedInCount = items.filter(
    (i) => i.status === 'CHECKED_IN' || i.status === 'COMPLETED'
  ).length;
  const pendingCount = items.filter((i) => i.status === 'REGISTERED').length;
  const totalConflicts = scheduleData?.totalConflicts || 0;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#171717] p-4 sm:p-6 lg:p-8 font-sans dark:bg-slate-900 dark:text-white">
      {/* Top Banner Navigation & Breadcrumb */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-[#171717] dark:border-slate-700">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/passenger')}
              className="p-2.5 border-2 border-[#171717] bg-white text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
              aria-label="Quay lại trang chính"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase text-[#171717] dark:text-white">
                  Lịch Trình Cá Nhân (My Day)
                </h1>
                {isOffline && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black bg-amber-300 text-black text-xs font-black uppercase shadow-[2px_2px_0px_#171717]"
                    title="Đang xem dữ liệu lưu trong bộ nhớ thiết bị"
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Ngoại tuyến {lastUpdated && `• Cập nhật ${lastUpdated}`}</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider mt-0.5 dark:text-neutral-400">
                {scheduleData?.passengerName
                  ? `${scheduleData.passengerName} • Cabin ${scheduleData.cabinNumber}`
                  : 'Hành khách'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell with Badge (KAN-366) */}
            <button
              type="button"
              data-testid="notification-bell-btn"
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2.5 border-2 border-[#171717] bg-white text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
              title="Mở trung tâm thông báo"
            >
              <Bell className="w-4 h-4 text-[#3155E7] dark:text-[#D9FF43]" />
              {unreadNotificationCount > 0 && (
                <span
                  data-testid="header-unread-counter"
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-[#DC2626] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-black"
                >
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={loadSchedule}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 border-2 border-[#171717] bg-white text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] text-xs font-black uppercase transition-all disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#171717] bg-[#3155E7] text-white text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#171717] hover:bg-blue-700 transition-all active:translate-x-[1px] active:translate-y-[1px]"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Duyệt Hoạt Động</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Cabin Scope Toggle & Day Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 p-1 border-2 border-[#171717] bg-[#E7E4DC] shadow-[2px_2px_0px_#171717] overflow-x-auto max-w-full dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleDayChange(undefined)}
              className={`px-4 py-1.5 text-xs font-black uppercase transition-all whitespace-nowrap ${
                selectedDay === undefined
                  ? 'border-2 border-[#171717] bg-[#171717] text-white shadow-[2px_2px_0px_#171717] dark:bg-[#D9FF43] dark:text-black'
                  : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              Toàn bộ hải trình
            </button>
            {[1, 2, 3, 4, 5].map((day) => (
              <button
                key={`day-tab-${day}`}
                type="button"
                onClick={() => handleDayChange(day)}
                className={`px-4 py-1.5 text-xs font-black uppercase transition-all whitespace-nowrap ${
                  selectedDay === day
                    ? 'border-2 border-[#171717] bg-[#171717] text-white shadow-[2px_2px_0px_#171717] dark:bg-[#D9FF43] dark:text-black'
                    : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
                }`}
              >
                Ngày {day}
              </button>
            ))}
          </div>

          {/* Scope Toggle: My Schedule vs Cabin Schedule */}
          <div className="flex items-center gap-1 p-1 border-2 border-[#171717] bg-[#E7E4DC] shadow-[2px_2px_0px_#171717] dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleScopeChange('my')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase transition-all ${
                scope === 'my'
                  ? 'border-2 border-[#171717] bg-[#3155E7] text-white shadow-[2px_2px_0px_#171717]'
                  : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Chỉ lịch của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('cabin')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase transition-all ${
                scope === 'cabin'
                  ? 'border-2 border-[#171717] bg-[#3155E7] text-white shadow-[2px_2px_0px_#171717]'
                  : 'text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cả cabin ({scheduleData?.cabinNumber || 'Phòng'})</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 border-2 border-[#171717] bg-white shadow-[4px_4px_0px_#171717] dark:bg-slate-800">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-500 mb-1">
              <span>Tổng sự kiện</span>
              <Calendar className="w-4 h-4 text-[#3155E7]" />
            </div>
            <div className="font-mono text-3xl font-black text-black dark:text-white">{totalEvents}</div>
          </div>

          <div className="p-4 border-2 border-[#171717] bg-white shadow-[4px_4px_0px_#171717] dark:bg-slate-800">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-500 mb-1">
              <span>Đã check-in</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-mono text-3xl font-black text-emerald-700 dark:text-emerald-400">{checkedInCount}</div>
          </div>

          <div className="p-4 border-2 border-[#171717] bg-white shadow-[4px_4px_0px_#171717] dark:bg-slate-800">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-500 mb-1">
              <span>Chờ tham gia</span>
              <Clock className="w-4 h-4 text-[#3155E7]" />
            </div>
            <div className="font-mono text-3xl font-black text-[#3155E7] dark:text-blue-400">{pendingCount}</div>
          </div>

          <div
            className={`p-4 border-2 border-[#171717] shadow-[4px_4px_0px_#171717] transition-colors ${
              totalConflicts > 0
                ? 'bg-amber-300 text-black'
                : 'bg-white text-neutral-500 dark:bg-slate-800 dark:text-neutral-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider mb-1">
              <span>Trùng lịch</span>
              <AlertTriangle
                className={`w-4 h-4 ${totalConflicts > 0 ? 'text-black' : 'text-neutral-500'}`}
              />
            </div>
            <div className="font-mono text-3xl font-black text-black dark:text-white">{totalConflicts}</div>
          </div>
        </div>

        {/* Conflict Alert Banner (KAN-350 / KAN-353) */}
        <div className="mt-6">
          <ConflictAlertBanner conflicts={scheduleData?.conflicts || []} />
        </div>

        {/* Main Timeline View */}
        <div className="mt-8">
          {isLoading && !scheduleData ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#3155E7] animate-spin" />
              <p className="text-sm font-bold uppercase tracking-wider text-neutral-500">Đang tải lịch trình cá nhân...</p>
            </div>
          ) : errorMessage && !scheduleData ? (
            <div className="p-6 border-2 border-[#171717] bg-rose-100 text-center shadow-[4px_4px_0px_#171717]">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
              <p className="text-sm font-black text-rose-700">{errorMessage}</p>
              <button
                type="button"
                onClick={loadSchedule}
                className="mt-4 px-5 py-2 border-2 border-[#171717] bg-[#DC2626] text-white text-xs font-black uppercase shadow-[2px_2px_0px_#171717] active:translate-x-[1px] active:translate-y-[1px]"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <MyScheduleTimeline
              items={items}
              onOpenPass={(item) => setSelectedPassItem(item)}
              onBrowseCatalog={() => navigate('/catalog')}
              onRateActivity={(item) => setRatingItem(item)}
            />
          )}
        </div>
      </div>

      {/* Dynamic QR Pass Modal (KAN-353) */}
      {selectedPassItem && (
        <ActivityPassModal
          isOpen={true}
          onClose={() => setSelectedPassItem(null)}
          activityId={selectedPassItem.eventId}
          passengerId={selectedPassItem.passengerId}
          activityTitle={selectedPassItem.title}
        />
      )}

      {/* In-App Notification Center Drawer (KAN-366) */}
      <NotificationCenterDrawer
        passengerId={passengerId}
        isOpen={isNotificationOpen}
        onClose={() => {
          setIsNotificationOpen(false);
          loadNotificationsSummary();
        }}
        onNavigate={(url) => {
          setIsNotificationOpen(false);
          navigate(url);
        }}
      />

      {/* Post-Activity CSAT Feedback Modal (KAN-367) */}
      {ratingItem && (
        <ActivityFeedbackModal
          isOpen={true}
          activityId={ratingItem.eventId}
          activityTitle={ratingItem.title}
          passengerId={ratingItem.passengerId}
          onClose={() => setRatingItem(null)}
          onSuccess={() => {
            // Callback when rating is completed
          }}
        />
      )}
    </div>
  );
};

export default MySchedulePage;
