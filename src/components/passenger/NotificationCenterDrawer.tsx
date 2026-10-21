import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Clock,
  Info,
  Tag,
  ExternalLink,
} from 'lucide-react';
import {
  passengerNotificationService,
  type PassengerNotificationDto,
  type NotificationCategory,
  type NotificationSummaryDto,
} from '../../services/passengerNotificationService';

interface NotificationCenterDrawerProps {
  passengerId: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

export const NotificationCenterDrawer: React.FC<NotificationCenterDrawerProps> = ({
  passengerId,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [notifications, setNotifications] = useState<PassengerNotificationDto[]>([]);
  const [summary, setSummary] = useState<NotificationSummaryDto>({
    totalUnread: 0,
    criticalUnread: 0,
    unreadByCategory: {},
  });
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const catParam = activeCategory === 'ALL' ? undefined : activeCategory;
      const [list, sum] = await Promise.all([
        passengerNotificationService.getNotifications(passengerId, catParam),
        passengerNotificationService.getNotificationSummary(passengerId),
      ]);
      setNotifications(list);
      setSummary(sum);
    } catch (err: unknown) {
      setError('Không thể tải danh sách thông báo. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [passengerId, activeCategory]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleMarkAsRead = async (notifId: number) => {
    try {
      await passengerNotificationService.markAsRead(passengerId, notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      setSummary((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
      }));
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await passengerNotificationService.markAllAsRead(passengerId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setSummary((prev) => ({
        ...prev,
        totalUnread: 0,
        criticalUnread: 0,
        unreadByCategory: {},
      }));
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const getCategoryBadge = (category: NotificationCategory) => {
    switch (category) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> KHẨN CẤP
          </span>
        );
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> VẬN HÀNH
          </span>
        );
      case 'REMINDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <Info className="w-3 h-3" /> NHẮC NHỞ
          </span>
        );
      case 'PROMOTIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <Tag className="w-3 h-3" /> ƯU ĐÃI
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end"
      data-testid="notification-center-drawer"
    >
      <div className="w-full max-w-md bg-[#0a0f1d] border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bell className="w-5 h-5" />
              </div>
              {summary.totalUnread > 0 && (
                <span
                  data-testid="unread-badge-counter"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-[#0a0f1d]"
                >
                  {summary.totalUnread > 99 ? '99+' : summary.totalUnread}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Trung Tâm Thông Báo
              </h2>
              <p className="text-xs text-slate-400">
                {summary.totalUnread} thông báo chưa đọc
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary.totalUnread > 0 && (
              <button
                onClick={() => void handleMarkAllAsRead()}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Đọc tất cả
              </button>
            )}
            <button
              onClick={onClose}
              data-testid="close-drawer-button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-white/5 flex gap-1.5 overflow-x-auto bg-black/20">
          {(['ALL', 'CRITICAL', 'OPERATIONAL', 'REMINDER', 'PROMOTIONAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat === 'ALL' && 'Tất cả'}
              {cat === 'CRITICAL' && 'Khẩn cấp'}
              {cat === 'OPERATIONAL' && 'Vận hành'}
              {cat === 'REMINDER' && 'Nhắc nhở'}
              {cat === 'PROMOTIONAL' && 'Ưu đãi'}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="space-y-3" data-testid="notifications-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
              {error}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Không có thông báo nào</p>
            </div>
          )}

          {!isLoading &&
            notifications.map((notif) => (
              <div
                key={notif.id}
                data-testid={`notification-item-${notif.id}`}
                className={`p-3.5 rounded-2xl border transition-all ${
                  notif.isRead
                    ? 'bg-white/[0.02] border-white/5 text-slate-400'
                    : notif.category === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-500/30 text-white shadow-lg shadow-rose-950/20'
                    : 'bg-white/[0.05] border-cyan-500/30 text-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(notif.category)}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-white mb-1">{notif.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{notif.message}</p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  {notif.actionUrl ? (
                    <button
                      onClick={() => {
                        if (!notif.isRead) {
                          void handleMarkAsRead(notif.id);
                        }
                        if (onNavigate) onNavigate(notif.actionUrl!);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium hover:underline"
                    >
                      Xem chi tiết <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : <span />}

                  {!notif.isRead && (
                    <button
                      onClick={() => void handleMarkAsRead(notif.id)}
                      data-testid={`mark-read-btn-${notif.id}`}
                      className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
