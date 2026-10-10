import { useState, useEffect } from 'react';
import {
  Anchor,
  Compass,
  Ship,
  Users,
  CreditCard,
  Calendar,
  MapPin,
  Activity,
  Bell,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  Sparkles,
  QrCode,
  DollarSign,
  ChevronRight,
  Server
} from 'lucide-react';
import { checkBackendHealth, getBackendInfo } from './services/api';
import type { SystemHealth, SystemInfo } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'itinerary' | 'activities' | 'pos' | 'passengers'>('dashboard');
  const [backendHealth, setBackendHealth] = useState<SystemHealth | null>(null);
  const [backendInfo, setBackendInfo] = useState<SystemInfo | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  const fetchStatus = async () => {
    setIsCheckingBackend(true);
    const [health, info] = await Promise.all([checkBackendHealth(), getBackendInfo()]);
    setBackendHealth(health);
    setBackendInfo(info);
    setIsCheckingBackend(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                CRUISE MANAGER
              </h1>
              <p className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">Luxury Activity & POS</p>
            </div>
          </div>

          {/* Ship Status badge */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Ship className="w-3.5 h-3.5 text-cyan-400" /> Grand Pearl Voyager
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">
                Sailing
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Route: Hạ Long — Đà Nẵng — Phú Quốc</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard Tổng quan', icon: Compass },
              { id: 'itinerary', label: 'Hải trình & Cảng dừng', icon: MapPin },
              { id: 'activities', label: 'Hoạt động & Excursion', icon: Activity },
              { id: 'pos', label: 'POS & Chi tiêu Onboard', icon: CreditCard },
              { id: 'passengers', label: 'Hành khách & Check-in', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Backend Connection Widget */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-medium">
              <Server className="w-3.5 h-3.5 text-slate-400" /> Backend Gateway
            </span>
            <button
              onClick={fetchStatus}
              disabled={isCheckingBackend}
              className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
              title="Ping Backend"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
          <div
            className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] ${
              backendHealth
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
            }`}
          >
            {backendHealth ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="truncate">
              {backendHealth ? `Online (Port 8080 - ${backendHealth.status})` : 'Offline (localhost:8080)'}
            </span>
          </div>
          {backendInfo && (
            <p className="text-[10px] text-cyan-400/80 mt-1.5 text-center truncate">
              {backendInfo.projectName} ({backendInfo.version})
            </p>
          )}
          <p className="text-[10px] text-slate-500 mt-1 text-center">Jira: KAN-35 / Story: KAN-37</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-medium">
              Cruise Activity & Service System
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time: 19:35 (UTC)</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors bg-slate-800/50 rounded-lg">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                HT
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">Huy Trần Gia</p>
                <p className="text-[10px] text-slate-400">Operations Lead</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Panels */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 border border-slate-800 p-6 md:p-8 shadow-2xl">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Frontend Client v1.0.0
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền
              </h2>
              <p className="text-slate-300 text-sm mt-2 max-w-2xl">
                Quản lý xuyên suốt hải trình, hoạt động giải trí trên tàu, tour trên bờ, xác thực thẻ QR/RFID và hệ thống tài khoản phi tiền mặt (Cashless POS) hỗ trợ đồng bộ ngoại tuyến.
              </p>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Hành khách trên tàu</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-bold text-white">2,450 <span className="text-xs font-normal text-slate-400">/ 2,800</span></p>
              <div className="mt-2 flex items-center text-[11px] text-emerald-400">
                <TrendingUp className="w-3 h-3 mr-1" /> 87.5% công suất phòng
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Hoạt động hôm nay</span>
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">18 Sự kiện</p>
              <div className="mt-2 text-[11px] text-cyan-300">
                12 Onboard • 6 Shore Excursion
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Doanh thu POS hôm nay</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-white">$42,850 <span className="text-xs font-normal text-slate-400">USD</span></p>
              <div className="mt-2 text-[11px] text-emerald-400">
                Cashless Onboard Accounts
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">An toàn & Tập trung</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400">100% Onboard</p>
              <div className="mt-2 text-[11px] text-slate-400">
                0 khách trễ giờ nhổ neo
              </div>
            </div>
          </div>

          {/* Module Details Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Itinerary Preview */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" /> Lịch trình & Điểm dừng du thuyền (Itinerary)
                </h3>
                <span className="text-xs text-cyan-400 font-medium">Hành trình 5 Ngày 4 Đêm</span>
              </div>
              <div className="space-y-3">
                {[
                  { day: 'Ngày 1', port: 'Cảng Quốc Tế Tuần Châu (Hạ Long)', time: 'Xuất bến 16:00', status: 'Hoàn thành' },
                  { day: 'Ngày 2', port: 'Cảng Tiên Sa (Đà Nẵng & Hội An)', time: '08:00 — 20:00', status: 'Đang diễn ra' },
                  { day: 'Ngày 3', port: 'Nha Trang Bay & Đảo Hòn Tre', time: '07:30 — 18:00', status: 'Kế tiếp' },
                  { day: 'Ngày 4', port: 'Cảng An Thới (Phú Quốc)', time: '09:00 — 22:00', status: 'Lên lịch' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-12 text-slate-400 font-bold">{item.day}</span>
                      <div>
                        <p className="font-medium text-slate-200">{item.port}</p>
                        <p className="text-[11px] text-slate-400">{item.time}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                      item.status === 'Đang diễn ra' ? 'bg-cyan-500/20 text-cyan-300' :
                      item.status === 'Hoàn thành' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Offline POS & QR Check-in preview */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2 mb-4">
                  <QrCode className="w-4 h-4 text-amber-400" /> POS & Offline Sync
                </h3>
                <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 mb-4 text-xs text-amber-200/90">
                  <p className="font-semibold text-amber-300 mb-1">Mô hình ngoại tuyến (Offline Ready):</p>
                  Thiết bị POS & tablet ghi nhận giao dịch chi tiêu không dùng tiền mặt qua Cruise Card / QR / RFID khi tàu mất sóng và tự động sync khi có mạng.
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                    <span>Xác thực:</span>
                    <span className="font-semibold text-cyan-400">QR Code / RFID Wristband</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                    <span>Mô hình tài khoản:</span>
                    <span className="font-semibold text-emerald-400">Cashless Cabin Account</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                    <span>Định vị BLE (Tùy chọn):</span>
                    <span className="font-semibold text-purple-400">Zone-level Tracking</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Frontend: React 19 + Vite</span>
                <span className="text-cyan-400 font-medium flex items-center gap-1">
                  Ready <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
