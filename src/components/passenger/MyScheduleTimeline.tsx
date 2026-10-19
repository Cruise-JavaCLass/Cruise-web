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
} from 'lucide-react';
import type { PersonalScheduleItem } from '../../services/passengerScheduleService';

interface MyScheduleTimelineProps {
  items: PersonalScheduleItem[];
  onOpenPass: (item: PersonalScheduleItem) => void;
  onBrowseCatalog?: () => void;
}

export const MyScheduleTimeline: React.FC<MyScheduleTimelineProps> = ({
  items,
  onOpenPass,
  onBrowseCatalog,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="py-16 px-6 text-center rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Chưa có lịch trình cho ngày này</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Bạn chưa đăng ký hoạt động giải trí trên tàu hoặc tour tham quan bờ nào trong ngày đã chọn. Khám phá ngay các trải nghiệm thú vị trong hải trình!
        </p>
        {onBrowseCatalog && (
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            Đã điểm danh
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-400">
            Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400">
            Đã hủy
          </span>
        );
      case 'REGISTERED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400">
            Đã đăng ký
          </span>
        );
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-transparent space-y-6">
      {items.map((item, index) => {
        const isExcursion = item.itemType === 'EXCURSION';

        return (
          <div
            key={`schedule-item-${index}-${item.eventId}-${item.passengerId}`}
            className={`relative rounded-2xl p-5 border backdrop-blur-xl transition-all duration-300 hover:translate-x-1 ${
              item.hasConflict
                ? 'bg-amber-950/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
            }`}
          >
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[31px] sm:-left-[39px] top-6 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                item.hasConflict
                  ? 'bg-amber-500 border-black text-black animate-pulse'
                  : isExcursion
                  ? 'bg-indigo-600 border-black text-white'
                  : 'bg-cyan-500 border-black text-black'
              }`}
            >
              {isExcursion ? <Compass className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            </div>

            {/* Header: Time, Type, Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/10 font-mono text-xs font-bold text-cyan-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {item.startTime} - {item.endTime}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                    isExcursion
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  {isExcursion ? 'Tour trên bờ' : 'Hoạt động tàu'}
                </span>

                <span className="text-xs text-slate-400 font-medium">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(item.status)}
              </div>
            </div>

            {/* Title & Location */}
            <div className="mb-3">
              <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {item.title}
              </h4>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.location}</span>
                </div>
                {item.deck && (
                  <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[11px] text-slate-300">
                    {item.deck}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.passengerName}</span>
                  <span className="font-mono text-xs text-slate-400">({item.cabinNumber})</span>
                </div>
              </div>
            </div>

            {/* Assembly Time Warning Banner (for Excursions) */}
            {item.assemblyWarning && (
              <div className="mb-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-200">
                <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-blue-300">Giờ tập trung: </span>
                  <span>{item.assemblyWarning}</span>
                </div>
              </div>
            )}

            {/* Conflict Alert on Event */}
            {item.hasConflict && (
              <div className="mb-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">Cảnh báo trùng giờ: </span>
                  <span>{item.conflictReason}</span>
                </div>
              </div>
            )}

            {/* Footer with Price & Actions */}
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                {item.isIncluded ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                    Đã bao gồm trong tour
                  </span>
                ) : (
                  <span className="font-mono text-slate-300">
                    Giá vé: <strong className="text-white">${item.price}</strong>
                  </span>
                )}
                {item.ticketCode && (
                  <span className="font-mono text-[11px] text-slate-500">
                    Mã: {item.ticketCode}
                  </span>
                )}
              </div>

              {/* Show Pass button (KAN-353) */}
              {item.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={() => onOpenPass(item)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-semibold shadow-sm transition-all hover:scale-105"
                  aria-label={`Xem thẻ QR cho ${item.title}`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Xem vé QR</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
