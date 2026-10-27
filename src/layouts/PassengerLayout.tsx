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
import { getPassengerBookingSummary } from '../services/passengerService';

interface GuestProfile {
  name: string;
  cabin: string;
  category: string;
}

export function PassengerLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const location = useLocation();

  useEffect(() => {
    const pId = resolvePassengerId();

    // 1. Read stored passenger profile from localStorage immediately if matching selected passenger ID
    try {
      const stored = localStorage.getItem('currentPassenger') || sessionStorage.getItem('currentPassenger');
      if (stored) {
        const parsed = JSON.parse(stored);
        const storedId = parsed?.id ?? parsed?.passengerId;
        const matchesSelected = !pId || storedId === undefined || Number(storedId) === pId;
        if (matchesSelected && (parsed?.fullName || parsed?.name)) {
          setGuestProfile({
            name: parsed.fullName || parsed.name,
            cabin: parsed.cabinNumber || parsed.cabin || 'Chưa gán',
            category: parsed.cabinCategory || parsed.category || 'Tiêu chuẩn',
          });
          return;
        }
      }
    } catch {
      // ignore
    }

    // 2. Refresh from backend API
    if (pId) {
      getPassengerBookingSummary(pId)
        .then((summary) => {
          if (summary) {
            setGuestProfile({
              name: summary.fullName,
              cabin: summary.cabinNumber,
              category: summary.cabinCategory || 'Tiêu chuẩn',
            });
          } else {
            setGuestProfile(null);
          }
        })
        .catch(() => {
          setGuestProfile(null);
        });
    } else {
      setGuestProfile(null);
    }
  }, [location.search]);

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

  const createNavTarget = (path: string) =>
    location.search ? { pathname: path, search: location.search } : path;

  const passengerId = resolvePassengerId();

  return (
    <div
      data-theme="passenger-retro"
      className="min-h-screen bg-[#F7F4ED] text-[#252B32] flex flex-col antialiased selection:bg-[#102A43] selection:text-[#F7F4ED]"
    >
      {/* Five-Star Luxury Concierge Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E0D7] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            {/* Resort Brand & Ship Name */}
            <Link
              to={createNavTarget('/passenger-home')}
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A572] p-1"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#102A43] text-[#C5A572] border border-[#C5A572]/40 rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-all">
                <Ship className="w-5 h-5 text-[#C5A572]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="tracking-widest text-base sm:text-lg text-[#102A43] font-black leading-tight font-display">
                    GRAND PEARL
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#F7F4ED] text-[#102A43] border border-[#C5A572]">
                    VOYAGER
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#627D98]">
                    Guest Experience Portal
                  </p>
                  <span className="hidden sm:inline-block text-[9px] font-mono text-[#397C80]">
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
                    to={createNavTarget(item.to)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-semibold uppercase tracking-wider rounded-lg transition-all ${
                        isActive
                          ? 'bg-[#102A43] text-white shadow-xs'
                          : 'text-[#252B32] hover:text-[#102A43] hover:bg-[#F7F4ED]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-[#C5A572]' : 'text-[#397C80]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Guest Cabin & Status Widget */}
            <div className="flex items-center gap-3">
              {/* Ship Connectivity Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono font-medium text-[#252B32] bg-[#F7F4ED] px-2.5 py-1.5 rounded-lg border border-[#E5E0D7]">
                <Wifi className="w-3.5 h-3.5 text-[#397C80] animate-pulse" />
                <span className="text-[#397C80] font-semibold">SHIP WI-FI</span>
              </div>

              {/* Guest Profile Pill */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-[#E5E0D7] rounded-xl shadow-xs">
                <div className="w-8 h-8 bg-[#F7F4ED] text-[#102A43] border border-[#C5A572]/40 rounded-full flex items-center justify-center font-bold text-xs shadow-xs">
                  <User className="w-4 h-4 text-[#102A43]" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-[#102A43] leading-tight truncate max-w-[140px]">
                    {guestProfile ? guestProfile.name : 'Chưa đăng nhập'}
                  </p>
                  <p className="text-[10px] font-mono text-[#397C80] font-semibold uppercase tracking-wider">
                    {guestProfile ? `Phòng ${guestProfile.cabin} • ${guestProfile.category}` : 'Khách vãng lai'}
                  </p>
                </div>
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg text-[#102A43] hover:bg-white transition-colors cursor-pointer"
                aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu khách'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E5E0D7] bg-white px-4 py-4 space-y-3 shadow-xl">
            <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#102A43] uppercase tracking-wider">
                  {guestProfile ? guestProfile.name : 'Chưa đăng nhập'}
                </p>
                <p className="text-[10px] font-mono text-[#397C80] font-semibold uppercase">
                  {guestProfile
                    ? `Phòng ${guestProfile.cabin} • ${guestProfile.category}${passengerId ? ` (ID: #${passengerId})` : ''}`
                    : 'Khách vãng lai'}
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#EAF2F2] text-[#397C80] border border-[#397C80]/30 flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#397C80] animate-pulse" /> Online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={createNavTarget(item.to)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 text-xs font-mono font-semibold uppercase rounded-lg transition-all ${
                        isActive
                          ? 'bg-[#102A43] text-white shadow-xs'
                          : 'bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#C5A572]' : 'text-[#397C80]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#E5E0D7] flex items-center justify-between text-[11px] font-mono text-[#627D98]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C5A572]" /> Giờ du thuyền: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })} (UTC+7)
              </span>
              <Link
                to="/login"
                className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg bg-[#F7F4ED] text-[#102A43] border border-[#C5A572] flex items-center gap-1 hover:bg-[#102A43] hover:text-white transition-colors"
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

      {/* Five-Star Luxury Concierge Footer */}
      <footer className="border-t border-[#E5E0D7] bg-[#0B1F33] py-6 pb-24 md:pb-6 px-4 sm:px-6 lg:px-8 text-xs text-[#E5E0D7]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <div className="w-7 h-7 bg-[#102A43] border border-[#C5A572]/40 rounded-lg flex items-center justify-center shrink-0 text-[#C5A572]">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-xs text-[#E5E0D7]">
              Dịch Vụ Quản Gia & Lễ Tân 24/7: Phím <strong className="text-[#C5A572] bg-[#102A43] px-1.5 py-0.5 rounded border border-[#C5A572]/40 font-bold">0</strong> từ điện thoại phòng hoặc gặp trực tiếp tại <strong className="text-white underline decoration-[#C5A572] decoration-1 underline-offset-2">Sảnh Deck 4 Atrium</strong>.
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-[#E5E0D7]/80">Grand Pearl Voyager • Stateroom Portal</span>
            <Link
              to="/login"
              className="text-[10px] font-mono font-medium py-1 px-2.5 rounded-lg bg-[#102A43] text-[#C5A572] border border-[#C5A572]/40 flex items-center gap-1 hover:bg-[#C5A572] hover:text-[#0B1F33] transition-all"
            >
              Đăng nhập Thủy Thủ Đoàn <ShieldCheck className="w-3 h-3 text-[#C5A572]" />
            </Link>
          </div>
        </div>
      </footer>

      {/* Bottom Mobile Dock Navigation */}
      <nav
        aria-label="Điều hướng nhanh trên thiết bị di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E5E0D7] px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(11,31,51,0.08)]"
      >
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={createNavTarget(item.to)}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 text-[10px] font-mono font-medium uppercase rounded-lg transition-all min-w-[56px] ${
                  isActive
                    ? 'bg-[#102A43] text-white shadow-xs'
                    : 'text-[#627D98] hover:text-[#102A43]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 mb-0.5 ${
                      isActive ? 'text-[#C5A572]' : 'text-[#397C80]'
                    }`}
                  />
                  <span className="truncate max-w-[64px]">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default PassengerLayout;
