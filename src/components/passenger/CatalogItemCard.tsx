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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:bg-slate-800 ${
        item.isSoldOut
          ? 'border-slate-200 opacity-80 dark:border-slate-700'
          : 'border-slate-200/80 hover:border-indigo-400 dark:border-slate-700/80'
      }`}
    >
      <div>
        {/* Header badges */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isExcursion
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
              }`}
            >
              {isExcursion ? <Compass className="h-3 w-3" /> : <Ship className="h-3 w-3" />}
              {isExcursion ? 'Tour trên bờ' : 'Trên tàu'}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              Ngày {item.dayNumber}
            </span>
          </div>

          <div>
            {item.isIncluded ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Đã bao gồm
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                <Tag className="h-3 w-3" /> {item.price > 0 ? `$${item.price.toFixed(2)}` : 'Tính phí'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
          {item.title}
        </h3>

        {/* Description */}
        <p className="mb-4 text-sm text-slate-500 line-clamp-2 dark:text-slate-400">
          {item.description || 'Chưa có mô tả chi tiết cho hoạt động này.'}
        </p>

        {/* Info Grid */}
        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-indigo-500" />
            <span>
              {isExcursion
                ? `Tập trung: ${item.gatheringTime || item.startTime} • Về tàu: ${item.returnToShipTime || item.endTime}`
                : `${item.startTime} - ${item.endTime}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-rose-500" />
            <span className="line-clamp-1">{item.locationOrPort}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {item.isSoldOut ? (
                <span className="font-semibold text-rose-600 dark:text-rose-400">Đã hết chỗ</span>
              ) : (
                <span>
                  Còn trống: <strong className="text-emerald-600 dark:text-emerald-400">{item.remainingCapacity}</strong> / {item.maxCapacity} chỗ
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className={`w-full rounded-xl py-2 text-center text-xs font-semibold transition-all ${
            item.isSoldOut
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
              : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow dark:bg-indigo-500 dark:hover:bg-indigo-600'
          }`}
        >
          {item.isSoldOut ? 'Xem chi tiết (Hết chỗ)' : 'Xem chi tiết & Lịch trình'}
        </button>
      </div>
    </div>
  );
};
