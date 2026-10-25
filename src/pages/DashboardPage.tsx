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
      {/* Editorial Hero Broadside — Neo-Brutalist Maritime Command */}
      <div className="relative overflow-hidden bg-[#FFFFFF] border-2 border-[#171717] p-6 sm:p-10 lg:p-12 shadow-[6px_6px_0px_#171717]">
        {/* Subtle Architectural Grid Lines */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute h-px bg-[#171717]"
              style={{ top: `${16.6 * (i + 1)}%`, left: 0, right: 0 }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute w-px bg-[#171717]"
              style={{ left: `${12.5 * (i + 1)}%`, top: 0, bottom: 0 }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow / Meta Bar */}
          <div className="inline-flex flex-wrap items-center gap-2 text-xs font-mono text-[#171717] mb-4">
            <span className="neo-badge bg-[#D9FF43] text-[#171717]">
              Frontend Client v1.0.0
            </span>
            <span className="text-[11px] font-mono text-[#171717]/60 font-semibold">• Autonomous AI agents for luxury cruise management</span>
          </div>

          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-[#3155E7] font-black mb-3">
            Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền
          </h2>

          {/* Reference Display Headline with Kinetic Blur Word */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-[-0.04em] text-[#171717] leading-[1.05] mb-5 uppercase">
            Autonomous fleet, <br />
            services that{' '}
            <BlurWord words={['orchestrate', 'navigate', 'elevate', 'synchronize']} />
          </h1>

          <p className="text-[#171717]/80 text-xs sm:text-sm max-w-2xl leading-relaxed mb-8 font-medium">
            Hệ thống quản lý dịch vụ và hoạt động du thuyền thế hệ mới. Tự động hóa lịch trình hải trình, giám sát tour trên bờ, phân bổ xe đưa đón và đối soát POS phi tiền mặt ngoại tuyến.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/excursions"
              className="neo-btn neo-btn-primary flex items-center gap-2 text-xs"
            >
              <Compass className="w-4 h-4 text-[#D9FF43]" /> Khám Phá Shore Excursions
            </Link>
            <Link
              to="/itinerary"
              className="neo-btn neo-btn-secondary flex items-center gap-2 text-xs"
            >
              <MapPin className="w-4 h-4 text-[#3155E7]" /> Hải Trình Du Thuyền
            </Link>
          </div>
        </div>

        {/* Stats Row at bottom of Hero (Editorial Column Layout) */}
        <div className="relative z-10 pt-6 mt-8 border-t-2 border-[#171717] grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
          <div className="p-3 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-3xl font-display font-black text-[#171717] block">2,450</span>
            <span className="text-[10px] font-mono uppercase font-bold text-[#171717]/70 block mt-0.5">passengers onboard</span>
          </div>
          <div className="p-3 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-3xl font-display font-black text-[#171717] block">99.7%</span>
            <span className="text-[10px] font-mono uppercase font-bold text-[#171717]/70 block mt-0.5">on-time all-aboard</span>
          </div>
          <div className="p-3 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-3xl font-display font-black text-[#3155E7] block">&lt;45ms</span>
            <span className="text-[10px] font-mono uppercase font-bold text-[#171717]/70 block mt-0.5">pos sync latency</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Cards — Neo-Brutalist High-Contrast Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Hành khách trên tàu */}
        <div className="neo-card-interactive p-5">
          <div className="flex items-center justify-between text-[#171717] mb-3">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#171717]">Hành khách trên tàu</span>
            <div className="w-8 h-8 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-[#171717]">
            2,450 <span className="text-xs font-mono text-[#171717]/60 font-bold">/ 2,800</span>
          </p>
          <div className="mt-3 flex items-center text-[10px] font-mono font-bold text-[#059669]">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-[#059669]" /> 87.5% công suất phòng
          </div>
        </div>

        {/* Card 2: Hoạt động hôm nay */}
        <div className="neo-card-interactive p-5">
          <div className="flex items-center justify-between text-[#171717] mb-3">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#171717]">Hoạt động hôm nay</span>
            <div className="w-8 h-8 bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-[#171717]">18 Sự kiện</p>
          <div className="mt-3 text-[10px] font-mono font-bold text-[#3155E7]">
            12 Onboard • 6 Shore Excursion
          </div>
        </div>

        {/* Card 3: Doanh thu POS */}
        <div className="neo-card-interactive p-5">
          <div className="flex items-center justify-between text-[#171717] mb-3">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#171717]">Doanh thu POS hôm nay</span>
            <div className="w-8 h-8 bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-[#171717]">
            $42,850 <span className="text-xs font-mono text-[#171717]/60 font-bold">USD</span>
          </p>
          <div className="mt-3 text-[10px] font-mono font-bold text-[#059669]">
            Cashless Onboard Accounts
          </div>
        </div>

        {/* Card 4: An toàn & Tập trung */}
        <div className="neo-card-interactive p-5">
          <div className="flex items-center justify-between text-[#171717] mb-3">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#171717]">An toàn & Tập trung</span>
            <div className="w-8 h-8 bg-[#10B981] text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-[#059669]">100% Onboard</p>
          <div className="mt-3 text-[10px] font-mono font-bold text-[#171717]/70">
            0 khách trễ giờ nhổ neo
          </div>
        </div>
      </div>

      {/* Editorial Grid Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary Preview */}
        <div className="neo-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-[#171717]">
            <div>
              <h3 className="font-display font-black text-base text-[#171717] flex items-center gap-2 uppercase">
                <MapPin className="w-4 h-4 text-[#3155E7]" /> Lịch trình & Điểm dừng du thuyền (Itinerary)
              </h3>
              <p className="text-xs font-mono text-[#171717]/70 mt-0.5">Tiến độ cập cảng theo tuyến hải trình hiện tại</p>
            </div>
            <span className="neo-badge bg-[#E7E4DC] text-[#171717]">
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
                className="flex items-center justify-between p-3.5 border-2 border-[#171717] bg-[#FDFCF7] hover:bg-[#D9FF43]/20 shadow-[2px_2px_0px_#171717] transition-all text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-16 text-[#171717] font-mono font-black text-xs uppercase">{item.day}</span>
                  <div>
                    <p className="font-black text-[#171717] text-sm font-display">{item.port}</p>
                    <p className="text-[11px] font-mono text-[#171717]/70 mt-0.5">{item.time}</p>
                  </div>
                </div>
                <span
                  className={`neo-badge ${
                    item.status === 'Đang diễn ra'
                      ? 'bg-[#D9FF43] text-[#171717]'
                      : item.status === 'Hoàn thành'
                      ? 'bg-[#10B981] text-[#171717]'
                      : 'bg-[#E7E4DC] text-[#171717]'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Offline POS & QR Check-in preview */}
        <div className="neo-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#171717]">
              <h3 className="font-display font-black text-base text-[#171717] flex items-center gap-2 uppercase">
                <QrCode className="w-4 h-4 text-[#3155E7]" /> POS & Offline Sync
              </h3>
              <span className="neo-badge bg-[#D9FF43] text-[#171717]">V2.4</span>
            </div>
            <div className="bg-[#E7E4DC] border-2 border-[#171717] p-3.5 mb-4 text-xs text-[#171717] leading-relaxed font-mono shadow-[2px_2px_0px_#171717]">
              <p className="font-black text-[#171717] uppercase mb-1">Mô hình ngoại tuyến (Offline Ready):</p>
              Thiết bị POS & tablet ghi nhận giao dịch chi tiêu không dùng tiền mặt qua Cruise Card / QR / RFID khi tàu mất sóng và tự động sync khi có mạng.
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 border-2 border-[#171717] bg-white shadow-[1.5px_1.5px_0px_#171717]">
                <span className="text-[#171717]/70 font-bold">Xác thực:</span>
                <span className="font-black text-[#3155E7]">QR Code / RFID Wristband</span>
              </div>
              <div className="flex items-center justify-between p-2.5 border-2 border-[#171717] bg-white shadow-[1.5px_1.5px_0px_#171717]">
                <span className="text-[#171717]/70 font-bold">Mô hình tài khoản:</span>
                <span className="font-black text-[#059669]">Cashless Cabin Account</span>
              </div>
              <div className="flex items-center justify-between p-2.5 border-2 border-[#171717] bg-white shadow-[1.5px_1.5px_0px_#171717]">
                <span className="text-[#171717]/70 font-bold">Định vị BLE (Tùy chọn):</span>
                <span className="font-black text-[#171717]">Zone-level Tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-[#171717] flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] font-bold text-[#171717]/60">REACT 19 • VITE 8</span>
            <Link to="/pos" className="neo-btn neo-btn-acid text-[11px] py-1 px-3 flex items-center gap-1">
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
