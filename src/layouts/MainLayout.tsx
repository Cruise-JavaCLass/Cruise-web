import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Ship,
  Users,
  CreditCard,
  MapPin,
  Activity,
  Bell,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Server,
  Navigation,
  Receipt,
  LogOut,
} from 'lucide-react';
import { checkBackendHealth, getBackendInfo } from '../services/api';
import type { SystemHealth, SystemInfo } from '../services/api';
import { authService } from '../services/authService';

export function MainLayout() {
  const navigate = useNavigate();
  const [backendHealth, setBackendHealth] = useState<SystemHealth | null>(null);
  const [backendInfo, setBackendInfo] = useState<SystemInfo | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  const currentUser = authService.getCurrentUser() || {
    id: 1,
    username: 'admin',
    fullName: 'Huy Trần Gia',
    role: 'SYSTEM_ADMIN' as const,
  };

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

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { to: '/', label: 'Dashboard Tổng quan', icon: Compass },
    { to: '/ships', label: 'Quản lý Đội tàu', icon: Ship },
    { to: '/admin/cruise-area-policies', label: 'Quản lý Khu vực & Chính sách', icon: Ship },
    { to: '/itinerary', label: 'Hải trình & Cảng dừng', icon: MapPin },
    { to: '/excursions', label: 'Tour Trên Bờ (Excursion)', icon: Navigation },
    { to: '/excursion-attendance', label: 'Điểm Danh Tour Bờ', icon: Users },
    { to: '/activities', label: 'Hoạt động & Excursion', icon: Activity },
    { to: '/pos', label: 'POS & Chi tiêu Onboard', icon: CreditCard },
    { to: '/passengers', label: 'Hành khách & Check-in', icon: Users },
    { to: '/embarkation', label: 'Cảng Đón Khách (Terminal)', icon: Ship },
    { to: '/billing/settlement', label: 'Tất toán & Hoá đơn', icon: Receipt },
    { to: '/reports/operational', label: 'Báo Cáo Doanh Thu (Audit)', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col md:flex-row noise-overlay antialiased selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* Reference Architectural Sidebar */}
      <aside className="w-full md:w-64 bg-[#030303] backdrop-blur-2xl border-r border-white/5 p-5 flex flex-col justify-between shrink-0 shadow-2xl z-30">
        <div>
          {/* Brand & Identity — Reference Style */}
          <div className="flex items-center gap-3 mb-8 px-1">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner group">
              <span className="font-serif italic text-xl text-white font-semibold group-hover:scale-110 transition-transform">C</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-widest text-white leading-none uppercase">CRUISE MANAGER</span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400 font-medium tracking-widest mt-1">MARITIME COMPUTE</p>
            </div>
          </div>

          {/* Active Ship Status Widget */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-6 relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-200 font-medium text-xs">
                <Ship className="w-3.5 h-3.5 text-cyan-400" /> Grand Pearl Voyager
              </span>
              <span className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded tracking-wide uppercase">
                Sailing
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Route: Hạ Long — Đà Nẵng — Phú Quốc</p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs tracking-wide transition-all ${
                      isActive
                        ? 'bg-white/10 text-white font-medium border border-white/15 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 opacity-80" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Backend Connectivity Status */}
        <div className="mt-6 pt-5 border-t border-white/5 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
              <Server className="w-3 h-3 text-slate-400" /> Backend Gateway
            </span>
            <button
              onClick={fetchStatus}
              disabled={isCheckingBackend}
              className="text-slate-400 hover:text-cyan-400 transition-colors p-1 cursor-pointer"
              title="Ping Backend"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-mono ${
              backendHealth
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
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
            <p className="text-[10px] text-cyan-400/80 mt-1.5 text-center truncate font-mono">
              {backendInfo.projectName} ({backendInfo.version})
            </p>
          )}
          <p className="text-[10px] text-slate-600 mt-1 text-center font-mono">v0-architecture • 2026.1</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 bg-[#0a0c13]/60 backdrop-blur-2xl px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-white/[0.04] text-slate-300 border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Autonomous Cruise Operations
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/passenger-home"
              className="hidden md:flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-xl transition-all"
              title="Mở Cổng Trải Nghiệm Khách Hàng"
            >
              <span>Cổng Khách Hàng ↗</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time: 19:35 (UTC)</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/5">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/5">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center font-display text-xs font-bold text-cyan-300">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'HT'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium text-slate-200 leading-tight">{currentUser.fullName}</p>
                <p className="text-[10px] font-mono text-cyan-400">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Đăng xuất thủy thủ đoàn"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="relative z-10 p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
