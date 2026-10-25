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
  ArrowUpRight,
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
    { to: '/', label: 'Dashboard Tổng quan', icon: Compass, code: '01' },
    { to: '/ships', label: 'Quản lý Đội tàu', icon: Ship, code: '02' },
    { to: '/admin/cruise-area-policies', label: 'Khu vực & Chính sách', icon: Ship, code: '03' },
    { to: '/itinerary', label: 'Hải trình & Cảng dừng', icon: MapPin, code: '04' },
    { to: '/excursions', label: 'Tour Trên Bờ (Excursion)', icon: Navigation, code: '05' },
    { to: '/excursion-attendance', label: 'Điểm Danh Tour Bờ', icon: Users, code: '06' },
    { to: '/activities', label: 'Hoạt động & Excursion', icon: Activity, code: '07' },
    { to: '/pos', label: 'POS & Chi tiêu Onboard', icon: CreditCard, code: '08' },
    { to: '/passengers', label: 'Hành khách & Check-in', icon: Users, code: '09' },
    { to: '/embarkation', label: 'Cảng Đón Khách (Terminal)', icon: Ship, code: '10' },
    { to: '/billing/settlement', label: 'Tất toán & Hoá đơn', icon: Receipt, code: '11' },
    { to: '/reports/operational', label: 'Báo Cáo Doanh Thu (Audit)', icon: Receipt, code: '12' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#171717] flex flex-col md:flex-row editorial-grid antialiased selection:bg-[#D9FF43] selection:text-[#171717]">
      {/* Editorial Architectural Neo-Brutalist Sidebar */}
      <aside className="w-full md:w-68 bg-[#FFFFFF] border-r-2 border-[#171717] p-4 sm:p-5 flex flex-col justify-between shrink-0 shadow-[4px_0px_0px_#171717] z-30">
        <div>
          {/* Brand & Editorial Stamp */}
          <div className="flex items-center gap-3 mb-6 p-2 border-2 border-[#171717] bg-[#E7E4DC] shadow-[2px_2px_0px_#171717]">
            <div className="w-10 h-10 bg-[#171717] text-[#D9FF43] border border-[#171717] flex items-center justify-center font-serif text-2xl font-black italic shadow-inner">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-sm tracking-tighter text-[#171717] leading-none uppercase">
                  CRUISE MANAGER
                </span>
              </div>
              <p className="text-[10px] font-mono font-bold text-[#3155E7] tracking-wider mt-0.5 uppercase">
                MARITIME COMPUTE
              </p>
            </div>
          </div>

          {/* Active Ship Indicator Card */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] p-3 mb-5 shadow-[3px_3px_0px_#171717]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-[#171717] font-bold text-xs uppercase font-display">
                <Ship className="w-3.5 h-3.5 text-[#3155E7]" /> Grand Pearl Voyager
              </span>
              <span className="neo-badge bg-[#D9FF43] text-[#171717]">
                Sailing
              </span>
            </div>
            <p className="text-[10px] text-[#171717]/70 font-mono font-medium">Hạ Long — Đà Nẵng — Phú Quốc</p>
          </div>

          {/* Navigation Section Title */}
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[#171717]/60 px-1 mb-2">
            <span>Navigation Index</span>
            <span>[12]</span>
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
                    `w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-all ${
                      isActive
                        ? 'bg-[#D9FF43] text-[#171717] font-black border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] translate-x-1'
                        : 'text-[#171717] hover:bg-[#E7E4DC] hover:translate-x-0.5 border-2 border-transparent font-bold'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0 text-[#171717]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono opacity-50 shrink-0 ml-1">{item.code}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Backend Gateway Monitor */}
        <div className="mt-6 pt-4 border-t-2 border-[#171717] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#171717] flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Server className="w-3 h-3 text-[#3155E7]" /> Backend Gateway
            </span>
            <button
              onClick={fetchStatus}
              disabled={isCheckingBackend}
              className="p-1 border border-[#171717] bg-[#E7E4DC] hover:bg-[#D9FF43] shadow-[1px_1px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer"
              title="Ping Backend"
            >
              <RefreshCw className={`w-3 h-3 text-[#171717] ${isCheckingBackend ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div
            className={`flex items-center gap-2 p-2 border-2 border-[#171717] text-[10px] font-mono font-bold shadow-[2px_2px_0px_#171717] ${
              backendHealth
                ? 'bg-[#10B981]/20 text-[#171717]'
                : 'bg-[#DC2626]/20 text-[#171717]'
            }`}
          >
            {backendHealth ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
            )}
            <span className="truncate">
              {backendHealth ? `Online (Port 8080 - ${backendHealth.status})` : 'Offline (localhost:8080)'}
            </span>
          </div>
          {backendInfo && (
            <p className="text-[9px] text-[#3155E7] mt-1 text-center truncate font-mono font-bold">
              {backendInfo.projectName} ({backendInfo.version})
            </p>
          )}
          <p className="text-[9px] text-[#171717]/50 mt-1 text-center font-mono font-semibold">EDITION 2026.1 • PRO-SYS</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        {/* Top Editorial Navbar */}
        <header className="h-16 border-b-2 border-[#171717] bg-[#FFFFFF] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_3px_0px_#171717]">
          <div className="flex items-center gap-2">
            <span className="neo-badge bg-[#E7E4DC] text-[#171717] flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#3155E7] border border-[#171717]"></span>
              FLEET TELEMETRY ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/passenger-home"
              className="neo-btn neo-btn-acid text-[11px] py-1.5 px-3 flex items-center gap-1"
              title="Mở Cổng Trải Nghiệm Khách Hàng"
            >
              <span>Cổng Khách Hàng</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-[#171717] bg-[#E7E4DC] px-3 py-1.5 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              <Clock className="w-3.5 h-3.5 text-[#3155E7]" />
              <span>19:35 UTC</span>
            </div>
            <button className="p-2 text-[#171717] bg-white hover:bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#DC2626] border border-[#171717]" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l-2 border-[#171717]">
              <div className="w-8 h-8 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center font-display text-xs font-black">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'HT'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-[#171717] leading-tight font-display">{currentUser.fullName}</p>
                <p className="text-[10px] font-mono font-bold text-[#3155E7] uppercase">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 border-2 border-[#171717] bg-white hover:bg-[#DC2626] hover:text-white shadow-[2px_2px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 transition-colors cursor-pointer"
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

export default MainLayout;
