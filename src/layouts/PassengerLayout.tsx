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
    <div className="min-h-screen bg-[#F7F5F0] text-[#171717] flex flex-col editorial-grid antialiased selection:bg-[#D9FF43] selection:text-[#171717]">
      {/* Editorial Neo-Brutalism Guest Header */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b-2 border-[#171717] shadow-[0_4px_0px_#171717]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            {/* Resort Brand & Ship Name */}
            <Link
              to="/passenger-home"
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3155E7] p-1"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#171717] text-[#D9FF43] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
                <Ship className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif tracking-tight text-base sm:text-lg text-[#171717] font-black italic leading-tight">
                    GRAND PEARL
                  </span>
                  <span className="neo-badge bg-[#D9FF43] text-[#171717]">
                    VOYAGER
                  </span>
                </div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#171717]/70 font-bold">Guest Experience Portal</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                        isActive
                          ? 'bg-[#171717] text-[#F7F5F0] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#3155E7] -translate-y-0.5'
                          : 'text-[#171717] hover:bg-[#E7E4DC] border-2 border-transparent'
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
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-bold text-[#171717] bg-[#E7E4DC] px-2.5 py-1.5 border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717]">
                <Wifi className="w-3.5 h-3.5 text-[#059669]" />
                <span>SHIP WI-FI</span>
              </div>

              {/* Guest Profile Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#FFFFFF] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717]">
                <div className="w-8 h-8 bg-[#3155E7] text-white border-2 border-[#171717] flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-black text-[#171717] leading-tight truncate max-w-[140px] font-display">
                    {guestProfile.name}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-[#3155E7] uppercase">
                    Phòng {guestProfile.cabin} • {guestProfile.category}
                  </p>
                </div>
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-[#171717] cursor-pointer"
                aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu khách'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t-2 border-[#171717] bg-[#FFFFFF] px-4 py-4 space-y-3 shadow-[0_6px_0px_#171717]">
            <div className="p-3 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#171717] font-display uppercase">{guestProfile.name}</p>
                <p className="text-[10px] font-mono font-bold text-[#3155E7] uppercase">
                  Phòng {guestProfile.cabin} • {guestProfile.category} (ID: #{passengerId})
                </p>
              </div>
              <span className="neo-badge bg-[#D9FF43] text-[#171717]">
                Online
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
                      `flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold uppercase transition-all ${
                        isActive
                          ? 'bg-[#171717] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#3155E7]'
                          : 'bg-[#F7F5F0] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-2 border-t-2 border-[#171717] flex items-center justify-between text-[11px] font-mono font-bold text-[#171717]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#3155E7]" /> Giờ du thuyền: 19:35 UTC+7
              </span>
              <Link
                to="/login"
                className="neo-badge bg-[#D9FF43] text-[#171717] flex items-center gap-1"
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

      {/* Guest Editorial Footer */}
      <footer className="border-t-2 border-[#171717] bg-[#FFFFFF] py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#171717]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <div className="w-7 h-7 bg-[#D9FF43] border border-[#171717] flex items-center justify-center shrink-0">
              <PhoneCall className="w-3.5 h-3.5 text-[#171717]" />
            </div>
            <span className="font-mono text-xs">
              Dịch Vụ Quản Gia & Lễ Tân 24/7: Phím <strong className="bg-[#171717] text-white px-1.5 py-0.5">0</strong> từ điện thoại phòng hoặc gặp trực tiếp tại <strong className="underline decoration-[#3155E7] decoration-2">Sảnh Deck 4 Atrium</strong>.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono font-bold">
            <span className="text-[#171717]/60">Grand Pearl Voyager • Stateroom Portal</span>
            <Link
              to="/login"
              className="neo-btn neo-btn-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
            >
              Đăng nhập Thủy Thủ Đoàn <ShieldCheck className="w-3 h-3 text-[#3155E7]" />
            </Link>
          </div>
        </div>
      </footer>

      {/* Bottom Mobile Dock Navigation (Touch-Friendly Quick Actions on Small Screens) */}
      <nav
        aria-label="Điều hướng nhanh trên thiết bị di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t-2 border-[#171717] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_0px_#171717]"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-mono font-bold uppercase transition-all min-w-[56px] ${
                  isActive ? 'bg-[#D9FF43] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-[#171717]' : 'text-[#171717]/70'
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
