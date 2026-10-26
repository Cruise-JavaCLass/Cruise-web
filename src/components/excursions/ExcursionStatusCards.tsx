import React from 'react';
import { Compass, Bus, AlertTriangle, Users } from 'lucide-react';

export interface ExcursionStatusCardsProps {
  totalCount: number;
  inProgressCount: number;
  delayedCount: number;
  occupancyRate: number;
  totalBooked?: number;
  totalCapacity?: number;
}

export const ExcursionStatusCards: React.FC<ExcursionStatusCardsProps> = ({
  totalCount,
  inProgressCount,
  delayedCount,
  occupancyRate,
  totalBooked = 0,
  totalCapacity = 0,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="excursion-status-kpi-cards">
      {/* Total Excursions */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687787]">Tổng Chuyến Tour</p>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#102A43] mt-1">{totalCount} Tour</h3>
          <p className="text-xs text-[#687787] mt-0.5">Theo các điểm cập cảng</p>
        </div>
        <div className="w-11 h-11 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-center text-[#102A43]">
          <Compass className="w-5 h-5 text-[#102A43]" />
        </div>
      </div>

      {/* In Progress */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687787]">Đang Khởi Hành</p>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#102A43] mt-1">{inProgressCount} Đoàn</h3>
          <p className="text-xs text-[#687787] mt-0.5">Khách đang ở trên bờ</p>
        </div>
        <div className="w-11 h-11 bg-[#102A43] text-white rounded-xl flex items-center justify-center shadow-xs">
          <Bus className="w-5 h-5" />
        </div>
      </div>

      {/* Delayed Alert */}
      <div
        className={`rounded-xl p-4.5 shadow-xs flex items-center justify-between border ${
          delayedCount > 0
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-white border-[#E5E0D7]'
        }`}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Cảnh Báo Trễ Giờ</p>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-amber-700 mt-1">{delayedCount} Chuyến</h3>
          <p className="text-xs text-[#687787] mt-0.5">
            {delayedCount > 0 ? 'Cần hỗ trợ đưa khách về tàu' : 'Lịch trình đúng kế hoạch'}
          </p>
        </div>
        <div className="w-11 h-11 bg-amber-100 text-amber-700 border border-amber-200 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#687787]">Lấp Đầy Chỗ</p>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-1">{occupancyRate}%</h3>
          <p className="text-xs text-[#687787] mt-0.5">
            {totalBooked} / {totalCapacity} chỗ đã đặt
          </p>
        </div>
        <div className="w-11 h-11 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
