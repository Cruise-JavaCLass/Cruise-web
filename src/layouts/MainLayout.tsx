import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  Search,
} from 'lucide-react';
import { checkBackendHealth, getBackendInfo } from '../services/api';
import type { SystemHealth, SystemInfo } from '../services/api';
import { authService } from '../services/authService';
import { CommandPaletteModal } from '../components/ui/CommandPaletteModal';
import { SpotlightCard } from '../components/ui/SpotlightCard';

export function MainLayout() {
  const navigate = useNavigate();
  const [backendHealth, setBackendHealth] = useState<SystemHealth | null>(null);
  const [backendInfo, setBackendInfo] = useState<SystemInfo | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);

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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
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
      className="min-h-screen bg-[#F7F4ED] text-[#252B32] flex flex-col md:flex-row antialiased font-sans selection:bg-[#102A43] selection:text-[#F7F4ED]"
    >
      {/* Luxury Maritime Executive Fleet Console Sidebar */}
      <aside className="w-full md:w-68 bg-white border-r border-[#E5E0D7] p-4 sm:p-5 flex flex-col justify-between shrink-0 z-30 shadow-xs">
        <div>
          {/* Brand Card */}
          <div className="flex items-center gap-3 mb-6 p-2.5 rounded-xl bg-[#F7F4ED] border border-[#E5E0D7]">
            <div className="w-10 h-10 rounded-lg bg-[#102A43] text-[#C5A572] border border-[#C5A572]/30 flex items-center justify-center font-display text-xl font-bold shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-tight text-[#102A43] leading-none uppercase">
                  CRUISE MANAGER
                </span>
              </div>
              <p className="text-[10px] font-mono font-medium text-[#397C80] tracking-wider mt-0.5 uppercase">
                MARITIME COMPUTE
              </p>
            </div>
          </div>

          {/* Active Ship Indicator Card */}
          <SpotlightCard
            spotlightColor="rgba(197, 165, 114, 0.15)"
            borderGlowColor="#C5A572"
            className="bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-xl p-3 mb-5 shadow-xs"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-[#102A43] font-semibold text-xs">
                <Ship className="w-3.5 h-3.5 text-[#397C80]" /> Grand Pearl Voyager
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#102A43] text-[#C5A572] border border-[#C5A572]/30">
                Sailing
              </span>
            </div>
            <p className="text-[10px] text-[#627D98] font-mono">Hạ Long — Đà Nẵng — Phú Quốc</p>
          </SpotlightCard>

          {/* Navigation Section Title */}
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-[#627D98] px-1 mb-2">
            <span>Admin Operations</span>
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
                    `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-[#F7F4ED] text-[#102A43] font-semibold border-l-4 border-[#C5A572] shadow-xs'
                        : 'text-[#627D98] hover:text-[#102A43] hover:bg-[#F7F4ED]/60 border-l-4 border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#C5A572]' : 'text-[#397C80]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#627D98]/70 shrink-0 ml-1">
                        {item.code}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Backend Gateway Monitor */}
        <div className="mt-6 pt-4 border-t border-[#E5E0D7] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#627D98] flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider">
              <Server className="w-3 h-3 text-[#397C80]" /> Backend Gateway
            </span>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={isCheckingBackend}
              className="p-1 rounded-md border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] hover:text-[#102A43] transition-colors cursor-pointer"
              title="Ping Backend"
            >
              <RefreshCw
                className={`w-3 h-3 text-[#102A43] ${isCheckingBackend ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <div
            className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] font-mono font-medium ${
              backendHealth
                ? 'bg-[#EAF2F2] border-[#397C80]/30 text-[#102A43]'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {backendHealth ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#397C80] shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span className="truncate">
              {backendHealth
                ? `Online (Port 8080 - ${backendHealth.status})`
                : 'Offline (localhost:8080)'}
            </span>
          </div>
          {backendInfo && (
            <p className="text-[9px] text-[#397C80] mt-1 text-center truncate font-mono font-medium">
              {backendInfo.projectName} ({backendInfo.version})
            </p>
          )}
          <p className="text-[9px] text-[#627D98] mt-1 text-center font-mono">
            EDITION 2026.1 • PRO-SYS
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto relative">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#E5E0D7] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-md bg-[#F7F4ED] text-[#102A43] flex items-center gap-1.5 border border-[#C5A572]/40">
              <span className="w-2 h-2 rounded-full bg-[#397C80] animate-pulse" />
              FLEET TELEMETRY ACTIVE
            </span>

            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#F7F4ED] hover:bg-white border border-[#E5E0D7] hover:border-[#C5A572] text-xs text-[#627D98] hover:text-[#102A43] transition-all cursor-pointer shadow-xs"
              title="Tìm nhanh phân hệ điều hành (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#397C80]" />
              <span>Tìm nhanh phân hệ...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-[#102A43] rounded border border-[#E5E0D7]">
                Ctrl K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-medium text-[#102A43] bg-[#F7F4ED] px-3 py-1.5 rounded-lg border border-[#E5E0D7]">
              <Clock className="w-3.5 h-3.5 text-[#C5A572]" />
              <span>19:35 UTC</span>
            </div>
            <button
              type="button"
              className="p-2 text-[#627D98] hover:text-[#102A43] rounded-lg border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5E0D7]">
              <div className="w-8 h-8 rounded-full bg-[#102A43] text-[#C5A572] border border-[#C5A572]/40 flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'HT'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-[#102A43] leading-tight">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] font-mono text-[#627D98] uppercase">
                  {currentUser.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg border border-[#E5E0D7] bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-[#627D98] transition-colors cursor-pointer"
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

      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
}

export default MainLayout;
