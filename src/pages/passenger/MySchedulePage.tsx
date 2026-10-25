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
    <div
      data-theme="passenger-retro"
      className="min-h-screen bg-[#070B16] text-[#F4F4F0] p-4 sm:p-6 lg:p-8 font-sans bg-[linear-gradient(to_right,rgba(66,232,245,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(66,232,245,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"
    >
      {/* Top Banner Navigation & Breadcrumb */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#42E8F5]/20">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/passenger')}
              className="p-2.5 rounded-lg border border-[#42E8F5]/30 bg-[#151F33] text-[#42E8F5] hover:bg-[#10182A] transition-all cursor-pointer"
              aria-label="Quay lại trang chính"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-black tracking-wide uppercase text-[#F4F4F0]">
                  Lịch Trình Cá Nhân (My Day)
                </h1>
                {isOffline && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FFBD59]/20 text-[#FFBD59] border border-[#FFBD59]/40 text-xs font-mono font-bold uppercase"
                    title="Đang xem dữ liệu lưu trong bộ nhớ thiết bị"
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Ngoại tuyến {lastUpdated && `• Cập nhật ${lastUpdated}`}</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-[#A7B4C9] uppercase tracking-wider mt-0.5">
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
              className="relative p-2.5 rounded-lg border border-[#42E8F5]/30 bg-[#151F33] text-[#42E8F5] hover:bg-[#10182A] transition-all cursor-pointer"
              title="Mở trung tâm thông báo"
            >
              <Bell className="w-4 h-4 text-[#42E8F5]" />
              {unreadNotificationCount > 0 && (
                <span
                  data-testid="header-unread-counter"
                  className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-rose-600 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center px-1 border border-[#070B16]"
                >
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={loadSchedule}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#42E8F5]/30 bg-[#151F33] hover:bg-[#10182A] text-[#42E8F5] text-xs font-mono font-bold uppercase transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4169FF] text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#3458db] shadow-lg shadow-[#4169FF]/20 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Duyệt Hoạt Động</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Cabin Scope Toggle & Day Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#10182A] border border-[#42E8F5]/25 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => handleDayChange(undefined)}
              className={`px-4 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedDay === undefined
                  ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/50 shadow-[0_0_10px_rgba(66,232,245,0.2)]'
                  : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
              }`}
            >
              Toàn bộ hải trình
            </button>
            {[1, 2, 3, 4, 5].map((day) => (
              <button
                key={`day-tab-${day}`}
                type="button"
                onClick={() => handleDayChange(day)}
                className={`px-4 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedDay === day
                    ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/50 shadow-[0_0_10px_rgba(66,232,245,0.2)]'
                    : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
                }`}
              >
                Ngày {day}
              </button>
            ))}
          </div>

          {/* Scope Toggle: My Schedule vs Cabin Schedule */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#10182A] border border-[#42E8F5]/25">
            <button
              type="button"
              onClick={() => handleScopeChange('my')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                scope === 'my'
                  ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/50 shadow-[0_0_10px_rgba(66,232,245,0.2)]'
                  : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Chỉ lịch của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('cabin')}
              className={`inline-flex items-center gap-2 px-4 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                scope === 'cabin'
                  ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/50 shadow-[0_0_10px_rgba(66,232,245,0.2)]'
                  : 'text-[#A7B4C9] hover:text-[#F4F4F0]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cả cabin ({scheduleData?.cabinNumber || 'Phòng'})</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-[#151F33] border border-[#42E8F5]/25 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-[#A7B4C9] mb-1">
              <span>Tổng sự kiện</span>
              <Calendar className="w-4 h-4 text-[#42E8F5]" />
            </div>
            <div className="font-mono text-3xl font-bold text-[#F4F4F0]">{totalEvents}</div>
          </div>

          <div className="p-4 bg-[#151F33] border border-[#42E8F5]/25 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-[#A7B4C9] mb-1">
              <span>Đã check-in</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono text-3xl font-bold text-emerald-400">{checkedInCount}</div>
          </div>

          <div className="p-4 bg-[#151F33] border border-[#42E8F5]/25 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono uppercase text-[#A7B4C9] mb-1">
              <span>Chờ tham gia</span>
              <Clock className="w-4 h-4 text-[#42E8F5]" />
            </div>
            <div className="font-mono text-3xl font-bold text-[#42E8F5]">{pendingCount}</div>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-colors shadow-lg ${
              totalConflicts > 0
                ? 'bg-amber-950/40 border-amber-500/60 text-[#FFBD59]'
                : 'bg-[#151F33] border-[#42E8F5]/25 text-[#A7B4C9]'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono uppercase mb-1">
              <span>Trùng lịch</span>
              <AlertTriangle
                className={`w-4 h-4 ${totalConflicts > 0 ? 'text-[#FFBD59]' : 'text-[#A7B4C9]'}`}
              />
            </div>
            <div className={`font-mono text-3xl font-bold ${totalConflicts > 0 ? 'text-[#FFBD59]' : 'text-[#F4F4F0]'}`}>
              {totalConflicts}
            </div>
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
              <RefreshCw className="w-8 h-8 text-[#42E8F5] animate-spin" />
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#A7B4C9]">
                Đang tải lịch trình cá nhân...
              </p>
            </div>
          ) : errorMessage && !scheduleData ? (
            <div className="p-6 bg-[#151F33] border border-rose-500/50 rounded-2xl text-center shadow-xl">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <p className="text-sm font-mono text-rose-300 font-semibold">{errorMessage}</p>
              <button
                type="button"
                onClick={loadSchedule}
                className="mt-4 px-5 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/40 text-xs font-mono font-bold uppercase cursor-pointer"
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
