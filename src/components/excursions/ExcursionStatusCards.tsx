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
      <div className="neo-card p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#171717]/60">Tổng Chuyến Tour</p>
          <h3 className="text-3xl font-display font-black text-[#171717] mt-1">{totalCount} Tour</h3>
          <p className="text-[10px] font-mono text-[#3155E7] font-bold mt-0.5">Theo các điểm cập cảng</p>
        </div>
        <div className="w-10 h-10 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
          <Compass className="w-5 h-5 text-[#3155E7]" />
        </div>
      </div>

      {/* In Progress */}
      <div className="neo-card p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#171717]/60">Đang Khởi Hành</p>
          <h3 className="text-3xl font-display font-black text-[#3155E7] mt-1">{inProgressCount} Đoàn</h3>
          <p className="text-[10px] font-mono text-[#171717]/70 font-semibold mt-0.5">Khách đang ở trên bờ</p>
        </div>
        <div className="w-10 h-10 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
          <Bus className="w-5 h-5" />
        </div>
      </div>

      {/* Delayed Alert */}
      <div
        className={`neo-card p-4 flex items-center justify-between ${
          delayedCount > 0
            ? 'bg-[#F59E0B]/20 border-2 border-[#171717]'
            : 'bg-white'
        }`}
      >
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706]">Cảnh Báo Trễ Giờ</p>
          <h3 className="text-3xl font-display font-black text-[#D97706] mt-1">{delayedCount} Chuyến</h3>
          <p className="text-[10px] font-mono text-[#171717]/70 font-semibold mt-0.5">
            {delayedCount > 0 ? 'Cần hỗ trợ đưa khách về tàu' : 'Lịch trình đúng kế hoạch'}
          </p>
        </div>
        <div className="w-10 h-10 bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-[#D97706]" />
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className="neo-card p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#171717]/60">Lấp Đầy Chỗ</p>
          <h3 className="text-3xl font-display font-black text-[#059669] mt-1">{occupancyRate}%</h3>
          <p className="text-[10px] font-mono text-[#171717]/70 font-semibold mt-0.5">
            {totalBooked} / {totalCapacity} chỗ đã đặt
          </p>
        </div>
        <div className="w-10 h-10 bg-[#10B981] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
          <Users className="w-5 h-5 text-[#171717]" />
        </div>
      </div>
    </div>
  );
};
