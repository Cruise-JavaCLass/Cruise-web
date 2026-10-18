import React from 'react';
import {
  Compass,
  Calendar,
  Clock,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import type { PassengerCatalogItem } from '../../services/passengerCatalogService';
import type { TourNotification } from '../../services/dailyItineraryService';
import { Link } from 'react-router-dom';

interface UpcomingActivitiesAndNotificationsProps {
  activities: PassengerCatalogItem[];
  notifications: TourNotification[];
  isLoading?: boolean;
}

export const UpcomingActivitiesAndNotifications: React.FC<UpcomingActivitiesAndNotificationsProps> = ({
  activities,
  notifications,
  isLoading = false,
}) => {
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toUpperCase()) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" /> Khẩn cấp
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Info className="w-3 h-3" /> Lưu ý
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <CheckCircle className="w-3 h-3" /> Thông tin
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse" data-testid="upcoming-loading-skeleton">
        <div className="h-64 rounded-3xl bg-white/[0.02] border border-white/5" />
        <div className="h-64 rounded-3xl bg-white/[0.02] border border-white/5" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Block 1: Hoạt động sắp diễn ra */}
      <div className="bg-[#030303]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hoạt Động Sắp Tới Hôm Nay</h3>
                <p className="text-[11px] text-slate-400">Chương trình trải nghiệm & giải trí onboard nổi bật</p>
              </div>
            </div>
            <Link
              to="/catalog"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Compass className="w-8 h-8 opacity-40" />
              <span>Chưa có hoạt động nào được lên lịch trong hôm nay.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 4).map((act) => (
                <div
                  key={`${act.itemType}-${act.id}`}
                  className="group bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 rounded-2xl p-3.5 transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {act.category}
                      </span>
                      {act.isIncluded ? (
                        <span className="text-[10px] font-bold text-emerald-400">Miễn phí</span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400">
                          {act.price} {act.currency || 'USD'}
                        </span>
                      )}
                      {act.isSoldOut && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                          Hết chỗ
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1 font-mono text-cyan-400">
                        <Clock className="w-3 h-3" />
                        {act.startTime} - {act.endTime}
                      </span>
                      <span>•</span>
                      <span>{act.locationOrPort}</span>
                    </p>
                  </div>

                  <Link
                    to="/catalog"
                    className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
                    title="Chi tiết hoạt động"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Block 2: Thông báo & Cảnh báo an toàn lịch trình */}
      <div className="bg-[#030303]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thông Báo & Lịch Trình Phát Sóng</h3>
                <p className="text-[11px] text-slate-400">Cập nhật khẩn cấp, cảnh báo thời tiết và giờ All-Aboard</p>
              </div>
            </div>
            <Link
              to="/itinerary"
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
            >
              Hải trình <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Bell className="w-8 h-8 opacity-40" />
              <span>Hiện không có thông báo hay cảnh báo mới từ trung tâm điều hành.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-3.5 space-y-2 hover:border-white/15 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white truncate">{item.subject}</span>
                    {getUrgencyBadge(item.urgency)}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.message}</p>
                  {item.dayNumber && (
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 pt-1 border-t border-white/5">
                      <span>Áp dụng: Ngày {item.dayNumber}</span>
                      {item.tourCode && <span>• Tour {item.tourCode}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
