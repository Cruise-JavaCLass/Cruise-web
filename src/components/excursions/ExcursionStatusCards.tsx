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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" data-testid="excursion-status-kpi-cards">
      {/* Total Excursions */}
      <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl hover:border-cyan-500/30 transition-all">
        <div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Tổng Chuyến Tour</p>
          <h3 className="text-2xl font-display text-white mt-1">{totalCount} Tour</h3>
          <p className="text-[10px] text-cyan-400 mt-0.5">Theo các điểm cập cảng</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Compass className="w-5 h-5" />
        </div>
      </div>

      {/* In Progress */}
      <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl hover:border-blue-500/30 transition-all">
        <div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Đang Khởi Hành</p>
          <h3 className="text-2xl font-display text-blue-400 mt-1">{inProgressCount} Đoàn</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Khách đang ở trên bờ</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Bus className="w-5 h-5" />
        </div>
      </div>

      {/* Delayed Alert */}
      <div
        className={`border rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl shadow-xl transition-all ${
          delayedCount > 0
            ? 'bg-amber-950/40 border-amber-500/40'
            : 'bg-[#030303]/60 border-white/10 hover:border-amber-500/30'
        }`}
      >
        <div>
          <p className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">Cảnh Báo Trễ Giờ</p>
          <h3 className="text-2xl font-display text-amber-300 mt-1">{delayedCount} Chuyến</h3>
          <p className="text-[10px] text-amber-400/80 mt-0.5">
            {delayedCount > 0 ? 'Cần hỗ trợ đưa khách về tàu' : 'Lịch trình đúng kế hoạch'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl hover:border-emerald-500/30 transition-all">
        <div>
          <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Lấp Đầy Chỗ</p>
          <h3 className="text-2xl font-display text-emerald-400 mt-1">{occupancyRate}%</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {totalBooked} / {totalCapacity} chỗ đã đặt
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Users className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
