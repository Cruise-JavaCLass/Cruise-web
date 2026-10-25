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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlurWord } from '../components/common/BlurWord';

export function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Soft Editorial Hero Banner */}
      <div className="relative overflow-hidden bg-white border border-[#E5E7EB] rounded-[18px] p-6 sm:p-10 lg:p-12 shadow-xs">
        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow / Meta Bar */}
          <div className="inline-flex flex-wrap items-center gap-2 text-xs font-mono text-[#20242C] mb-4">
            <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-[6px] bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20">
              Frontend Client v1.0.0
            </span>
            <span className="text-[11px] font-mono text-[#687080]">• Autonomous AI agents for luxury cruise management</span>
          </div>

          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#5277D9] font-bold mb-3">
            Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền
          </h2>

          {/* Reference Display Headline with Kinetic Blur Word */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-[#20242C] leading-[1.1] mb-5 uppercase">
            Autonomous fleet, <br />
            services that{' '}
            <BlurWord words={['orchestrate', 'navigate', 'elevate', 'synchronize']} />
          </h1>

          <p className="text-[#687080] text-xs sm:text-sm max-w-2xl leading-relaxed mb-8">
            Hệ thống quản lý dịch vụ và hoạt động du thuyền thế hệ mới. Tự động hóa lịch trình hải trình, giám sát tour trên bờ, phân bổ xe đưa đón và đối soát POS phi tiền mặt ngoại tuyến.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/excursions"
              className="editorial-btn-primary flex items-center gap-2 text-xs py-2.5 px-4 shadow-xs"
            >
              <Compass className="w-4 h-4 text-white" /> Khám Phá Shore Excursions
            </Link>
            <Link
              to="/itinerary"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-[#E5E7EB] bg-white text-xs font-semibold text-[#20242C] hover:bg-[#F1F3F7] transition-colors shadow-xs"
            >
              <MapPin className="w-4 h-4 text-[#5277D9]" /> Hải Trình Du Thuyền
            </Link>
          </div>
        </div>

        {/* Stats Row at bottom of Hero */}
        <div className="relative z-10 pt-6 mt-8 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
          <div className="p-3.5 bg-[#F1F3F7] rounded-[12px] border border-[#E5E7EB]">
            <span className="text-3xl font-display font-bold text-[#20242C] block tabular-nums">2,450</span>
            <span className="text-[10px] font-mono uppercase font-medium text-[#687080] block mt-0.5">passengers onboard</span>
          </div>
          <div className="p-3.5 bg-[#F1F3F7] rounded-[12px] border border-[#E5E7EB]">
            <span className="text-3xl font-display font-bold text-[#20242C] block tabular-nums">99.7%</span>
            <span className="text-[10px] font-mono uppercase font-medium text-[#687080] block mt-0.5">on-time all-aboard</span>
          </div>
          <div className="p-3.5 bg-[#F1F3F7] rounded-[12px] border border-[#E5E7EB]">
            <span className="text-3xl font-display font-bold text-[#5277D9] block tabular-nums">&lt;45ms</span>
            <span className="text-[10px] font-mono uppercase font-medium text-[#687080] block mt-0.5">pos sync latency</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Cards — Soft Editorial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Hành khách trên tàu */}
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#20242C] mb-3">
            <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#687080]">Hành khách trên tàu</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#EEF2FF] text-[#5277D9] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-[#20242C] tabular-nums">
            2,450 <span className="text-xs font-mono text-[#687080] font-normal">/ 2,800</span>
          </p>
          <div className="mt-3 flex items-center text-[10px] font-mono font-medium text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> 87.5% công suất phòng
          </div>
        </div>

        {/* Card 2: Hoạt động hôm nay */}
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#20242C] mb-3">
            <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#687080]">Hoạt động hôm nay</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#EEF2FF] text-[#5277D9] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-[#20242C]">18 Sự kiện</p>
          <div className="mt-3 text-[10px] font-mono font-medium text-[#5277D9]">
            12 Onboard • 6 Shore Excursion
          </div>
        </div>

        {/* Card 3: Doanh thu POS */}
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#20242C] mb-3">
            <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#687080]">Doanh thu POS hôm nay</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#EEF2FF] text-[#5277D9] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-[#20242C] tabular-nums">
            $42,850 <span className="text-xs font-mono text-[#687080] font-normal">USD</span>
          </p>
          <div className="mt-3 text-[10px] font-mono font-medium text-emerald-600">
            Cashless Onboard Accounts
          </div>
        </div>

        {/* Card 4: An toàn & Tập trung */}
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 shadow-xs hover:border-[#CBD5E1] transition-all">
          <div className="flex items-center justify-between text-[#20242C] mb-3">
            <span className="text-[10px] font-mono uppercase font-semibold tracking-wider text-[#687080]">An toàn & Tập trung</span>
            <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-emerald-600">100% Onboard</p>
          <div className="mt-3 text-[10px] font-mono font-medium text-[#687080]">
            0 khách trễ giờ nhổ neo
          </div>
        </div>
      </div>

      {/* Grid Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary Preview */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 lg:col-span-2 shadow-xs">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E5E7EB]">
            <div>
              <h3 className="font-display font-bold text-base text-[#20242C] flex items-center gap-2 uppercase">
                <MapPin className="w-4 h-4 text-[#5277D9]" /> Lịch trình & Điểm dừng du thuyền (Itinerary)
              </h3>
              <p className="text-xs text-[#687080] mt-0.5">Tiến độ cập cảng theo tuyến hải trình hiện tại</p>
            </div>
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-[6px] bg-[#F1F3F7] text-[#687080]">
              5 Ngày 4 Đêm
            </span>
          </div>
          <div className="space-y-3">
            {[
              { day: 'Ngày 1', port: 'Cảng Quốc Tế Tuần Châu (Hạ Long)', time: 'Xuất bến 16:00', status: 'Hoàn thành' },
              { day: 'Ngày 2', port: 'Cảng Tiên Sa (Đà Nẵng & Hội An)', time: '08:00 — 20:00', status: 'Đang diễn ra' },
              { day: 'Ngày 3', port: 'Nha Trang Bay & Đảo Hòn Tre', time: '07:30 — 18:00', status: 'Kế tiếp' },
              { day: 'Ngày 4', port: 'Cảng An Thới (Phú Quốc)', time: '09:00 — 22:00', status: 'Lên lịch' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3.5 rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F1F3F7] transition-all text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-16 text-[#20242C] font-mono font-bold text-xs uppercase">{item.day}</span>
                  <div>
                    <p className="font-semibold text-[#20242C] text-sm">{item.port}</p>
                    <p className="text-[11px] font-mono text-[#687080] mt-0.5">{item.time}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-[6px] ${
                    item.status === 'Đang diễn ra'
                      ? 'bg-[#EEF2FF] text-[#5277D9]'
                      : item.status === 'Hoàn thành'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Offline POS & QR Check-in preview */}
        <div className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E7EB]">
              <h3 className="font-display font-bold text-base text-[#20242C] flex items-center gap-2 uppercase">
                <QrCode className="w-4 h-4 text-[#5277D9]" /> POS & Offline Sync
              </h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-[6px] bg-[#EEF2FF] text-[#5277D9]">V2.4</span>
            </div>
            <div className="bg-[#F1F3F7] border border-[#E5E7EB] rounded-[10px] p-3.5 mb-4 text-xs text-[#20242C] leading-relaxed">
              <p className="font-semibold text-[#20242C] uppercase mb-1">Mô hình ngoại tuyến (Offline Ready):</p>
              Thiết bị POS & tablet ghi nhận giao dịch chi tiêu không dùng tiền mặt qua Cruise Card / QR / RFID khi tàu mất sóng và tự động sync khi có mạng.
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-[8px] border border-[#E5E7EB] bg-white">
                <span className="text-[#687080]">Xác thực:</span>
                <span className="font-semibold text-[#5277D9]">QR Code / RFID Wristband</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-[8px] border border-[#E5E7EB] bg-white">
                <span className="text-[#687080]">Mô hình tài khoản:</span>
                <span className="font-semibold text-emerald-600">Cashless Cabin Account</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-[8px] border border-[#E5E7EB] bg-white">
                <span className="text-[#687080]">Định vị BLE (Tùy chọn):</span>
                <span className="font-semibold text-[#20242C]">Zone-level Tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#687080]">REACT 19 • VITE 8</span>
            <Link to="/pos" className="editorial-btn-primary text-[11px] py-1.5 px-3 flex items-center gap-1 rounded-[8px]">
              <span>Mở POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
