import React from 'react';
import type { PassengerCatalogItem } from '../../services/passengerCatalogService';
import { Clock, MapPin, Users, Tag, Compass, Ship, CheckCircle2 } from 'lucide-react';

interface CatalogItemCardProps {
  item: PassengerCatalogItem;
  onSelect: (item: PassengerCatalogItem) => void;
}

export const CatalogItemCard: React.FC<CatalogItemCardProps> = ({ item, onSelect }) => {
  const isExcursion = item.itemType === 'SHORE_EXCURSION';

  return (
    <div
      role="article"
      aria-label={item.title}
      className={`group relative flex flex-col justify-between border-2 border-[#171717] bg-white p-5 shadow-[4px_4px_0px_#171717] transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#171717] dark:bg-slate-800 ${
        item.isSoldOut ? 'opacity-85' : ''
      }`}
    >
      <div>
        {/* Header badges */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 border border-[#171717] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#171717] ${
                isExcursion
                  ? 'bg-amber-300 text-black'
                  : 'bg-cyan-300 text-black'
              }`}
            >
              {isExcursion ? <Compass className="h-3 w-3" /> : <Ship className="h-3 w-3" />}
              {isExcursion ? 'Tour trên bờ' : 'Trên tàu'}
            </span>
            <span className="border border-[#171717] bg-[#E7E4DC] px-2 py-0.5 text-xs font-black uppercase text-black dark:bg-slate-700 dark:text-white">
              Ngày {item.dayNumber}
            </span>
          </div>

          <div>
            {item.isIncluded ? (
              <span className="inline-flex items-center gap-1 border border-[#171717] bg-[#D9FF43] px-2.5 py-0.5 text-xs font-black uppercase text-black shadow-[2px_2px_0px_#171717]">
                <CheckCircle2 className="h-3 w-3" /> Đã bao gồm
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 border border-[#171717] bg-[#3155E7] px-2.5 py-0.5 text-xs font-black uppercase text-white shadow-[2px_2px_0px_#171717]">
                <Tag className="h-3 w-3" /> {item.price > 0 ? `${item.currency || '$'}${item.price.toFixed(2)}` : 'Tính phí'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-black uppercase tracking-tight text-[#171717] line-clamp-1 group-hover:text-[#3155E7] dark:text-white dark:group-hover:text-[#D9FF43]">
          {item.title}
        </h3>

        {/* Description */}
        <p className="mb-4 text-xs font-medium text-neutral-600 line-clamp-2 dark:text-neutral-400">
          {item.description || 'Chưa có mô tả chi tiết cho hoạt động này.'}
        </p>

        {/* Info Grid */}
        <div className="space-y-2 border-2 border-[#171717] bg-[#F7F5F0] p-3 text-xs font-bold text-[#171717] dark:bg-slate-900/60 dark:text-neutral-300">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#3155E7]" />
            <span className="font-mono">
              {isExcursion
                ? `Tập trung: ${item.gatheringTime || item.startTime} • Về tàu: ${item.returnToShipTime || item.endTime}`
                : `${item.startTime} - ${item.endTime}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-rose-600" />
            <span className="line-clamp-1">{item.locationOrPort}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {item.isSoldOut ? (
                <span className="font-black text-rose-600 dark:text-rose-400">Đã hết chỗ</span>
              ) : (
                <span>
                  Còn trống: <strong className="font-black text-emerald-700 dark:text-emerald-400">{item.remainingCapacity}</strong> / {item.maxCapacity} chỗ
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="mt-5 border-t-2 border-[#171717] pt-3">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className={`w-full border-2 border-[#171717] py-2.5 text-center text-xs font-black uppercase tracking-wider transition-all active:translate-x-[1px] active:translate-y-[1px] ${
            item.isSoldOut
              ? 'bg-[#E7E4DC] text-neutral-700 shadow-[2px_2px_0px_#171717] hover:bg-[#d8d4c9] dark:bg-slate-700 dark:text-neutral-300'
              : 'bg-[#171717] text-white shadow-[3px_3px_0px_#171717] hover:bg-[#3155E7] hover:shadow-[4px_4px_0px_#171717]'
          }`}
        >
          {item.isSoldOut ? 'Xem chi tiết (Hết chỗ)' : 'Xem chi tiết & Lịch trình'}
        </button>
      </div>
    </div>
  );
};
