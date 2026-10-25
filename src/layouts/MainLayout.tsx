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
    <div
      data-theme="admin-editorial"
      className="min-h-screen bg-[#F6F7F9] text-[#20242C] flex flex-col md:flex-row antialiased font-sans selection:bg-[#5277D9] selection:text-white"
    >
      {/* Soft Editorial Modern SaaS Sidebar */}
      <aside className="w-full md:w-68 bg-white border-r border-[#E5E7EB] p-4 sm:p-5 flex flex-col justify-between shrink-0 z-30">
        <div>
          {/* Brand Card */}
          <div className="flex items-center gap-3 mb-6 p-2.5 rounded-[12px] bg-[#F1F3F7] border border-[#E5E7EB]">
            <div className="w-10 h-10 rounded-[10px] bg-[#20242C] text-white flex items-center justify-center font-display text-xl font-bold shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-tight text-[#20242C] leading-none uppercase">
                  CRUISE MANAGER
                </span>
              </div>
              <p className="text-[10px] font-mono font-medium text-[#5277D9] tracking-wider mt-0.5 uppercase">
                MARITIME COMPUTE
              </p>
            </div>
          </div>

          {/* Active Ship Indicator Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-3 mb-5 shadow-xs">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-[#20242C] font-semibold text-xs">
                <Ship className="w-3.5 h-3.5 text-[#5277D9]" /> Grand Pearl Voyager
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-[6px] bg-[#EEF2FF] text-[#5277D9]">
                Sailing
              </span>
            </div>
            <p className="text-[10px] text-[#687080] font-mono">Hạ Long — Đà Nẵng — Phú Quốc</p>
          </div>

          {/* Navigation Section Title */}
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-[#687080] px-1 mb-2">
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
                    `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-[10px] transition-all ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#5277D9] font-semibold shadow-xs'
                        : 'text-[#687080] hover:text-[#20242C] hover:bg-[#F6F7F9]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0 text-[#5277D9]" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#687080]/60 shrink-0 ml-1">{item.code}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Backend Gateway Monitor */}
        <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#687080] flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider">
              <Server className="w-3 h-3 text-[#5277D9]" /> Backend Gateway
            </span>
            <button
              onClick={fetchStatus}
              disabled={isCheckingBackend}
              className="p-1 rounded-[6px] border border-[#E5E7EB] bg-[#F1F3F7] hover:bg-[#EEF2FF] hover:text-[#5277D9] transition-colors cursor-pointer"
              title="Ping Backend"
            >
              <RefreshCw className={`w-3 h-3 text-[#20242C] ${isCheckingBackend ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div
            className={`flex items-center gap-2 p-2 rounded-[8px] border text-[10px] font-mono font-medium ${
              backendHealth
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {backendHealth ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span className="truncate">
              {backendHealth ? `Online (Port 8080 - ${backendHealth.status})` : 'Offline (localhost:8080)'}
            </span>
          </div>
          {backendInfo && (
            <p className="text-[9px] text-[#5277D9] mt-1 text-center truncate font-mono font-medium">
              {backendInfo.projectName} ({backendInfo.version})
            </p>
          )}
          <p className="text-[9px] text-[#687080] mt-1 text-center font-mono">EDITION 2026.1 • PRO-SYS</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-[6px] bg-[#EEF2FF] text-[#5277D9] flex items-center gap-1.5 border border-[#5277D9]/20">
              <span className="w-2 h-2 rounded-full bg-[#5277D9]"></span>
              FLEET TELEMETRY ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/passenger-home"
              className="editorial-btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
              title="Mở Cổng Trải Nghiệm Khách Hàng"
            >
              <span>Cổng Khách Hàng</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-medium text-[#687080] bg-[#F1F3F7] px-3 py-1.5 rounded-[8px] border border-[#E5E7EB]">
              <Clock className="w-3.5 h-3.5 text-[#5277D9]" />
              <span>19:35 UTC</span>
            </div>
            <button className="p-2 text-[#687080] hover:text-[#20242C] rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F6F7F9] transition-colors relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5E7EB]">
              <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 flex items-center justify-center font-bold text-xs">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'HT'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-[#20242C] leading-tight">{currentUser.fullName}</p>
                <p className="text-[10px] font-mono text-[#687080] uppercase">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-[#687080] transition-colors cursor-pointer"
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
