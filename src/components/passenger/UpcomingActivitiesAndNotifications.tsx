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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Khẩn cấp
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <Info className="w-3 h-3 text-amber-700" /> Lưu ý
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-[#397C80] border border-teal-200">
            <CheckCircle className="w-3 h-3 text-[#397C80]" /> Thông tin
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse" data-testid="upcoming-loading-skeleton">
        <div className="h-64 rounded-3xl bg-[#F7F4ED] border border-[#E5E0D7]" />
        <div className="h-64 rounded-3xl bg-[#F7F4ED] border border-[#E5E0D7]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Block 1: Hoạt động sắp diễn ra */}
      <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D7] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#397C80]">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#102A43] uppercase tracking-wider">Hoạt Động Sắp Tới Hôm Nay</h3>
                <p className="text-[11px] text-[#252B32]/70">Chương trình trải nghiệm & giải trí onboard nổi bật</p>
              </div>
            </div>
            <Link
              to="/catalog"
              className="text-xs font-semibold text-[#397C80] hover:text-[#2D6468] flex items-center gap-1 hover:underline"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activities.length === 0 ? (
            <div className="py-10 text-center text-[#252B32]/60 text-xs flex flex-col items-center justify-center gap-2">
              <Compass className="w-8 h-8 opacity-40 text-[#252B32]" />
              <span>Chưa có hoạt động nào được lên lịch trong hôm nay.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 4).map((act) => (
                <div
                  key={`${act.itemType}-${act.id}`}
                  className="group bg-[#F7F4ED]/60 hover:bg-[#F7F4ED] border border-[#E5E0D7] hover:border-[#C5A572] rounded-2xl p-3.5 transition-all flex items-start justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-[#102A43] border border-[#E5E0D7]">
                        {act.category}
                      </span>
                      {act.isIncluded ? (
                        <span className="text-[10px] font-semibold text-emerald-700">Miễn phí</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800">
                          {act.price} {act.currency || 'USD'}
                        </span>
                      )}
                      {act.isSoldOut && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Hết chỗ
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[#102A43] group-hover:text-[#397C80] transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-[#252B32]/70 flex items-center gap-3">
                      <span className="flex items-center gap-1 font-semibold text-[#397C80]">
                        <Clock className="w-3 h-3" />
                        {act.startTime} - {act.endTime}
                      </span>
                      <span>•</span>
                      <span>{act.locationOrPort}</span>
                    </p>
                  </div>

                  <Link
                    to="/catalog"
                    className="p-2 rounded-xl bg-white hover:bg-[#E5E0D7] text-[#102A43] border border-[#E5E0D7] transition-colors shrink-0 shadow-xs"
                    title="Chi tiết hoạt động"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#397C80]" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Block 2: Thông báo & Cảnh báo an toàn lịch trình */}
      <div className="bg-white border border-[#E5E0D7] rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D7] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#102A43] uppercase tracking-wider">Thông Báo & Lịch Trình Phát Sóng</h3>
                <p className="text-[11px] text-[#252B32]/70">Cập nhật khẩn cấp, cảnh báo thời tiết và giờ All-Aboard</p>
              </div>
            </div>
            <Link
              to="/itinerary"
              className="text-xs font-semibold text-[#397C80] hover:text-[#2D6468] flex items-center gap-1 hover:underline"
            >
              Hải trình <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center text-[#252B32]/60 text-xs flex flex-col items-center justify-center gap-2">
              <Bell className="w-8 h-8 opacity-40 text-[#252B32]" />
              <span>Hiện không có thông báo hay cảnh báo mới từ trung tâm điều hành.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-2xl p-3.5 space-y-2 hover:border-[#C5A572] transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#102A43] truncate">{item.subject}</span>
                    {getUrgencyBadge(item.urgency)}
                  </div>
                  <p className="text-xs text-[#252B32]/80 leading-relaxed">{item.message}</p>
                  {item.dayNumber && (
                    <div className="text-[10px] text-[#252B32]/60 flex items-center gap-2 pt-1 border-t border-[#E5E0D7]">
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
