import {
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  MapPin,
  QrCode,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlurWord } from '../components/common/BlurWord';

export function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section — Inspired by Reference Project Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-[#000000] border border-white/10 p-6 sm:p-10 lg:p-12 shadow-2xl min-h-[380px] flex flex-col justify-between">
        {/* Subtle grid lines from reference */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute h-px bg-white/10"
              style={{ top: `${16.6 * (i + 1)}%`, left: 0, right: 0 }}
            />
          ))}
          {[...Array(8)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute w-px bg-white/10"
              style={{ left: `${12.5 * (i + 1)}%`, top: 0, bottom: 0 }}
            />
          ))}
        </div>

        {/* Background video loop from reference project — exact reference hero implementation */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            muted
            loop
            playsInline
            tabIndex={-1}
            disableRemotePlayback
            className="w-full h-full object-cover object-center opacity-80"
          >
            <source
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/bg-hero-0BnFGdr81Ifnj3WbBZoNt1KE4D5DMT.mp4"
              type="video/mp4"
            />
          </video>
          {/* Subtle gradient overlays to ensure text readability on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
        </div>

        <div className="relative z-10 max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-3 text-xs font-mono text-white/50 mb-4">
            <span className="w-8 h-px bg-white/30" />
            <span>Frontend Client v1.0.0</span>
            <span>• Autonomous AI agents for luxury cruise management</span>
          </div>

          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-400 font-semibold mb-2">
            Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền
          </h2>

          {/* Reference Display Headline with Kinetic Blur Word */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-[-0.03em] text-white leading-[1.08] mb-5">
            Autonomous fleet, <br />
            services that{' '}
            <BlurWord words={['orchestrate', 'navigate', 'elevate', 'synchronize']} />
          </h1>

          <p className="text-slate-300/80 text-xs sm:text-sm max-w-xl leading-relaxed mb-8 font-normal">
            Hệ thống quản lý dịch vụ và hoạt động du thuyền thế hệ mới. Tự động hóa lịch trình hải trình, giám sát tour trên bờ, phân bổ xe đưa đón và đối soát POS phi tiền mặt ngoại tuyến.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/excursions"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-slate-100 rounded-full text-xs font-semibold tracking-tight shadow-lg transition-all"
            >
              <Compass className="w-4 h-4" /> Khám Phá Shore Excursions
            </Link>
            <Link
              to="/itinerary"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10 rounded-full text-xs font-medium transition-all"
            >
              <MapPin className="w-4 h-4 text-cyan-400" /> Hải Trình Du Thuyền
            </Link>
          </div>
        </div>

        {/* Stats Row at bottom of Hero (from reference hero-section) */}
        <div className="relative z-10 pt-8 mt-6 border-t border-white/5 grid grid-cols-3 gap-6 max-w-xl">
          <div>
            <span className="text-2xl sm:text-3xl font-display text-white block">2,450</span>
            <span className="text-[11px] font-mono text-white/40 block mt-0.5">passengers onboard</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-display text-white block">99.7%</span>
            <span className="text-[11px] font-mono text-white/40 block mt-0.5">on-time all-aboard</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-display text-white block">&lt;45ms</span>
            <span className="text-[11px] font-mono text-white/40 block mt-0.5">pos sync latency</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Cards - each with its own unique distinct image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Hành khách trên tàu - Isolated Sandbox / Capsule */}
        <div className="relative overflow-hidden bg-[#030303]/65 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 p-5 rounded-2xl transition-all shadow-xl group">
          <div className="absolute right-0 top-0 bottom-0 w-3/5 opacity-30 pointer-events-none overflow-hidden group-hover:opacity-45 transition-opacity">
            <img
              src="/images/isolated.jpg"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center filter contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/70 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Hành khách trên tàu</span>
              <Users className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-display font-normal text-white">
              2,450 <span className="text-xs font-mono text-slate-400">/ 2,800</span>
            </p>
            <div className="mt-2.5 flex items-center text-[11px] font-mono text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> 87.5% công suất phòng
            </div>
          </div>
        </div>

        {/* Card 2: Hoạt động hôm nay - Permissions Sphere */}
        <div className="relative overflow-hidden bg-[#030303]/65 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 p-5 rounded-2xl transition-all shadow-xl group">
          <div className="absolute right-0 top-0 bottom-0 w-3/5 opacity-30 pointer-events-none overflow-hidden group-hover:opacity-45 transition-opacity">
            <img
              src="/images/permissions.jpg"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center filter contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/70 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Hoạt động hôm nay</span>
              <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-display font-normal text-white">18 Sự kiện</p>
            <div className="mt-2.5 text-[11px] font-mono text-cyan-300">
              12 Onboard • 6 Shore Excursion
            </div>
          </div>
        </div>

        {/* Card 3: Doanh thu POS - Encrypted Vault */}
        <div className="relative overflow-hidden bg-[#030303]/65 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 p-5 rounded-2xl transition-all shadow-xl group">
          <div className="absolute right-0 top-0 bottom-0 w-3/5 opacity-30 pointer-events-none overflow-hidden group-hover:opacity-45 transition-opacity">
            <img
              src="/images/encrypted.jpg"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center filter contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/70 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Doanh thu POS hôm nay</span>
              <DollarSign className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-display font-normal text-white">
              $42,850 <span className="text-xs font-mono text-slate-400">USD</span>
            </p>
            <div className="mt-2.5 text-[11px] font-mono text-emerald-400">
              Cashless Onboard Accounts
            </div>
          </div>
        </div>

        {/* Card 4: An toàn & Tập trung - Shield & Audit */}
        <div className="relative overflow-hidden bg-[#030303]/65 backdrop-blur-xl border border-white/10 hover:border-cyan-500/40 p-5 rounded-2xl transition-all shadow-xl group">
          <div className="absolute right-0 top-0 bottom-0 w-3/5 opacity-30 pointer-events-none overflow-hidden group-hover:opacity-45 transition-opacity">
            <img
              src="/images/audit.jpg"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-center filter contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/70 to-transparent" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">An toàn & Tập trung</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl sm:text-3xl font-display font-normal text-emerald-400">100% Onboard</p>
            <div className="mt-2.5 text-[11px] font-mono text-slate-400">
              0 khách trễ giờ nhổ neo
            </div>
          </div>
        </div>
      </div>

      {/* Module Details Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary Preview */}
        <div className="relative overflow-hidden bg-[#030303]/65 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2 shadow-xl">
          {/* Subtle bridge background artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-20 pointer-events-none overflow-hidden">
            <img
              src="/images/bridge.png"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover object-right filter grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030303] via-[#030303]/70 to-transparent" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" /> Lịch trình & Điểm dừng du thuyền (Itinerary)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Tiến độ cập cảng theo tuyến hải trình hiện tại</p>
              </div>
              <span className="text-xs font-mono text-cyan-300 font-semibold px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                Hành trình 5 Ngày 4 Đêm
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
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="w-14 text-slate-400 font-mono font-bold tracking-wide">{item.day}</span>
                    <div>
                      <p className="font-semibold text-slate-100 text-sm">{item.port}</p>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                      item.status === 'Đang diễn ra'
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : item.status === 'Hoàn thành'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Offline POS & QR Check-in preview */}
        <div className="relative overflow-hidden bg-[#030303] border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          {/* Subtle whale artwork background */}
          <div className="absolute right-0 bottom-0 w-3/4 opacity-10 pointer-events-none">
            <img
              src="/images/whale.png"
              alt=""
              aria-hidden="true"
              className="w-full h-auto object-contain object-bottom-right"
            />
          </div>

          <div className="relative z-10">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-amber-400" /> POS & Offline Sync
            </h3>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 mb-4 text-xs text-amber-200/90 leading-relaxed font-mono">
              <p className="font-semibold text-amber-300 mb-1">Mô hình ngoại tuyến (Offline Ready):</p>
              Thiết bị POS & tablet ghi nhận giao dịch chi tiêu không dùng tiền mặt qua Cruise Card / QR / RFID khi tàu mất sóng và tự động sync khi có mạng.
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400 font-mono">Xác thực:</span>
                <span className="font-semibold text-cyan-400">QR Code / RFID Wristband</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400 font-mono">Mô hình tài khoản:</span>
                <span className="font-semibold text-emerald-400">Cashless Cabin Account</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-slate-400 font-mono">Định vị BLE (Tùy chọn):</span>
                <span className="font-semibold text-purple-400">Zone-level Tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono text-[11px]">Frontend: React 19 + Vite</span>
            <Link to="/pos" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors">
              Mở POS <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
