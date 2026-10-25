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
  Calendar,
  Star,
} from 'lucide-react';
import type { PersonalScheduleItem } from '../../services/passengerScheduleService';

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
      <div className="py-16 px-6 text-center border-2 border-[#171717] bg-white shadow-[6px_6px_0px_#171717] dark:bg-slate-800">
        <div className="w-16 h-16 border-2 border-[#171717] bg-[#D9FF43] text-black flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0px_#171717]">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black uppercase text-[#171717] mb-2 dark:text-white">Chưa có lịch trình cho ngày này</h3>
        <p className="text-sm font-medium text-neutral-600 max-w-md mx-auto mb-6 dark:text-neutral-400">
          Bạn chưa đăng ký hoạt động giải trí trên tàu hoặc tour tham quan bờ nào trong ngày đã chọn. Khám phá ngay các trải nghiệm thú vị trong hải trình!
        </p>
        {onBrowseCatalog && (
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#171717] bg-[#3155E7] text-white font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#171717] hover:bg-blue-700 transition-all active:translate-x-[1px] active:translate-y-[1px]"
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
          <span className="px-2.5 py-0.5 border border-black bg-[#D9FF43] text-black text-xs font-black uppercase tracking-wider shadow-[1px_1px_0px_#171717]">
            Đã điểm danh
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 border border-black bg-[#E7E4DC] text-black text-xs font-black uppercase tracking-wider shadow-[1px_1px_0px_#171717] dark:bg-slate-700 dark:text-white">
            Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 border border-black bg-[#DC2626] text-white text-xs font-black uppercase tracking-wider shadow-[1px_1px_0px_#171717]">
            Đã hủy
          </span>
        );
      case 'REGISTERED':
      default:
        return (
          <span className="px-2.5 py-0.5 border border-black bg-[#3155E7] text-white text-xs font-black uppercase tracking-wider shadow-[1px_1px_0px_#171717]">
            Đã đăng ký
          </span>
        );
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-1 before:bg-[#171717] dark:before:bg-slate-700 space-y-6">
      {items.map((item, index) => {
        const isExcursion = item.itemType === 'EXCURSION';

        return (
          <div
            key={`schedule-item-${index}-${item.eventId}-${item.passengerId}`}
            className={`relative border-2 border-[#171717] p-5 shadow-[4px_4px_0px_#171717] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#171717] ${
              item.hasConflict
                ? 'bg-amber-100 border-amber-600'
                : 'bg-white dark:bg-slate-800'
            }`}
          >
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[32px] sm:-left-[41px] top-6 w-7 h-7 border-2 border-[#171717] flex items-center justify-center text-xs shadow-[2px_2px_0px_#171717] ${
                item.hasConflict
                  ? 'bg-amber-400 text-black animate-pulse'
                  : isExcursion
                  ? 'bg-[#3155E7] text-white'
                  : 'bg-[#D9FF43] text-black'
              }`}
            >
              {isExcursion ? <Compass className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>

            {/* Header: Time, Type, Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 border-2 border-[#171717] bg-[#F7F5F0] font-mono text-xs font-black text-black shadow-[1px_1px_0px_#171717] dark:bg-slate-900 dark:text-white">
                  <Clock className="w-3.5 h-3.5 text-[#3155E7]" />
                  <span>
                    {item.startTime} - {item.endTime}
                  </span>
                </div>

                <span
                  className={`border border-[#171717] px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-[1px_1px_0px_#171717] ${
                    isExcursion
                      ? 'bg-amber-300 text-black'
                      : 'bg-cyan-300 text-black'
                  }`}
                >
                  {isExcursion ? 'Tour trên bờ' : 'Hoạt động tàu'}
                </span>

                <span className="text-xs font-bold uppercase text-neutral-500">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(item.status)}
              </div>
            </div>

            {/* Title & Location */}
            <div className="mb-3">
              <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#171717] dark:text-white">
                {item.title}
              </h4>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-600 mt-1.5 dark:text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>{item.location}</span>
                </div>
                {item.deck && (
                  <span className="font-mono border border-black bg-[#E7E4DC] px-2 py-0.5 text-[11px] text-black dark:bg-slate-700 dark:text-white">
                    {item.deck}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-black font-bold dark:text-white">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{item.passengerName}</span>
                  <span className="font-mono text-xs text-neutral-500">({item.cabinNumber})</span>
                </div>
              </div>
            </div>

            {/* Assembly Time Warning Banner (for Excursions) */}
            {item.assemblyWarning && (
              <div className="mb-3 p-3 border-2 border-[#171717] bg-blue-100 flex items-start gap-2.5 text-xs text-black shadow-[2px_2px_0px_#171717]">
                <Clock className="w-4 h-4 text-[#3155E7] shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase">Giờ tập trung: </span>
                  <span className="font-medium">{item.assemblyWarning}</span>
                </div>
              </div>
            )}

            {/* Conflict Alert on Event */}
            {item.hasConflict && (
              <div className="mb-3 p-3 border-2 border-[#171717] bg-amber-200 flex items-start gap-2.5 text-xs text-black shadow-[2px_2px_0px_#171717]">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black uppercase text-rose-700">Cảnh báo trùng giờ: </span>
                  <span className="font-bold">{item.conflictReason}</span>
                </div>
              </div>
            )}

            {/* Footer with Price & Actions */}
            <div className="pt-3 border-t-2 border-dashed border-[#171717] flex flex-wrap items-center justify-between gap-3 dark:border-slate-700">
              <div className="flex items-center gap-2 text-xs">
                {item.isIncluded ? (
                  <span className="border border-black bg-[#D9FF43] px-2 py-0.5 text-black font-black uppercase text-[11px] shadow-[1px_1px_0px_#171717]">
                    Đã bao gồm trong tour
                  </span>
                ) : (
                  <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">
                    Giá vé: <strong className="text-black font-black dark:text-white">${item.price}</strong>
                  </span>
                )}
                {item.ticketCode && (
                  <span className="font-mono text-[11px] font-bold text-neutral-500">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border-2 border-[#171717] bg-amber-300 text-black text-xs font-black uppercase shadow-[2px_2px_0px_#171717] transition-all hover:bg-amber-400 active:translate-x-[1px] active:translate-y-[1px]"
                    aria-label={`Đánh giá trải nghiệm cho ${item.title}`}
                  >
                    <Star className="w-3.5 h-3.5 fill-black text-black" />
                    <span>Đánh giá trải nghiệm</span>
                  </button>
                )}

                {/* Show Pass button (KAN-353) */}
                {item.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => onOpenPass(item)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 border-2 border-[#171717] bg-[#171717] text-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#171717] hover:bg-[#3155E7] transition-all active:translate-x-[1px] active:translate-y-[1px]"
                    aria-label={`Xem thẻ QR cho ${item.title}`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
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
