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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#171717] pb-5 dark:border-slate-700">
        <div>
          <span className="border border-[#171717] bg-[#D9FF43] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#171717]">
            OPS INTELLIGENCE // ANALYTICS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#171717] mt-2 flex items-center gap-2 dark:text-white">
            <BarChart3 className="w-7 h-7 text-[#3155E7] dark:text-[#D9FF43]" />
            Phân Tích Hiệu Suất Tour Bờ & Đội Xe (Analytics)
          </h1>
          <p className="text-xs font-bold text-neutral-600 mt-1 dark:text-neutral-400">
            Đánh giá chất lượng dịch vụ (Post-Tour Feedback), tỷ lệ lấp đầy ghế xe (Fleet Occupancy) và đối tác tour
          </p>
        </div>
        <button
          onClick={() => void loadDashboardData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#171717] bg-white hover:bg-[#E7E4DC] text-black text-xs font-black uppercase shadow-[2px_2px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 dark:bg-slate-800 dark:text-white"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b-2 border-[#171717] pb-3 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-[#171717] flex items-center gap-2 transition-all active:translate-x-[1px] active:translate-y-[1px] ${
            activeTab === 'fleet'
              ? 'bg-[#171717] text-white shadow-[2px_2px_0px_#171717] dark:bg-[#D9FF43] dark:text-black'
              : 'bg-white text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] dark:bg-slate-800 dark:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Hiệu Suất Đội Xe (Bus Occupancy)
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-[#171717] flex items-center gap-2 transition-all active:translate-x-[1px] active:translate-y-[1px] ${
            activeTab === 'reviews'
              ? 'bg-[#171717] text-white shadow-[2px_2px_0px_#171717] dark:bg-[#D9FF43] dark:text-black'
              : 'bg-white text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] dark:bg-slate-800 dark:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Đánh Giá Khách Hàng (Guest Feedback)
          {kpi?.totalFlaggedReviews ? (
            <span className="ml-1.5 px-2 py-0.5 border border-black text-xs font-black bg-[#DC2626] text-white">
              {kpi.totalFlaggedReviews}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('scorecards')}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-2 border-[#171717] flex items-center gap-2 transition-all active:translate-x-[1px] active:translate-y-[1px] ${
            activeTab === 'scorecards'
              ? 'bg-[#171717] text-white shadow-[2px_2px_0px_#171717] dark:bg-[#D9FF43] dark:text-black'
              : 'bg-white text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] dark:bg-slate-800 dark:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Đối Tác & Hướng Dẫn Viên (Scorecards)
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 border-2 border-[#171717] bg-rose-100 shadow-[3px_3px_0px_#171717] flex items-center gap-3 text-rose-800 font-bold text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && !kpi && !fleet ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#3155E7] animate-spin mx-auto" />
          <p className="text-neutral-500 font-bold uppercase tracking-wider text-sm">Đang tổng hợp số liệu phân tích...</p>
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
