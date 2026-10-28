import React, { useEffect, useState } from 'react';
import {
  getFleetOccupancyAnalytics,
  getExcursionOpsKpi,
  type FleetOccupancyAnalyticsResponse,
  type ExcursionOpsKpi,
} from '../services/excursionAnalyticsService';
import { FleetOccupancyChart } from '../components/excursions/FleetOccupancyChart';
import { GuestReviewFeed } from '../components/excursions/GuestReviewFeed';
import { GuideRatingMatrix } from '../components/excursions/GuideRatingMatrix';
import { BarChart3, MessageSquare, Award, RefreshCw, AlertCircle } from 'lucide-react';

export const ExcursionAnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'reviews' | 'scorecards'>('fleet');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<ExcursionOpsKpi | null>(null);
  const [fleet, setFleet] = useState<FleetOccupancyAnalyticsResponse | null>(null);

  const loadDashboardData = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, fleetRes] = await Promise.all([
        getExcursionOpsKpi(),
        getFleetOccupancyAnalytics(),
      ]);
      if (!signal?.aborted) {
        setKpi(kpiRes);
        setFleet(fleetRes);
      }
    } catch (err: unknown) {
      if (!signal?.aborted) {
        const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu phân tích tour bờ';
        setError(msg);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadDashboardData(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D7] pb-5">
        <div>
          <span className="inline-block border border-[#C5A572]/40 bg-[#C5A572]/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#102A43] rounded-md">
            OPS INTELLIGENCE // ANALYTICS
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#102A43] mt-2 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-[#102A43]" />
            Phân Tích Hiệu Suất Tour Bờ & Đội Xe (Analytics)
          </h1>
          <p className="text-xs text-[#687787] mt-1">
            Đánh giá chất lượng dịch vụ (Post-Tour Feedback), tỷ lệ lấp đầy ghế xe (Fleet Occupancy) và đối tác tour
          </p>
        </div>
        <button
          onClick={() => void loadDashboardData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] text-[#102A43] text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E0D7] pb-3">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'fleet'
              ? 'bg-[#102A43] text-white border-[#102A43] shadow-xs'
              : 'bg-white text-[#252B32] border-[#E5E0D7] hover:bg-[#F7F4ED]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Hiệu Suất Đội Xe (Bus Occupancy)
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-[#102A43] text-white border-[#102A43] shadow-xs'
              : 'bg-white text-[#252B32] border-[#E5E0D7] hover:bg-[#F7F4ED]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Đánh Giá Khách Hàng (Guest Feedback)
          {kpi?.totalFlaggedReviews ? (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">
              {kpi.totalFlaggedReviews}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('scorecards')}
          className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'scorecards'
              ? 'bg-[#102A43] text-white border-[#102A43] shadow-xs'
              : 'bg-white text-[#252B32] border-[#E5E0D7] hover:bg-[#F7F4ED]'
          }`}
        >
          <Award className="w-4 h-4" />
          Đối Tác & Hướng Dẫn Viên (Scorecards)
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 border border-rose-200 bg-rose-50 rounded-xl shadow-xs flex items-center gap-3 text-rose-800 text-xs font-medium">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && !kpi && !fleet ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#102A43] animate-spin mx-auto" />
          <p className="text-[#687787] font-medium tracking-wider text-sm">Đang tổng hợp số liệu phân tích...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'fleet' && <FleetOccupancyChart kpi={kpi} fleet={fleet} />}
          {activeTab === 'reviews' && <GuestReviewFeed />}
          {activeTab === 'scorecards' && <GuideRatingMatrix kpi={kpi} />}
        </div>
      )}
    </div>
  );
};
