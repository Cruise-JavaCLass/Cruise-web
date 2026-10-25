import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  Compass,
  Ship,
  QrCode,
  Calendar,
  CreditCard,
  Ticket,
  Sparkles,
  Wifi,
  Menu,
  X,
  User,
  PhoneCall,
  Clock,
  ShieldCheck,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { resolvePassengerId } from '../services/passengerIdentity';

interface GuestProfile {
  name: string;
  cabin: string;
  category: string;
}

export function PassengerLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [guestProfile, setGuestProfile] = useState<GuestProfile>({
    name: 'Alexander Wright',
    cabin: '8012',
    category: 'Suite Class',
  });
  const location = useLocation();

  useEffect(() => {
    // Read stored passenger profile if available
    try {
      const stored = localStorage.getItem('currentPassenger') || sessionStorage.getItem('currentPassenger');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.fullName || parsed?.name) {
          setGuestProfile({
            name: parsed.fullName || parsed.name,
            cabin: parsed.cabinNumber || parsed.cabin || '8012',
            category: parsed.cabinCategory || parsed.category || 'Suite Class',
          });
        }
      }
    } catch {
      // Fallback to default guest profile
    }
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: '/passenger-home', label: 'Trang Chủ', icon: Compass },
    { to: '/boarding-pass', label: 'Thẻ Lên Tàu', icon: QrCode },
    { to: '/my-schedule', label: 'Lịch Trình', icon: Calendar },
    { to: '/passenger/folio', label: 'Ví Chi Tiêu', icon: CreditCard },
    { to: '/excursions/my-passes', label: 'Tour Của Tôi', icon: Ticket },
    { to: '/catalog', label: 'Khám Phá Dịch Vụ', icon: Sparkles },
  ];

  const passengerId = resolvePassengerId() ?? 1;

  return (
    <div
      data-theme="passenger-retro"
      className="min-h-screen bg-[#070B16] text-[#F4F4F0] flex flex-col antialiased selection:bg-[#42E8F5] selection:text-[#070B16] bg-[linear-gradient(to_right,rgba(66,232,245,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(66,232,245,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"
    >
      {/* Retro-Futuristic Maritime Terminal Header */}
      <header className="sticky top-0 z-40 bg-[#10182A]/90 backdrop-blur-md border-b border-[#42E8F5]/20 shadow-[0_4px_20px_rgba(7,11,22,0.8)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            {/* Resort Brand & Ship Name */}
            <Link
              to="/passenger-home"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#42E8F5] p-1"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/40 rounded-lg flex items-center justify-center shadow-[0_0_12px_rgba(66,232,245,0.25)] group-hover:border-[#42E8F5] group-hover:scale-105 transition-all">
                <Ship className="w-5 h-5 text-[#42E8F5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="tracking-widest text-base sm:text-lg text-[#F4F4F0] font-black leading-tight font-display">
                    GRAND PEARL
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#4169FF]/20 text-[#42E8F5] border border-[#42E8F5]/40">
                    VOYAGER
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#A7B4C9]">
                    Guest Experience Portal
                  </p>
                  <span className="hidden sm:inline-block text-[9px] font-mono text-[#42E8F5]/60">
                    LAT 20°57'N • LON 107°04'E
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase tracking-wider rounded-md transition-all ${
                        isActive
                          ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/50 shadow-[0_0_12px_rgba(66,232,245,0.2)]'
                          : 'text-[#A7B4C9] hover:text-[#F4F4F0] hover:bg-[#151F33]/60 border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Guest Cabin & Status Widget */}
            <div className="flex items-center gap-3">
              {/* Ship Connectivity Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-medium text-[#A7B4C9] bg-[#151F33] px-2.5 py-1.5 rounded-md border border-[#42E8F5]/20">
                <Wifi className="w-3.5 h-3.5 text-[#42E8F5] animate-pulse" />
                <span className="text-[#42E8F5]">SHIP WI-FI</span>
              </div>

              {/* Guest Profile Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#151F33] border border-[#42E8F5]/30 rounded-lg">
                <div className="w-8 h-8 bg-[#10182A] text-[#42E8F5] border border-[#42E8F5]/40 rounded-full flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-[#F4F4F0] leading-tight truncate max-w-[140px]">
                    {guestProfile.name}
                  </p>
                  <p className="text-[10px] font-mono text-[#FFBD59] uppercase tracking-wider">
                    Phòng {guestProfile.cabin} • {guestProfile.category}
                  </p>
                </div>
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 bg-[#151F33] border border-[#42E8F5]/30 rounded-md text-[#42E8F5] hover:bg-[#10182A] transition-colors cursor-pointer"
                aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu khách'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#42E8F5]/20 bg-[#10182A] px-4 py-4 space-y-3 shadow-2xl">
            <div className="p-3 bg-[#151F33] border border-[#42E8F5]/20 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#F4F4F0] uppercase tracking-wider">{guestProfile.name}</p>
                <p className="text-[10px] font-mono text-[#FFBD59] uppercase">
                  Phòng {guestProfile.cabin} • {guestProfile.category} (ID: #{passengerId})
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#42E8F5]/10 text-[#42E8F5] border border-[#42E8F5]/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#42E8F5] animate-pulse" /> Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 text-xs font-mono font-semibold uppercase rounded-md transition-all ${
                        isActive
                          ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/60 shadow-[0_0_10px_rgba(66,232,245,0.2)]'
                          : 'bg-[#151F33]/60 text-[#A7B4C9] border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#42E8F5]/15 flex items-center justify-between text-[11px] font-mono text-[#A7B4C9]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#42E8F5]" /> Giờ du thuyền: 19:35 UTC+7
              </span>
              <Link
                to="/login"
                className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-[#FFBD59]/15 text-[#FFBD59] border border-[#FFBD59]/40 flex items-center gap-1 hover:bg-[#FFBD59]/25 transition-colors"
              >
                Crew Portal <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Passenger Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* Guest Futuristic Footer */}
      <footer className="border-t border-[#42E8F5]/20 bg-[#10182A] py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#A7B4C9]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <div className="w-7 h-7 bg-[#151F33] border border-[#42E8F5]/40 rounded flex items-center justify-center shrink-0 text-[#42E8F5]">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-xs">
              Dịch Vụ Quản Gia & Lễ Tân 24/7: Phím <strong className="text-[#42E8F5] bg-[#151F33] px-1.5 py-0.5 rounded border border-[#42E8F5]/30">0</strong> từ điện thoại phòng hoặc gặp trực tiếp tại <strong className="text-[#F4F4F0] underline decoration-[#42E8F5] decoration-1 underline-offset-2">Sảnh Deck 4 Atrium</strong>.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-[#A7B4C9]/80">Grand Pearl Voyager • Stateroom Portal</span>
            <Link
              to="/login"
              className="text-[10px] font-mono font-medium py-1 px-2.5 rounded bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/30 flex items-center gap-1 hover:border-[#42E8F5] transition-all"
            >
              Đăng nhập Thủy Thủ Đoàn <ShieldCheck className="w-3 h-3 text-[#42E8F5]" />
            </Link>
          </div>
        </div>
      </footer>

      {/* Bottom Mobile Dock Navigation */}
      <nav
        aria-label="Điều hướng nhanh trên thiết bị di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#10182A]/95 backdrop-blur-lg border-t border-[#42E8F5]/20 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(7,11,22,0.8)]"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-mono font-medium uppercase rounded transition-all min-w-[56px] ${
                  isActive ? 'bg-[#151F33] text-[#42E8F5] border border-[#42E8F5]/50 shadow-[0_0_8px_rgba(66,232,245,0.25)]' : 'text-[#A7B4C9]'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default PassengerLayout;
