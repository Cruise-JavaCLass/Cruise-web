import {
  Activity,
  Anchor,
  Compass,
  MapPin,
  RefreshCw,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import {
  type OperationsKpiSummary,
  type OperationsLiveRadar,
  operationsDashboardService,
} from '../../services/operationsDashboardService';

export const OperationsDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<OperationsKpiSummary | null>(null);
  const [radar, setRadar] = useState<OperationsLiveRadar | null>(null);
  const [loading, setLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showAllExcursions, setShowAllExcursions] = useState(false);

  const requestIdRef = useRef(0);

  const fetchData = async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setKpiError(null);
    setRadarError(null);
    try {
      const [kpiResult, radarResult] = await Promise.allSettled([
        operationsDashboardService.getOperationsKpis(),
        operationsDashboardService.getLiveOperationsRadar(),
      ]);

      if (requestId !== requestIdRef.current) return;

      if (kpiResult.status === 'fulfilled') {
        setKpis(kpiResult.value);
      } else {
        setKpis(null);
        setKpiError(kpiResult.reason?.message || 'Không thể tải chỉ số KPI vận hành');
      }

      if (radarResult.status === 'fulfilled') {
        setRadar(radarResult.value);
      } else {
        setRadar(null);
        setRadarError(radarResult.reason?.message || 'Không thể tải dữ liệu radar hoạt động');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => {
      void fetchData();
    }, 30000);
    return () => {
      requestIdRef.current += 1;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header — Luxury Maritime */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#102A43] tracking-tight flex items-center gap-2">
            <Compass className="w-7 h-7 text-[#102A43]" />
            Bảng Chỉ Số Vận Hành Hàng Hải (Fleet Operations)
          </h1>
          <p className="text-sm text-[#5A6578] mt-1">
            Theo dõi tỷ lệ lên tàu, công suất hoạt động & radar khởi hành tour tham quan theo thời gian thực
          </p>
        </div>

        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] font-semibold rounded-xl text-sm transition-colors self-start sm:self-auto disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 text-[#397C80] ${loading ? 'animate-spin' : ''}`} />
          Làm Mới Số Liệu
        </button>
      </div>

      {kpiError && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {kpiError}
        </div>
      )}
      {radarError && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          {radarError}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Embarkation */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A6578]">Tỷ Lệ Lên Tàu (Embarkation)</p>
              <h3 className="text-2xl font-bold font-serif text-[#102A43] mt-1">
                {kpis ? `${kpis.embarkationRate}%` : '...'}
              </h3>
              <p className="text-xs text-[#5A6578] mt-1">
                {kpis ? `${kpis.checkedInPassengers} / ${kpis.totalPassengers} khách` : ''}
              </p>
            </div>
            <div className="p-3 bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-[#F7F4ED] rounded-full h-1.5 mt-4 overflow-hidden border border-[#E5E0D7]">
            <div
              className="bg-[#102A43] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis?.embarkationRate || 0)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Activities Scheduled */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A6578]">Hoạt Động Hôm Nay</p>
              <h3 className="text-2xl font-bold font-serif text-[#102A43] mt-1">
                {kpis !== null ? kpis.totalActivitiesActive : '--'}
              </h3>
              <p className="text-xs text-[#5A6578] mt-1">
                {kpis ? `${kpis.totalActivityRegistrations} lượt đăng ký tham gia` : ''}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-700 font-semibold">
            <TrendingUp className="w-4 h-4" />
            Đang vận hành tích cực trên các boong
          </div>
        </div>

        {/* Card 3: Shore Excursions */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A6578]">Tour Khởi Hành Hôm Nay</p>
              <h3 className="text-2xl font-bold font-serif text-[#102A43] mt-1">
                {kpis !== null ? kpis.departingExcursionsToday : '--'}
              </h3>
              <p className="text-xs text-[#5A6578] mt-1">
                {kpis ? `${kpis.totalExcursionBookings} vé tour đã xuất` : ''}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-xl">
              <Anchor className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-[#5A6578]">
            {kpis !== null ? `Tổng cộng ${kpis.totalShoreExcursions} tour trong hải trình` : '--'}
          </div>
        </div>

        {/* Card 4: Guest Rating */}
        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D7] shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#5A6578]">Đánh Giá Hài Lòng</p>
              <h3 className="text-2xl font-bold font-serif text-[#102A43] mt-1 flex items-center gap-1">
                {!kpis
                  ? '...'
                  : kpis.totalFeedbackSubmitted > 0
                  ? kpis.averageActivityRating.toFixed(1)
                  : '–'}
                <Star className="w-5 h-5 text-[#C5A572] fill-[#C5A572]" />
              </h3>
              <p className="text-xs text-[#5A6578] mt-1">
                {kpis !== null ? `Dựa trên ${kpis.totalFeedbackSubmitted} phản hồi` : ''}
              </p>
            </div>
            <div className="p-3 bg-[#F7F4ED] text-[#C5A572] border border-[#E5E0D7] rounded-xl">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-[#397C80] font-semibold">
            Chỉ số dịch vụ vượt chuẩn 5 sao
          </div>
        </div>
      </div>

      {/* Radar Visualizer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Capacity Utilization Radar */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-serif text-[#102A43] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#397C80]" />
              Tải Công Suất Hoạt Động (Activity Capacity Radar)
            </h3>
            {radar && (
              <span className="text-xs bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] px-2.5 py-1 rounded-full font-bold">
                Trực Tiếp
              </span>
            )}
          </div>

          <div className="space-y-3">
            {radar?.activityRadar && radar.activityRadar.length > 0 ? (
              (showAllActivities ? radar.activityRadar : radar.activityRadar.slice(0, 5)).map((act) => (
                <div key={act.activityId} className="p-3 bg-[#F7F4ED]/50 rounded-xl border border-[#E5E0D7] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-sm font-semibold text-[#102A43]">
                    <span className="truncate max-w-[250px]">{act.title}</span>
                    <span className="text-xs font-bold text-[#5A6578]">
                      {act.checkedInCount} / {act.capacity} ({act.occupancyRate}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5A6578]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#397C80]" />
                      {act.location}
                    </span>
                    <span>{act.scheduledTime}</span>
                  </div>
                  <div className="w-full bg-[#E5E0D7] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        act.occupancyRate >= 90
                          ? 'bg-rose-500'
                          : act.occupancyRate >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, act.occupancyRate)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#5A6578] py-4 text-center">Chưa có dữ liệu radar hoạt động</p>
            )}
            {radar?.activityRadar && radar.activityRadar.length > 5 && (
              <button
                onClick={() => setShowAllActivities(!showAllActivities)}
                className="w-full py-2 text-xs text-[#102A43] font-bold hover:bg-[#F7F4ED] rounded-xl transition-colors border border-[#E5E0D7] cursor-pointer"
              >
                {showAllActivities ? 'Thu gọn danh sách (Hiện 5 hoạt động đầu)' : `Xem toàn bộ radar (${radar.activityRadar.length} hoạt động)`}
              </button>
            )}
          </div>
        </div>

        {/* Shore Excursions Departure Radar */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold font-serif text-[#102A43] flex items-center gap-2">
              <Anchor className="w-5 h-5 text-amber-700" />
              Radar Khởi Hành Tour Bờ (Departure Radar)
            </h3>
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
              Cảng Đến
            </span>
          </div>

          <div className="space-y-3">
            {radar?.excursionRadar && radar.excursionRadar.length > 0 ? (
              (showAllExcursions ? radar.excursionRadar : radar.excursionRadar.slice(0, 5)).map((exc) => (
                <div key={exc.excursionId} className="p-3 bg-[#F7F4ED]/50 rounded-xl border border-[#E5E0D7] flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-sm font-semibold text-[#102A43]">
                    <span className="truncate max-w-[250px]">{exc.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {exc.departureTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#5A6578]">
                    <span>Cảng: {exc.portName}</span>
                    <span>Đã có mặt: {exc.presentCount} / {exc.bookedCount} khách</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#5A6578] py-4 text-center">Không có tour nào sắp rời tàu</p>
            )}
            {radar?.excursionRadar && radar.excursionRadar.length > 5 && (
              <button
                onClick={() => setShowAllExcursions(!showAllExcursions)}
                className="w-full py-2 text-xs text-amber-800 font-bold hover:bg-amber-50 rounded-xl transition-colors border border-amber-200 cursor-pointer"
              >
                {showAllExcursions ? 'Thu gọn danh sách (Hiện 5 tour đầu)' : `Xem toàn bộ radar (${radar.excursionRadar.length} tour bờ)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsDashboard;
