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
  ExternalLink,
  User,
  PhoneCall,
  Clock,
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
    <div className="min-h-screen bg-[#040814] text-slate-100 flex flex-col noise-overlay antialiased selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* Luxury Resort Passenger Header */}
      <header className="sticky top-0 z-40 bg-[#050b1a]/85 backdrop-blur-2xl border-b border-cyan-500/15 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Resort Brand & Ship Name */}
            <Link
              to="/passenger-home"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl p-1"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-600/30 via-cyan-500/10 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/10 group-hover:border-cyan-400/60 transition-all">
                <Ship className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif tracking-wider text-base sm:text-lg text-white font-bold leading-tight">
                    GRAND PEARL
                  </span>
                  <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 border border-cyan-400/20 uppercase font-semibold">
                    VOYAGER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Guest Experience Portal</p>
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
                      `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/10 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 opacity-80" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Guest Cabin & Status Widget */}
            <div className="flex items-center gap-3">
              {/* Ship Connectivity Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Ship Wi-Fi</span>
              </div>

              {/* Guest Profile Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition-all">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500/20 to-cyan-500/20 border border-amber-400/30 flex items-center justify-center text-amber-200">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-100 leading-tight truncate max-w-[140px]">
                    {guestProfile.name}
                  </p>
                  <p className="text-[10px] font-mono text-cyan-400/90">
                    Phòng {guestProfile.cabin} • {guestProfile.category}
                  </p>
                </div>
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white transition-colors"
                aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu khách'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-cyan-500/15 bg-[#050b1a]/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="p-3 mb-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">{guestProfile.name}</p>
                <p className="text-[11px] font-mono text-cyan-400">
                  Phòng {guestProfile.cabin} • {guestProfile.category} (ID: #{passengerId})
                </p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Wifi className="w-3 h-3" /> Online
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
                      `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 opacity-80 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" /> Giờ du thuyền: 19:35 (UTC+7)
              </span>
              <Link
                to="/"
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-medium"
              >
                Giao diện Quản trị <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Passenger Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* Guest Resort Footer */}
      <footer className="border-t border-white/5 bg-[#030611]/80 backdrop-blur-xl py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <PhoneCall className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Dịch Vụ Quản Gia & Lễ Tân 24/7: Bấm phím <strong className="text-white">0</strong> từ điện thoại phòng hoặc gặp trực tiếp tại <strong className="text-white">Sảnh Deck 4 Atrium</strong>.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-slate-500">Grand Pearl Voyager • Stateroom Portal</span>
            <Link
              to="/"
              className="text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Dành cho Thủy Thủ Đoàn <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </footer>

      {/* Bottom Mobile Dock Navigation (Touch-Friendly Quick Actions on Small Screens) */}
      <nav
        aria-label="Điều hướng nhanh trên thiết bị di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050b1a]/95 backdrop-blur-xl border-t border-cyan-500/20 px-2 py-1.5 flex items-center justify-around shadow-2xl"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-medium transition-all min-w-[56px] ${
                  isActive ? 'text-cyan-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
