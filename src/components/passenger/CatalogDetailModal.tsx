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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E0D7] rounded-2xl shadow-2xl overflow-hidden text-[#252B32]">
        {/* Header */}
        <div className="relative border-b border-[#E5E0D7] bg-[#F7F4ED] p-6 sm:p-8 text-[#102A43]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết"
            className="absolute top-5 right-5 p-2 rounded-xl text-[#5A6B7C] hover:text-[#102A43] hover:bg-[#E5E0D7]/40 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-lg ${
                isExcursion
                  ? 'bg-[#397C80]/15 text-[#397C80] border border-[#397C80]/30'
                  : 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20'
              }`}
            >
              {isExcursion ? <Compass className="h-3.5 w-3.5" /> : <Ship className="h-3.5 w-3.5" />}
              {isExcursion ? 'Tour tham quan trên bờ' : 'Hoạt động trên du thuyền'}
            </span>
            <span className="bg-[#C5A572]/15 text-[#9E7A3E] border border-[#C5A572]/30 px-2.5 py-1 text-xs font-bold uppercase rounded-lg">
              Ngày {item.dayNumber}
            </span>
          </div>

          <h2 id="modal-catalog-title" className="text-xl sm:text-2xl font-bold uppercase text-[#102A43]">{item.title}</h2>
          <p className="mt-1 text-xs text-[#5A6B7C] flex items-center gap-1.5 font-medium">
            <Calendar className="h-3.5 w-3.5 text-[#397C80]" /> Ngày diễn ra: {item.activityDate}
          </p>
        </div>

        {/* Body Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6 sm:p-8">
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A43]">
              Giới thiệu chi tiết
            </h4>
            <p className="mt-2 text-sm leading-relaxed font-normal text-[#252B32]">
              {item.description || 'Chưa có thông tin mô tả chi tiết cho hoạt động này.'}
            </p>
          </div>

          {/* Operational Timeline */}
          <div className="border border-[#E5E0D7] bg-[#F7F4ED] p-5 rounded-2xl shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#397C80]" />
              Lịch trình vận hành chi tiết
            </h4>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border border-[#E5E0D7] bg-white p-3 rounded-xl shadow-xs">
                <span className="block text-xs font-medium uppercase text-[#5A6B7C]">Giờ tập trung</span>
                <span className="text-sm font-bold font-mono text-[#102A43]">
                  {item.gatheringTime || item.startTime}
                </span>
              </div>
              <div className="border border-[#E5E0D7] bg-white p-3 rounded-xl shadow-xs">
                <span className="block text-xs font-medium uppercase text-[#5A6B7C]">Giờ khởi hành</span>
                <span className="text-sm font-bold font-mono text-[#397C80]">
                  {item.departureTime || item.startTime}
                </span>
              </div>
              <div className="border border-[#E5E0D7] bg-white p-3 rounded-xl shadow-xs">
                <span className="block text-xs font-medium uppercase text-[#5A6B7C]">Giờ quay lại tàu</span>
                <span className="text-sm font-bold font-mono text-rose-600">
                  {item.returnToShipTime || item.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Location & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-[#E5E0D7] bg-white p-4 rounded-xl shadow-xs">
              <div className="flex items-center gap-2 text-[#397C80] mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-bold uppercase text-[#102A43]">Địa điểm / Cảng</span>
              </div>
              <span className="text-sm font-semibold text-[#252B32]">{item.locationOrPort}</span>
            </div>

            <div className="border border-[#E5E0D7] bg-white p-4 rounded-xl shadow-xs">
              <div className="flex items-center gap-2 text-[#397C80] mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-bold uppercase text-[#102A43]">Sức chứa khả dụng</span>
              </div>
              {item.isSoldOut ? (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-600">
                  <AlertCircle className="h-4 w-4" /> Đã kín chỗ ({item.currentParticipants}/{item.maxCapacity})
                </span>
              ) : (
                <span className="text-sm font-medium text-[#252B32]">
                  Còn <strong className="font-bold text-[#397C80]">{item.remainingCapacity}</strong> chỗ trống (Đã đăng ký: {item.currentParticipants})
                </span>
              )}
            </div>
          </div>

          {/* Pricing Policy */}
          <div className="border border-[#E5E0D7] bg-white p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-[#102A43]">Chính sách chi phí</span>
                <div className="mt-1 flex items-center gap-2">
                  {item.isIncluded ? (
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#397C80]">
                      <CheckCircle2 className="h-4 w-4" /> Miễn phí (Đã bao gồm trong vé du thuyền)
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-[#102A43]">
                      Người lớn: {item.currency || '$'}{item.price.toFixed(2)} {item.childPrice ? `• Trẻ em: ${item.currency || '$'}${item.childPrice.toFixed(2)}` : ''}
                    </span>
                  )}
                </div>
              </div>
              <span className="border border-[#E5E0D7] bg-[#F7F4ED] px-2.5 py-1 text-xs font-bold uppercase text-[#102A43] rounded-lg">
                {item.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#E5E0D7] bg-[#F7F4ED] p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#E5E0D7] bg-white px-5 py-2.5 text-xs font-semibold uppercase text-[#102A43] rounded-xl shadow-xs transition-all hover:bg-[#ECE7DC] cursor-pointer"
          >
            Đóng
          </button>

          {!isExcursion && (
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className={`px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer ${
                item.isSoldOut
                  ? 'bg-[#F7F4ED] text-[#102A43] border border-[#C5A572] hover:bg-[#ECE7DC]'
                  : 'bg-[#102A43] hover:bg-[#0B1F33] text-white'
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
