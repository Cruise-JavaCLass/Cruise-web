import { useEffect, useRef, useState } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  MapPin,
  QrCode,
  ArrowRight,
  Compass,
  Navigation,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlurWord } from '../components/common/BlurWord';
import { SpotlightCard } from '../components/ui/SpotlightCard';
import { TiltedCard } from '../components/ui/TiltedCard';
import { Magnet } from '../components/ui/Magnet';
import { DecryptedText } from '../components/ui/ShinyText';
import { MaritimeGlobe3D } from '../components/ui/MaritimeGlobe3D';
import { useAnimeStagger } from '../components/ui/useAnimeStagger';
import {
  operationsDashboardService,
  type OperationsKpiSummary,
} from '../services/operationsDashboardService';
import { getTours, type CruiseTour } from '../services/tourService';
import { getTourStops, type CruiseStop } from '../services/portStopService';

export function DashboardPage() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  useAnimeStagger(dashboardRef, '[data-anime-item]', 75);

  const [kpis, setKpis] = useState<OperationsKpiSummary | null>(null);
  const [activeTour, setActiveTour] = useState<CruiseTour | null>(null);
  const [stops, setStops] = useState<CruiseStop[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const [kpiData, tours] = await Promise.all([
          operationsDashboardService.getOperationsKpis().catch(() => null),
          getTours().catch(() => []),
        ]);
        if (!isMounted) return;
        if (kpiData) setKpis(kpiData);
        if (tours.length > 0) {
          const primaryTour = tours.find((t) => t.status === 'IN_PROGRESS') || tours[0];
          setActiveTour(primaryTour);
          const tourStops = await getTourStops(primaryTour.id).catch(() => []);
          if (isMounted) setStops(tourStops);
        }
      } catch {
        // Ignore when offline
      }
    };
    void loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalPassengers = kpis?.totalPassengers ?? 0;
  const checkedInPassengers = kpis?.checkedInPassengers ?? 0;
  const embarkationRate = kpis?.embarkationRate ?? 0;
  const totalActivities = (kpis?.totalActivitiesScheduled ?? 0) + (kpis?.departingExcursionsToday ?? 0);

  return (
    <div ref={dashboardRef} className="space-y-8 animate-in fade-in duration-300">
      {/* Luxury Maritime Hero Banner with Three.js 3D Fleet Holodeck */}
      <div className="relative overflow-hidden bg-white border border-[#E5E0D7] rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xs">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            {/* Eyebrow / Meta Bar */}
            <div className="inline-flex flex-wrap items-center gap-2 text-xs font-mono text-[#252B32] mb-4">
              <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                Frontend Client v1.0.0
              </span>
              <span className="text-[11px] font-mono text-[#5A6578]">
                • Autonomous AI agents for luxury cruise management
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#397C80] font-bold">
                Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F7F4ED] border border-[#E5E0D7] text-[10px] font-mono text-[#102A43] font-semibold">
                <Navigation className="w-3 h-3 text-[#397C80]" />
                <DecryptedText text="16°07′N 108°13′E • 18.4 KTS" />
              </span>
            </div>

            {/* Display Headline with Kinetic Blur Word */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[#102A43] leading-[1.1] mb-5 uppercase">
              Autonomous fleet, <br />
              services that{' '}
              <BlurWord words={['orchestrate', 'navigate', 'elevate', 'synchronize']} />
            </h1>

            <p className="text-[#5A6578] text-xs sm:text-sm max-w-2xl leading-relaxed mb-8">
              Hệ thống quản lý dịch vụ và hoạt động du thuyền thế hệ mới. Tự động hóa lịch trình hải trình, giám sát tour trên bờ, phân bổ xe đưa đón và đối soát POS phi tiền mặt ngoại tuyến.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Magnet strength={0.18}>
                <Link
                  to="/excursions"
                  className="inline-flex items-center gap-2 text-xs py-2.5 px-4 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <Compass className="w-4 h-4 text-[#C5A572]" /> Khám Phá Shore Excursions
                </Link>
              </Magnet>
              <Magnet strength={0.18}>
                <Link
                  to="/itinerary"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] text-xs font-semibold text-[#102A43] hover:bg-[#ECE7DC] transition-colors shadow-xs"
                >
                  <MapPin className="w-4 h-4 text-[#397C80]" /> Hải Trình Du Thuyền
                </Link>
              </Magnet>
            </div>

            {/* Stats Row at bottom of Hero */}
            <div className="pt-6 mt-8 border-t border-[#E5E0D7] grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              <div className="p-3.5 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
                <span className="text-3xl font-serif font-bold text-[#102A43] block tabular-nums">
                  {checkedInPassengers.toLocaleString('vi-VN')}
                </span>
                <span className="text-[10px] font-mono uppercase font-medium text-[#5A6578] block mt-0.5">
                  passengers onboard
                </span>
              </div>
              <div className="p-3.5 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
                <span className="text-3xl font-serif font-bold text-[#102A43] block tabular-nums">
                  {embarkationRate > 0 ? `${embarkationRate.toFixed(1)}%` : '0%'}
                </span>
                <span className="text-[10px] font-mono uppercase font-medium text-[#5A6578] block mt-0.5">
                  on-time all-aboard
                </span>
              </div>
              <div className="p-3.5 bg-[#F7F4ED]/60 rounded-xl border border-[#E5E0D7]">
                <span className="text-3xl font-serif font-bold text-[#397C80] block tabular-nums">
                  --
                </span>
                <span className="text-[10px] font-mono uppercase font-medium text-[#5A6578] block mt-0.5">
                  pos sync latency
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Three.js 3D Maritime Globe */}
          <div className="lg:col-span-5">
            <TiltedCard maxTilt={4} glareColor="rgba(197, 165, 114, 0.15)" className="rounded-2xl">
              <MaritimeGlobe3D />
            </TiltedCard>
          </div>
        </div>
      </div>

      {/* Quick Metrics Cards — Luxury Maritime with React Bits Spotlight & Tilt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Hành khách trên tàu */}
        <div data-anime-item>
          <TiltedCard maxTilt={4} className="rounded-2xl h-full">
            <SpotlightCard
              spotlightColor="rgba(16, 42, 67, 0.08)"
              borderGlowColor="#102A43"
              className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs h-full"
            >
              <div className="flex items-center justify-between text-[#252B32] mb-3">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#5A6578]">
                  Hành khách trên tàu
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-[#102A43] tabular-nums">
                {checkedInPassengers}{' '}
                <span className="text-xs font-mono text-[#5A6578] font-normal">
                  / {totalPassengers}
                </span>
              </p>
              <div className="mt-3 flex items-center text-[10px] font-mono font-medium text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {embarkationRate.toFixed(1)}% tỉ lệ lên tàu
              </div>
            </SpotlightCard>
          </TiltedCard>
        </div>

        {/* Card 2: Hoạt động hôm nay */}
        <div data-anime-item>
          <TiltedCard maxTilt={4} className="rounded-2xl h-full">
            <SpotlightCard
              spotlightColor="rgba(16, 42, 67, 0.08)"
              borderGlowColor="#102A43"
              className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs h-full"
            >
              <div className="flex items-center justify-between text-[#252B32] mb-3">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#5A6578]">
                  Hoạt động hôm nay
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#F7F4ED] text-[#397C80] border border-[#E5E0D7] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-[#102A43]">
                {totalActivities} Sự kiện
              </p>
              <div className="mt-3 text-[10px] font-mono font-medium text-[#397C80]">
                {kpis?.totalActivitiesScheduled ?? 0} Onboard • {kpis?.departingExcursionsToday ?? 0} Shore Excursion
              </div>
            </SpotlightCard>
          </TiltedCard>
        </div>

        {/* Card 3: Doanh thu POS */}
        <div data-anime-item>
          <TiltedCard maxTilt={4} className="rounded-2xl h-full">
            <SpotlightCard
              spotlightColor="rgba(16, 42, 67, 0.08)"
              borderGlowColor="#102A43"
              className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs h-full"
            >
              <div className="flex items-center justify-between text-[#252B32] mb-3">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#5A6578]">
                  Doanh thu POS hôm nay
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-[#102A43] tabular-nums">
                -- <span className="text-xs font-mono text-[#5A6578] font-normal">USD</span>
              </p>
              <div className="mt-3 text-[10px] font-mono font-medium text-emerald-700">
                Cashless Onboard Accounts
              </div>
            </SpotlightCard>
          </TiltedCard>
        </div>

        {/* Card 4: An toàn & Tập trung */}
        <div data-anime-item>
          <TiltedCard maxTilt={4} className="rounded-2xl h-full">
            <SpotlightCard
              spotlightColor="rgba(16, 185, 129, 0.1)"
              borderGlowColor="#10B981"
              className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs h-full"
            >
              <div className="flex items-center justify-between text-[#252B32] mb-3">
                <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#5A6578]">
                  An toàn & Tập trung
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-serif font-bold text-emerald-700">--</p>
              <div className="mt-3 text-[10px] font-mono font-medium text-[#5A6578]">
                Đang đồng bộ cổng an ninh
              </div>
            </SpotlightCard>
          </TiltedCard>
        </div>
      </div>

      {/* Grid Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary Preview */}
        <SpotlightCard
          data-anime-item
          spotlightColor="rgba(16, 42, 67, 0.06)"
          borderGlowColor="#102A43"
          className="bg-white border border-[#E5E0D7] rounded-2xl p-6 lg:col-span-2 shadow-xs"
        >
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E5E0D7]">
            <div>
              <h3 className="font-serif font-bold text-base text-[#102A43] flex items-center gap-2 uppercase">
                <MapPin className="w-4 h-4 text-[#397C80]" /> Lịch trình & Điểm dừng du thuyền (Itinerary)
              </h3>
              <p className="text-xs text-[#5A6578] mt-0.5">
                {activeTour
                  ? `${activeTour.name} (${activeTour.code})`
                  : 'Tiến độ cập cảng theo tuyến hải trình hiện tại'}
              </p>
            </div>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
              {activeTour
                ? `${activeTour.durationDays} Ngày ${activeTour.durationNights} Đêm`
                : 'Chưa có tour'}
            </span>
          </div>
          {stops.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-[#E5E0D7] rounded-2xl bg-[#F7F4ED]/50">
              <MapPin className="w-6 h-6 text-[#5A6578]/50 mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#102A43]">
                Chưa có điểm dừng hải trình nào trong hệ thống
              </p>
              <p className="text-[11px] text-[#5A6578] mt-1">
                Vui lòng tạo tour và điểm dừng tại mục Hải Trình Du Thuyền.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div
                  key={stop.id || index}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED]/50 hover:bg-[#F7F4ED] transition-all text-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-16 text-[#102A43] font-mono font-bold text-xs uppercase">
                      Chặng #{stop.stopOrder}
                    </span>
                    <div>
                      <p className="font-semibold text-[#102A43] text-sm">
                        {stop.portName || `Cảng #${stop.portId}`}
                      </p>
                      <p className="text-[11px] font-mono text-[#5A6578] mt-0.5">
                        {stop.arrivalTime} — {stop.departureTime}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white text-[#397C80] border border-[#E5E0D7]">
                    Lên lịch
                  </span>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>

        {/* Offline POS & QR Check-in preview */}
        <SpotlightCard
          data-anime-item
          spotlightColor="rgba(16, 42, 67, 0.08)"
          borderGlowColor="#102A43"
          className="bg-white border border-[#E5E0D7] rounded-2xl p-6 flex flex-col justify-between shadow-xs"
        >
          <div className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E0D7]">
                <h3 className="font-serif font-bold text-base text-[#102A43] flex items-center gap-2 uppercase">
                  <QrCode className="w-4 h-4 text-[#397C80]" /> POS & Offline Sync
                </h3>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                  V2.4
                </span>
              </div>
              <div className="bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-xl p-3.5 mb-4 text-xs text-[#252B32] leading-relaxed">
                <p className="font-semibold text-[#102A43] uppercase mb-1">
                  Mô hình ngoại tuyến (Offline Ready):
                </p>
                Thiết bị POS & tablet ghi nhận giao dịch chi tiêu không dùng tiền mặt qua Cruise Card / QR / RFID khi tàu mất sóng và tự động sync khi có mạng.
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E0D7] bg-white">
                  <span className="text-[#5A6578]">Xác thực:</span>
                  <span className="font-semibold text-[#397C80]">QR Code / RFID Wristband</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E0D7] bg-white">
                  <span className="text-[#5A6578]">Mô hình tài khoản:</span>
                  <span className="font-semibold text-emerald-700">Cashless Cabin Account</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E0D7] bg-white">
                  <span className="text-[#5A6578]">Định vị BLE (Tùy chọn):</span>
                  <span className="font-semibold text-[#102A43]">Zone-level Tracking</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E0D7] flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-[#5A6578]">REACT 19 • THREE.JS</span>
              <Link
                to="/pos"
                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-[#102A43] hover:bg-[#0B1F33] text-white text-[11px] font-semibold rounded-lg shadow-xs transition-colors"
              >
                <span>Mở POS</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A572]" />
              </Link>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}

export default DashboardPage;
