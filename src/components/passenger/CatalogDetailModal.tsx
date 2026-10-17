import React from 'react';
import type { PassengerCatalogItem } from '../../services/passengerCatalogService';
import {
  X,
  Clock,
  MapPin,
  Users,
  Compass,
  Ship,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';

interface CatalogDetailModalProps {
  item: PassengerCatalogItem;
  onClose: () => void;
}

export const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({
  item,
  onClose
}) => {
  const isExcursion = item.itemType === 'SHORE_EXCURSION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-700 to-blue-600 p-6 text-white sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                isExcursion
                  ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                  : 'bg-cyan-400/20 text-cyan-200 border border-cyan-300/30'
              }`}
            >
              {isExcursion ? <Compass className="h-3.5 w-3.5" /> : <Ship className="h-3.5 w-3.5" />}
              {isExcursion ? 'Tour tham quan trên bờ' : 'Hoạt động trên du thuyền'}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium text-white">
              Ngày {item.dayNumber}
            </span>
          </div>

          <h2 className="text-xl font-black sm:text-2xl">{item.title}</h2>
          <p className="mt-1 text-xs text-indigo-100 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Ngày diễn ra: {item.activityDate}
          </p>
        </div>

        {/* Body Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6 sm:p-8">
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Giới thiệu chi tiết
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {item.description || 'Chưa có thông tin mô tả chi tiết cho hoạt động này.'}
            </p>
          </div>

          {/* Operational Timeline */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-500" />
              Lịch trình vận hành chi tiết
            </h4>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <span className="block text-xs text-slate-400">Giờ tập trung</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">
                  {item.gatheringTime || item.startTime}
                </span>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <span className="block text-xs text-slate-400">Giờ khởi hành</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {item.departureTime || item.startTime}
                </span>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                <span className="block text-xs text-slate-400">Giờ quay lại tàu</span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {item.returnToShipTime || item.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-rose-500 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Địa điểm / Cảng</span>
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{item.locationOrPort}</span>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-emerald-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sức chứa khả dụng</span>
              </div>
              {item.isSoldOut ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" /> Đã kín chỗ ({item.currentParticipants}/{item.maxCapacity})
                </span>
              ) : (
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  Còn {item.remainingCapacity} chỗ trống (Đã đăng ký: {item.currentParticipants})
                </span>
              )}
            </div>
          </div>

          {/* Pricing Policy */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chính sách chi phí</span>
                <div className="mt-1 flex items-center gap-2">
                  {item.isIncluded ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Miễn phí (Đã bao gồm trong vé du thuyền)
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                      Người lớn: ${item.price.toFixed(2)} {item.childPrice ? `• Trẻ em: $${item.childPrice.toFixed(2)}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <span className="rounded-full bg-slate-200/80 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {item.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-right dark:border-slate-700/60 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
