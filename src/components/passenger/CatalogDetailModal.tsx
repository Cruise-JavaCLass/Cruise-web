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

import { ActivityRegistrationModal } from '../activities/ActivityRegistrationModal';

interface CatalogDetailModalProps {
  item: PassengerCatalogItem;
  onClose: () => void;
}

export const CatalogDetailModal: React.FC<CatalogDetailModalProps> = ({
  item,
  onClose
}) => {
  const [isRegisterOpen, setIsRegisterOpen] = React.useState<boolean>(false);
  const isExcursion = item.itemType === 'SHORE_EXCURSION';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRegisterOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isRegisterOpen]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-catalog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl border-4 border-[#171717] bg-[#F7F5F0] shadow-[8px_8px_0px_#171717] dark:bg-slate-900">
        {/* Header */}
        <div className="relative border-b-2 border-[#171717] bg-[#171717] p-6 text-white sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết"
            className="absolute top-5 right-5 border-2 border-white bg-white/10 p-2 text-white transition-colors hover:bg-[#DC2626] hover:border-black shadow-[2px_2px_0px_#000]"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1 border border-[#171717] px-3 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000] ${
                isExcursion
                  ? 'bg-amber-300 text-black'
                  : 'bg-cyan-300 text-black'
              }`}
            >
              {isExcursion ? <Compass className="h-3.5 w-3.5" /> : <Ship className="h-3.5 w-3.5" />}
              {isExcursion ? 'Tour tham quan trên bờ' : 'Hoạt động trên du thuyền'}
            </span>
            <span className="border border-white bg-white/20 px-2.5 py-1 text-xs font-black uppercase text-white">
              Ngày {item.dayNumber}
            </span>
          </div>

          <h2 id="modal-catalog-title" className="text-xl font-black uppercase sm:text-2xl">{item.title}</h2>
          <p className="mt-1 text-xs text-neutral-300 flex items-center gap-1.5 font-mono">
            <Calendar className="h-3.5 w-3.5" /> Ngày diễn ra: {item.activityDate}
          </p>
        </div>

        {/* Body Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6 sm:p-8">
          {/* Description */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Giới thiệu chi tiết
            </h4>
            <p className="mt-2 text-sm leading-relaxed font-medium text-neutral-800 dark:text-neutral-200">
              {item.description || 'Chưa có thông tin mô tả chi tiết cho hoạt động này.'}
            </p>
          </div>

          {/* Operational Timeline */}
          <div className="border-2 border-[#171717] bg-white p-5 shadow-[3px_3px_0px_#171717] dark:bg-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#3155E7]" />
              Lịch trình vận hành chi tiết
            </h4>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border-2 border-[#171717] bg-[#F7F5F0] p-3 shadow-[2px_2px_0px_#171717] dark:bg-slate-900">
                <span className="block text-xs font-bold uppercase text-neutral-500">Giờ tập trung</span>
                <span className="text-sm font-black font-mono text-black dark:text-white">
                  {item.gatheringTime || item.startTime}
                </span>
              </div>
              <div className="border-2 border-[#171717] bg-[#F7F5F0] p-3 shadow-[2px_2px_0px_#171717] dark:bg-slate-900">
                <span className="block text-xs font-bold uppercase text-neutral-500">Giờ khởi hành</span>
                <span className="text-sm font-black font-mono text-[#3155E7] dark:text-[#D9FF43]">
                  {item.departureTime || item.startTime}
                </span>
              </div>
              <div className="border-2 border-[#171717] bg-[#F7F5F0] p-3 shadow-[2px_2px_0px_#171717] dark:bg-slate-900">
                <span className="block text-xs font-bold uppercase text-neutral-500">Giờ quay lại tàu</span>
                <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                  {item.returnToShipTime || item.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-[#171717] bg-white p-4 shadow-[3px_3px_0px_#171717] dark:bg-slate-800">
              <div className="flex items-center gap-2 text-rose-600 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-black uppercase text-black dark:text-white">Địa điểm / Cảng</span>
              </div>
              <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{item.locationOrPort}</span>
            </div>

            <div className="border-2 border-[#171717] bg-white p-4 shadow-[3px_3px_0px_#171717] dark:bg-slate-800">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-black uppercase text-black dark:text-white">Sức chứa khả dụng</span>
              </div>
              {item.isSoldOut ? (
                <span className="inline-flex items-center gap-1 text-sm font-black text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4" /> Đã kín chỗ ({item.currentParticipants}/{item.maxCapacity})
                </span>
              ) : (
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Còn <strong className="font-black text-emerald-700 dark:text-emerald-400">{item.remainingCapacity}</strong> chỗ trống (Đã đăng ký: {item.currentParticipants})
                </span>
              )}
            </div>
          </div>

          {/* Pricing Policy */}
          <div className="border-2 border-[#171717] bg-white p-4 shadow-[3px_3px_0px_#171717] dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-400">Chính sách chi phí</span>
                <div className="mt-1 flex items-center gap-2">
                  {item.isIncluded ? (
                    <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Miễn phí (Đã bao gồm trong vé du thuyền)
                    </span>
                  ) : (
                    <span className="text-sm font-black text-black dark:text-white">
                      Người lớn: {item.currency || '$'}{item.price.toFixed(2)} {item.childPrice ? `• Trẻ em: ${item.currency || '$'}${item.childPrice.toFixed(2)}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <span className="border border-[#171717] bg-[#E7E4DC] px-2.5 py-1 text-xs font-black uppercase text-black dark:bg-slate-700 dark:text-white">
                {item.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#171717] bg-[#E7E4DC] p-4 flex items-center justify-between dark:bg-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-[#171717] bg-white px-5 py-2.5 text-xs font-black uppercase text-black shadow-[2px_2px_0px_#171717] transition-all hover:bg-[#F7F5F0] active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-700 dark:text-white"
          >
            Đóng
          </button>

          {!isExcursion && (
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className={`border-2 border-[#171717] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                item.isSoldOut
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#3155E7] hover:bg-blue-700'
              }`}
            >
              {item.isSoldOut ? 'Gia nhập danh sách chờ (Waitlist)' : 'Đăng ký tham gia'}
            </button>
          )}
        </div>
      </div>

      {!isExcursion && isRegisterOpen && (
        <ActivityRegistrationModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          activity={{
            id: item.id,
            title: item.title,
            location: item.locationOrPort,
            activityDate: item.activityDate,
            startTime: item.startTime,
            endTime: item.endTime,
            price: item.price,
            remainingCapacity: item.remainingCapacity,
            maxCapacity: item.maxCapacity,
            currentParticipants: item.currentParticipants,
            isIncluded: item.isIncluded
          }}
          onSuccess={() => {
            setIsRegisterOpen(false);
          }}
        />
      )}
    </div>
  );
};
