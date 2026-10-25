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
      <div className="py-16 px-6 text-center bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl shadow-[0_4px_24px_rgba(7,11,22,0.8)]">
        <div className="w-20 h-20 mx-auto mb-4">
          <MaritimeLottie variant="waves" className="w-full h-full" title="Sóng biển yên bình" />
        </div>
        <h3 className="text-xl font-display font-black uppercase text-[#F4F4F0] mb-2 tracking-wide">
          Chưa có lịch trình cho ngày này
        </h3>
        <p className="text-xs font-mono text-[#A7B4C9] max-w-md mx-auto mb-6 leading-relaxed">
          Bạn chưa đăng ký hoạt động giải trí trên tàu hoặc tour tham quan bờ nào trong ngày đã chọn. Khám phá ngay các trải nghiệm thú vị trong hải trình!
        </p>
        {onBrowseCatalog && (
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#42E8F5] hover:bg-[#32d8e5] text-[#070B16] font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#42E8F5]/20 transition-all cursor-pointer"
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
          <span className="px-2.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            Đã điểm danh
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded bg-[#10182A] text-[#A7B4C9] border border-[#42E8F5]/20 text-xs font-mono font-bold uppercase tracking-wider">
            Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            Đã hủy
          </span>
        );
      case 'REGISTERED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded bg-[#4169FF]/20 text-[#42E8F5] border border-[#42E8F5]/40 text-xs font-mono font-bold uppercase tracking-wider">
            Đã đăng ký
          </span>
        );
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#42E8F5]/30 space-y-6">
      {items.map((item, index) => {
        const isExcursion = item.itemType === 'EXCURSION';

        return (
          <div
            key={`schedule-item-${index}-${item.eventId}-${item.passengerId}`}
            className={`relative p-5 rounded-2xl border transition-all duration-200 shadow-lg ${
              item.hasConflict
                ? 'bg-amber-950/30 border-amber-500/60'
                : 'bg-[#151F33] border-[#42E8F5]/30 hover:border-[#42E8F5]/60'
            }`}
          >
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[32px] sm:-left-[41px] top-6 w-7 h-7 rounded-full border flex items-center justify-center text-xs shadow-md ${
                item.hasConflict
                  ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                  : isExcursion
                  ? 'bg-[#10182A] text-[#FFBD59] border-[#FFBD59]/60'
                  : 'bg-[#10182A] text-[#42E8F5] border-[#42E8F5]/60'
              }`}
            >
              {isExcursion ? <Compass className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            </div>

            {/* Header: Time, Type, Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#10182A] border border-[#42E8F5]/30 font-mono text-xs font-bold text-[#42E8F5]">
                  <Clock className="w-3.5 h-3.5 text-[#42E8F5]" />
                  <span>
                    {item.startTime} - {item.endTime}
                  </span>
                </div>

                <span
                  className={`rounded px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase tracking-wider ${
                    isExcursion
                      ? 'bg-[#FFBD59]/20 text-[#FFBD59] border border-[#FFBD59]/40'
                      : 'bg-[#4169FF]/20 text-[#42E8F5] border border-[#42E8F5]/40'
                  }`}
                >
                  {isExcursion ? 'Tour trên bờ' : 'Hoạt động tàu'}
                </span>

                <span className="text-xs font-mono uppercase text-[#A7B4C9]">
                  {item.category}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(item.status)}
              </div>
            </div>

            {/* Title & Location */}
            <div className="mb-3">
              <h4 className="text-lg sm:text-xl font-display font-black uppercase tracking-tight text-[#F4F4F0]">
                {item.title}
              </h4>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#A7B4C9] mt-1.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FFBD59]" />
                  <span>{item.location}</span>
                </div>
                {item.deck && (
                  <span className="font-mono rounded bg-[#10182A] border border-[#42E8F5]/20 px-2 py-0.5 text-[11px] text-[#42E8F5]">
                    {item.deck}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-[#F4F4F0] font-medium">
                  <User className="w-3.5 h-3.5 text-[#A7B4C9]" />
                  <span>{item.passengerName}</span>
                  <span className="font-mono text-xs text-[#A7B4C9]">({item.cabinNumber})</span>
                </div>
              </div>
            </div>

            {/* Assembly Time Warning Banner (for Excursions) */}
            {item.assemblyWarning && (
              <div className="mb-3 p-3 rounded-xl bg-[#4169FF]/15 border border-[#4169FF]/30 flex items-start gap-2.5 text-xs text-[#F4F4F0]">
                <Clock className="w-4 h-4 text-[#42E8F5] shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-[#42E8F5] uppercase">Giờ tập trung: </span>
                  <span className="font-mono">{item.assemblyWarning}</span>
                </div>
              </div>
            )}

            {/* Conflict Alert on Event */}
            {item.hasConflict && (
              <div className="mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-xs text-[#FFBD59]">
                <ShieldAlert className="w-4 h-4 text-[#FFBD59] shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold uppercase">Cảnh báo trùng giờ: </span>
                  <span>{item.conflictReason}</span>
                </div>
              </div>
            )}

            {/* Footer with Price & Actions */}
            <div className="pt-3 border-t border-[#42E8F5]/15 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                {item.isIncluded ? (
                  <span className="rounded bg-emerald-950/40 border border-emerald-500/40 px-2 py-0.5 text-emerald-300 font-mono text-[11px] uppercase">
                    Đã bao gồm trong tour
                  </span>
                ) : (
                  <span className="font-mono text-[#A7B4C9]">
                    Giá vé: <strong className="text-[#F4F4F0] font-bold">${item.price}</strong>
                  </span>
                )}
                {item.ticketCode && (
                  <span className="font-mono text-[11px] text-[#A7B4C9]">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FFBD59] text-[#070B16] text-xs font-mono font-bold uppercase transition-all hover:bg-[#ffa929] cursor-pointer"
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
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#10182A] hover:bg-[#0c1221] text-[#42E8F5] border border-[#42E8F5]/40 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
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

export default MyScheduleTimeline;
