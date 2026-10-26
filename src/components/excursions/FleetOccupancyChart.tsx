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
        <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#687787]">Tỷ Lệ Lấp Đầy Ghế Xe</span>
            <div className="w-9 h-9 rounded-lg bg-[#102A43]/10 text-[#102A43] flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-[#102A43]">
              {fleet?.overallFleetOccupancyRate != null ? `${fleet.overallFleetOccupancyRate}%` : '--'}
            </span>
            <span className="text-xs text-[#687787]">
              ({fleet?.totalPassengersSeated || 0}/{fleet?.totalFleetCapacity || 0} chỗ)
            </span>
          </div>
          <div className="mt-2 text-xs text-[#687787] flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Tổng cộng {fleet?.totalFleetCount || 0} xe đã điều động
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#687787]">Đánh Giá Tổng Thể CSAT</span>
            <div className="w-9 h-9 rounded-lg bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/40 flex items-center justify-center">
              <Star className="w-5 h-5 fill-[#C5A572] text-[#C5A572]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-[#102A43]">
              {kpi?.averageOverallRating != null ? `${kpi.averageOverallRating} / 5.0` : '--'}
            </span>
            <span className="text-xs text-[#687787]">({kpi?.totalReviews || 0} đánh giá)</span>
          </div>
          <div className="mt-2 text-xs text-[#687787]">
            Guide: {kpi?.averageGuideRating || 0}★ | Bus: {kpi?.averageBusRating || 0}★
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#687787]">Cảnh Báo Ưu Tiên Cao</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-rose-600">
              {kpi?.totalFlaggedReviews != null ? kpi.totalFlaggedReviews : 0}
            </span>
            <span className="text-xs text-[#687787]">phản ánh khẩn</span>
          </div>
          <div className="mt-2 text-xs text-[#687787]">Đánh giá 1 sao hoặc an toàn</div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#687787]">Tổng Tour Hoạt Động</span>
            <div className="w-9 h-9 rounded-lg bg-[#102A43]/10 text-[#102A43] flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-serif font-bold text-[#102A43]">
              {kpi?.totalExcursions != null ? kpi.totalExcursions : 0}
            </span>
            <span className="text-xs text-[#687787]">chuyến tham quan</span>
          </div>
          <div className="mt-2 text-xs text-[#687787]">
            {kpi?.providerScorecards?.length || 0} đối tác vận hành
          </div>
        </div>
      </div>

      {/* Occupancy by Port & Provider Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Port */}
        <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
          <h3 className="text-base font-serif font-bold text-[#102A43] mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#102A43]" />
            Tỷ Lệ Lấp Đầy Ghế Theo Cảng Đến
          </h3>
          <div className="space-y-4">
            {fleet?.portSummaries && fleet.portSummaries.length > 0 ? (
              fleet.portSummaries.map((port) => (
                <div key={port.portId} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#252B32] font-semibold">{port.portName}</span>
                    <span className="text-[#102A43] font-bold">
                      {port.occupancyRate}% ({port.assignedPassengers}/{port.totalCapacity})
                    </span>
                  </div>
                  <div className="w-full bg-[#F7F4ED] border border-[#E5E0D7] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        port.occupancyRate >= 80
                          ? 'bg-emerald-600'
                          : port.occupancyRate >= 50
                            ? 'bg-[#102A43]'
                            : 'bg-[#C5A572]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, port.occupancyRate))}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#687787]">{port.busCount} xe đưa đón</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-[#687787] py-6 text-center">Chưa có dữ liệu theo cảng</div>
            )}
          </div>
        </div>

        {/* By Provider */}
        <div className="bg-white border border-[#E5E0D7] rounded-xl p-5 shadow-xs">
          <h3 className="text-base font-serif font-bold text-[#102A43] mb-4 flex items-center gap-2">
            <Bus className="w-4 h-4 text-[#102A43]" />
            Tỷ Lệ Lấp Đầy Ghế Theo Nhà Cung Cấp
          </h3>
          <div className="space-y-4">
            {fleet?.providerSummaries && fleet.providerSummaries.length > 0 ? (
              fleet.providerSummaries.map((provider) => (
                <div key={provider.providerName} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#252B32] font-semibold">{provider.providerName}</span>
                    <span className="text-[#102A43] font-bold">
                      {provider.occupancyRate}% ({provider.assignedPassengers}/{provider.totalCapacity})
                    </span>
                  </div>
                  <div className="w-full bg-[#F7F4ED] border border-[#E5E0D7] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        provider.occupancyRate >= 80
                          ? 'bg-emerald-600'
                          : provider.occupancyRate >= 50
                            ? 'bg-[#102A43]'
                            : 'bg-rose-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, provider.occupancyRate))}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#687787]">{provider.busCount} xe điều phối</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-[#687787] py-6 text-center">Chưa có dữ liệu theo đối tác</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
