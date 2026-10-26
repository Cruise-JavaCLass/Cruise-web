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
      className={`group relative flex flex-col justify-between border border-[#E5E0D7] bg-white p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#102A43]/40 transition-all duration-200 text-[#252B32] ${
        item.isSoldOut ? 'opacity-85' : ''
      }`}
    >
      <div>
        {/* Header badges */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-lg ${
                isExcursion
                  ? 'bg-[#397C80]/15 text-[#397C80] border border-[#397C80]/30'
                  : 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20'
              }`}
            >
              {isExcursion ? <Compass className="h-3 w-3" /> : <Ship className="h-3 w-3" />}
              {isExcursion ? 'Tour trên bờ' : 'Trên tàu'}
            </span>
            <span className="border border-[#E5E0D7] bg-[#F7F4ED] px-2 py-0.5 text-xs font-semibold uppercase text-[#102A43] rounded-lg">
              Ngày {item.dayNumber}
            </span>
          </div>

          <div>
            {item.isIncluded ? (
              <span className="inline-flex items-center gap-1 border border-[#397C80]/30 bg-[#397C80]/15 px-2.5 py-0.5 text-xs font-bold uppercase text-[#397C80] rounded-lg">
                <CheckCircle2 className="h-3 w-3" /> Đã bao gồm
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 border border-[#C5A572]/30 bg-[#C5A572]/15 px-2.5 py-0.5 text-xs font-bold uppercase text-[#9E7A3E] rounded-lg">
                <Tag className="h-3 w-3" /> {item.price > 0 ? `${item.currency || '$'}${item.price.toFixed(2)}` : 'Tính phí'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-base sm:text-lg font-bold text-[#102A43] line-clamp-1 group-hover:text-[#397C80] transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        <p className="mb-4 text-xs font-normal text-[#5A6B7C] line-clamp-2">
          {item.description || 'Chưa có mô tả chi tiết cho hoạt động này.'}
        </p>

        {/* Info Grid */}
        <div className="space-y-2 border border-[#E5E0D7] bg-[#F7F4ED] p-3 rounded-xl text-xs font-medium text-[#252B32]">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#397C80]" />
            <span className="font-mono">
              {isExcursion
                ? `Tập trung: ${item.gatheringTime || item.startTime} • Về tàu: ${item.returnToShipTime || item.endTime}`
                : `${item.startTime} - ${item.endTime}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-[#C5A572]" />
            <span className="line-clamp-1">{item.locationOrPort}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-[#102A43]" />
            <span>
              {item.isSoldOut ? (
                <span className="font-bold text-rose-600">Đã hết chỗ</span>
              ) : (
                <span>
                  Còn trống: <strong className="font-bold text-[#397C80]">{item.remainingCapacity}</strong> / {item.maxCapacity} chỗ
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Button */}
      <div className="mt-5 border-t border-[#E5E0D7] pt-3">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className={`w-full py-2.5 text-center text-xs font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            item.isSoldOut
              ? 'bg-[#F7F4ED] text-[#5A6B7C] border border-[#E5E0D7] hover:bg-[#ECE7DC]'
              : 'bg-[#102A43] hover:bg-[#0B1F33] text-white shadow-sm'
          }`}
        >
          {item.isSoldOut ? 'Xem chi tiết (Hết chỗ)' : 'Xem chi tiết & Lịch trình'}
        </button>
      </div>
    </div>
  );
};
