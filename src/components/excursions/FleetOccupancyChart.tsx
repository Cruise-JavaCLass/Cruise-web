import React from 'react';
import type { ExcursionOpsKpi, FleetOccupancyAnalyticsResponse } from '../../services/excursionAnalyticsService';
import { Bus, Users, Star, AlertTriangle, TrendingUp, Compass } from 'lucide-react';

interface Props {
  kpi: ExcursionOpsKpi | null;
  fleet: FleetOccupancyAnalyticsResponse | null;
}

export const FleetOccupancyChart: React.FC<Props> = ({ kpi, fleet }) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Tỷ Lệ Lấp Đầy Ghế Xe</span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {fleet?.overallFleetOccupancyRate != null ? `${fleet.overallFleetOccupancyRate}%` : '--'}
            </span>
            <span className="text-xs text-slate-400">
              ({fleet?.totalPassengersSeated || 0}/{fleet?.totalFleetCapacity || 0} chỗ)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Tổng cộng {fleet?.totalFleetCount || 0} xe đã điều động
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Đánh Giá Tổng Thể CSAT</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              {kpi?.averageOverallRating != null ? `${kpi.averageOverallRating} / 5.0` : '--'}
            </span>
            <span className="text-xs text-slate-400">({kpi?.totalReviews || 0} đánh giá)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Guide: {kpi?.averageGuideRating || 0}★ | Bus: {kpi?.averageBusRating || 0}★
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Cảnh Báo Ưu Tiên Cao</span>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">
              {kpi?.totalFlaggedReviews != null ? kpi.totalFlaggedReviews : 0}
            </span>
            <span className="text-xs text-slate-400">phản ánh khẩn</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Đánh giá 1 sao hoặc an toàn</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Tổng Tour Hoạt Động</span>
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {kpi?.totalExcursions != null ? kpi.totalExcursions : 0}
            </span>
            <span className="text-xs text-slate-400">chuyến tham quan</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {kpi?.providerScorecards?.length || 0} đối tác vận hành
          </div>
        </div>
      </div>

      {/* Occupancy by Port & Provider Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Port */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Tỷ Lệ Lấp Đầy Ghế Theo Cảng Đến
          </h3>
          <div className="space-y-4">
            {fleet?.portSummaries && fleet.portSummaries.length > 0 ? (
              fleet.portSummaries.map((port) => (
                <div key={port.portId} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">{port.portName}</span>
                    <span className="text-cyan-400 font-semibold">
                      {port.occupancyRate}% ({port.assignedPassengers}/{port.totalCapacity})
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        port.occupancyRate >= 80
                          ? 'bg-emerald-500'
                          : port.occupancyRate >= 50
                            ? 'bg-cyan-500'
                            : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, port.occupancyRate))}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{port.busCount} xe đưa đón</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400 py-6 text-center">Chưa có dữ liệu theo cảng</div>
            )}
          </div>
        </div>

        {/* By Provider */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Bus className="w-4 h-4 text-emerald-400" />
            Tỷ Lệ Lấp Đầy Ghế Theo Nhà Cung Cấp
          </h3>
          <div className="space-y-4">
            {fleet?.providerSummaries && fleet.providerSummaries.length > 0 ? (
              fleet.providerSummaries.map((provider) => (
                <div key={provider.providerName} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300 font-medium">{provider.providerName}</span>
                    <span className="text-emerald-400 font-semibold">
                      {provider.occupancyRate}% ({provider.assignedPassengers}/{provider.totalCapacity})
                    </span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        provider.occupancyRate >= 80
                          ? 'bg-emerald-500'
                          : provider.occupancyRate >= 50
                            ? 'bg-blue-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, provider.occupancyRate))}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{provider.busCount} xe điều phối</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-400 py-6 text-center">Chưa có dữ liệu theo đối tác</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
