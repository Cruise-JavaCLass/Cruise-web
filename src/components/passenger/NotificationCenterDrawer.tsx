import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const requestSeqRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const catParam = activeCategory === 'ALL' ? undefined : activeCategory;
      const [list, sum] = await Promise.all([
        passengerNotificationService.getNotifications(passengerId, catParam),
        passengerNotificationService.getNotificationSummary(passengerId),
      ]);
      if (currentSeq !== requestSeqRef.current) return;
      setNotifications(list);
      setSummary(sum);
    } catch {
      if (currentSeq !== requestSeqRef.current) return;
      setError('Không thể tải danh sách thông báo. Vui lòng thử lại sau.');
    } finally {
      if (currentSeq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [passengerId, activeCategory]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleMarkAsRead = async (notifId: number) => {
    const target = notifications.find((n) => n.id === notifId);
    const wasUnread = target && !target.isRead;
    try {
      await passengerNotificationService.markAsRead(passengerId, notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      if (wasUnread) {
        setSummary((prev) => ({
          ...prev,
          totalUnread: Math.max(0, prev.totalUnread - 1),
        }));
      }
    } catch {
      setError('Không thể đánh dấu đã đọc. Vui lòng thử lại.');
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
      setError('Không thể đánh dấu đọc tất cả. Vui lòng thử lại.');
    }
  };

  if (!isOpen) return null;

  const getCategoryBadge = (category: NotificationCategory) => {
    switch (category) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
            <AlertTriangle className="w-3 h-3" /> KHẨN CẤP
          </span>
        );
      case 'OPERATIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> VẬN HÀNH
          </span>
        );
      case 'REMINDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#397C80] border border-teal-200">
            <Info className="w-3 h-3" /> NHẮC NHỞ
          </span>
        );
      case 'PROMOTIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C5A572]/15 text-[#9E7A3E] border border-[#C5A572]/30">
            <Tag className="w-3 h-3" /> ƯU ĐÃI
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#0B1F33]/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      data-testid="notification-center-drawer"
    >
      <div className="w-full max-w-md bg-white border-l border-[#E5E0D7] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 text-[#252B32]">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E0D7] flex items-center justify-center text-[#102A43] shadow-xs">
                <Bell className="w-5 h-5 text-[#397C80]" />
              </div>
              {summary.totalUnread > 0 && (
                <span
                  data-testid="unread-badge-counter"
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white"
                >
                  {summary.totalUnread > 99 ? '99+' : summary.totalUnread}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102A43] flex items-center gap-2">
                Trung Tâm Thông Báo
              </h2>
              <p className="text-xs text-[#5A6B7C]">
                {summary.totalUnread} thông báo chưa đọc
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary.totalUnread > 0 && (
              <button
                onClick={() => void handleMarkAllAsRead()}
                className="text-xs text-[#102A43] hover:text-[#0B1F33] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#ECE7DC] border border-[#E5E0D7] transition-colors cursor-pointer"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#397C80]" /> Đọc tất cả
              </button>
            )}
            <button
              onClick={onClose}
              data-testid="close-drawer-button"
              className="p-1.5 rounded-lg text-[#5A6B7C] hover:text-[#102A43] hover:bg-[#E5E0D7]/40 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-[#E5E0D7] flex gap-1.5 overflow-x-auto bg-[#F7F4ED]/50">
          {(['ALL', 'CRITICAL', 'OPERATIONAL', 'REMINDER', 'PROMOTIONAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'text-[#5A6B7C] hover:text-[#102A43] hover:bg-white'
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
                <div key={i} className="h-20 rounded-2xl bg-[#F7F4ED] animate-pulse border border-[#E5E0D7]" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#5A6B7C]">
              <Bell className="w-10 h-10 mb-2 opacity-30 text-[#102A43]" />
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
                    ? 'bg-[#F7F4ED]/50 border-[#E5E0D7]/60 text-[#5A6B7C]'
                    : notif.category === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-300 text-[#252B32] shadow-xs'
                    : 'bg-white border-[#E5E0D7] text-[#252B32] shadow-xs hover:border-[#102A43]/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(notif.category)}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#397C80] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] text-[#5A6B7C]">
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#102A43] mb-1">{notif.title}</h4>
                <p className="text-xs text-[#252B32] leading-relaxed mb-3">{notif.message}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D7]">
                  {notif.actionUrl ? (
                    <button
                      onClick={() => {
                        if (!notif.isRead) {
                          void handleMarkAsRead(notif.id);
                        }
                        if (onNavigate) onNavigate(notif.actionUrl!);
                      }}
                      className="text-xs text-[#397C80] hover:text-[#2D6468] flex items-center gap-1 font-semibold hover:underline cursor-pointer"
                    >
                      Xem chi tiết <ExternalLink className="w-3 h-3" />
                    </button>
                  ) : <span />}

                  {!notif.isRead && (
                    <button
                      onClick={() => void handleMarkAsRead(notif.id)}
                      data-testid={`mark-read-btn-${notif.id}`}
                      className="text-[11px] text-[#5A6B7C] hover:text-[#102A43] px-2 py-0.5 rounded-lg bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] transition-colors cursor-pointer"
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
