import React from 'react';
import {
  Clock,
  MapPin,
  QrCode,
  Compass,
  Sparkles,
  User,
  ShieldAlert,
  ChevronRight,
  Star,
} from 'lucide-react';
import type { PersonalScheduleItem } from '../../services/passengerScheduleService';
import { MaritimeLottie } from '../common/MaritimeLottie';

interface MyScheduleTimelineProps {
  items: PersonalScheduleItem[];
  onOpenPass: (item: PersonalScheduleItem) => void;
  onBrowseCatalog?: () => void;
  onRateActivity?: (item: PersonalScheduleItem) => void;
}

export const MyScheduleTimeline: React.FC<MyScheduleTimelineProps> = ({
  items,
  onOpenPass,
  onBrowseCatalog,
  onRateActivity,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-16 px-6 text-center bg-white border border-[#E5E0D7] rounded-2xl shadow-sm">
        <div className="w-20 h-20 mx-auto mb-4">
          <MaritimeLottie variant="waves" className="w-full h-full" title="Sóng biển yên bình" />
        </div>
        <h3 className="text-xl font-display font-bold uppercase text-[#102A43] mb-2 tracking-wide">
          Chưa có lịch trình cho ngày này
        </h3>
        <p className="text-xs text-[#252B32]/70 max-w-md mx-auto mb-6 leading-relaxed">
          Bạn chưa đăng ký hoạt động giải trí trên tàu hoặc tour tham quan bờ nào trong ngày đã chọn. Khám phá ngay các trải nghiệm thú vị trong hải trình!
        </p>
        {onBrowseCatalog && (
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          >
            <span>Khám phá Danh mục Hoạt động</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold uppercase tracking-wider">
            Đã điểm danh
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7] text-xs font-semibold uppercase tracking-wider">
            Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold uppercase tracking-wider">
            Đã hủy
          </span>
        );
      case 'REGISTERED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#397C80] border border-teal-200 text-xs font-semibold uppercase tracking-wider">
            Đã đăng ký
          </span>
        );
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E5E0D7] space-y-6">
      {items.map((item, index) => {
        const isExcursion = item.itemType === 'EXCURSION';

        return (
          <div
            key={`schedule-item-${index}-${item.eventId}-${item.passengerId}`}
            className={`relative p-5 rounded-2xl border transition-all duration-200 shadow-sm ${
              item.hasConflict
                ? 'bg-amber-50/70 border-amber-300'
                : 'bg-white border-[#E5E0D7] hover:border-[#C5A572]'
            }`}
          >
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[32px] sm:-left-[41px] top-6 w-7 h-7 rounded-full border flex items-center justify-center text-xs shadow-xs ${
                item.hasConflict
                  ? 'bg-amber-500 text-white border-amber-300 animate-pulse'
                  : isExcursion
                  ? 'bg-[#F7F4ED] text-[#C5A572] border-[#C5A572]'
                  : 'bg-teal-50 text-[#397C80] border-teal-300'
              }`}
            >
              {isExcursion ? <Compass className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>

            {/* Header: Time, Type, Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F7F4ED] border border-[#E5E0D7] text-xs font-bold text-[#102A43]">
                  <Clock className="w-3.5 h-3.5 text-[#397C80]" />
                  <span>
                    {item.startTime} - {item.endTime}
                  </span>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                    isExcursion
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-teal-50 text-[#397C80] border border-teal-200'
                  }`}
                >
                  {isExcursion ? 'Tour trên bờ' : 'Hoạt động tàu'}
                </span>

                <span className="text-xs uppercase text-[#252B32]/70 font-medium">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(item.status)}
              </div>
            </div>

            {/* Title & Location */}
            <div className="mb-3">
              <h4 className="text-lg sm:text-xl font-display font-bold uppercase tracking-tight text-[#102A43]">
                {item.title}
              </h4>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#252B32]/70 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A572]" />
                  <span className="text-[#252B32]">{item.location}</span>
                </div>
                {item.deck && (
                  <span className="rounded bg-[#F7F4ED] border border-[#E5E0D7] px-2 py-0.5 text-[11px] font-medium text-[#102A43]">
                    {item.deck}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-[#252B32] font-medium">
                  <User className="w-3.5 h-3.5 text-[#252B32]/60" />
                  <span>{item.passengerName}</span>
                  <span className="text-xs text-[#252B32]/60">({item.cabinNumber})</span>
                </div>
              </div>
            </div>

            {/* Assembly Time Warning Banner (for Excursions) */}
            {item.assemblyWarning && (
              <div className="mb-3 p-3 rounded-xl bg-teal-50/80 border border-teal-200 flex items-start gap-2.5 text-xs text-teal-900">
                <Clock className="w-4 h-4 text-[#397C80] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#397C80] uppercase">Giờ tập trung: </span>
                  <span>{item.assemblyWarning}</span>
                </div>
              </div>
            )}

            {/* Conflict Alert on Event */}
            {item.hasConflict && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-xs text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase">Cảnh báo trùng giờ: </span>
                  <span>{item.conflictReason}</span>
                </div>
              </div>
            )}

            {/* Footer with Price & Actions */}
            <div className="pt-3 border-t border-[#E5E0D7] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                {item.isIncluded ? (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-800 text-[11px] font-semibold uppercase">
                    Đã bao gồm trong tour
                  </span>
                ) : (
                  <span className="text-[#252B32]/70">
                    Giá vé: <strong className="text-[#102A43] font-bold">${item.price}</strong>
                  </span>
                )}
                {item.ticketCode && (
                  <span className="text-[11px] text-[#252B32]/60">
                    Mã: {item.ticketCode}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Rate Activity button for COMPLETED items (KAN-367) */}
                {item.status === 'COMPLETED' && onRateActivity && (
                  <button
                    type="button"
                    onClick={() => onRateActivity(item)}
                    data-testid={`rate-activity-btn-${item.eventId}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#102A43] text-white text-xs font-semibold uppercase tracking-wider transition-all hover:bg-[#0B1F33] shadow-sm cursor-pointer"
                    aria-label={`Đánh giá trải nghiệm cho ${item.title}`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Đánh giá trải nghiệm</span>
                  </button>
                )}

                {/* Show Pass button (KAN-353) */}
                {item.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => onOpenPass(item)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] hover:border-[#397C80] text-xs font-semibold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                    aria-label={`Xem thẻ QR cho ${item.title}`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#397C80]" />
                    <span>Xem vé QR</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyScheduleTimeline;
