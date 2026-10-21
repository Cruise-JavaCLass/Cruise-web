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
    <div className="min-h-screen bg-[#000000] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-cyan-500/30">
      {/* Top Banner Navigation & Breadcrumb */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/passenger')}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all hover:scale-105"
              aria-label="Quay lại trang chính"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Lịch Trình Cá Nhân (My Day)
                </h1>
                {isOffline && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400"
                    title="Đang xem dữ liệu lưu trong bộ nhớ thiết bị"
                  >
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Ngoại tuyến {lastUpdated && `• Cập nhật ${lastUpdated}`}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
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
              className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
              title="Mở trung tâm thông báo"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {unreadNotificationCount > 0 && (
                <span
                  data-testid="header-unread-counter"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-black"
                >
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={loadSchedule}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Duyệt Hoạt Động</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Cabin Scope Toggle & Day Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => handleDayChange(undefined)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedDay === undefined
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Toàn bộ hải trình
            </button>
            {[1, 2, 3, 4, 5].map((day) => (
              <button
                key={`day-tab-${day}`}
                type="button"
                onClick={() => handleDayChange(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDay === day
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Ngày {day}
              </button>
            ))}
          </div>

          {/* Scope Toggle: My Schedule vs Cabin Schedule */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => handleScopeChange('my')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                scope === 'my'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Chỉ lịch của tôi</span>
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('cabin')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                scope === 'cabin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cả cabin ({scheduleData?.cabinNumber || 'Phòng'})</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Tổng sự kiện</span>
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-mono text-2xl font-bold text-white">{totalEvents}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Đã check-in</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-400">{checkedInCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Chờ tham gia</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="font-mono text-2xl font-bold text-blue-400">{pendingCount}</div>
          </div>

          <div
            className={`p-4 rounded-2xl border backdrop-blur-xl transition-colors ${
              totalConflicts > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-white/[0.03] border-white/10 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Trùng lịch</span>
              <AlertTriangle
                className={`w-4 h-4 ${totalConflicts > 0 ? 'text-amber-400' : 'text-slate-500'}`}
              />
            </div>
            <div className="font-mono text-2xl font-bold">{totalConflicts}</div>
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
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm text-slate-400">Đang tải lịch trình cá nhân...</p>
            </div>
          ) : errorMessage && !scheduleData ? (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-red-300">{errorMessage}</p>
              <button
                type="button"
                onClick={loadSchedule}
                className="mt-4 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
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
