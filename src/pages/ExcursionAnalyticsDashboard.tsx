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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            Phân Tích Hiệu Suất Tour Bờ & Đội Xe (Analytics)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Đánh giá chất lượng dịch vụ (Post-Tour Feedback), tỷ lệ lấp đầy ghế xe (Fleet Occupancy) và đối tác tour
          </p>
        </div>
        <button
          onClick={() => void loadDashboardData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700/80 gap-6">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${
            activeTab === 'fleet'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Hiệu Suất Đội Xe (Bus Occupancy)
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${
            activeTab === 'reviews'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Đánh Giá Khách Hàng (Guest Feedback)
          {kpi?.totalFlaggedReviews ? (
            <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300">
              {kpi.totalFlaggedReviews}
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('scorecards')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition ${
            activeTab === 'scorecards'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          Đối Tác & Hướng Dẫn Viên (Scorecards)
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && !kpi && !fleet ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Đang tổng hợp số liệu phân tích...</p>
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
