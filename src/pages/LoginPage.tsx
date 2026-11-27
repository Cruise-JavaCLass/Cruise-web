import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Ship,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Compass,
  CreditCard,
  KeyRound,
  DoorOpen,
} from 'lucide-react';
import { authService } from '../services/authService';
import { canAccessPath, homeForRole } from '../services/accessControl';
import { apiClient } from '../services/api';
import {
  INITIAL_PASSENGERS,
  getPassengerBookingSummary,
} from '../services/passengerService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  // Determine active tab: crew or passenger
  const [activeTab, setActiveTab] = useState<'crew' | 'passenger'>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'passenger') return 'passenger';
    if (tabParam === 'crew') return 'crew';
    if (
      redirectUrl.includes('/passenger') ||
      redirectUrl.includes('/boarding-pass') ||
      redirectUrl.includes('/my-schedule')
    ) {
      return 'passenger';
    }
    return 'crew';
  });

  // Crew Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Passenger Form State
  const [cabinNumber, setCabinNumber] = useState('');
  const [guestVerification, setGuestVerification] = useState('');
  const [isPassengerLoading, setIsPassengerLoading] = useState(false);
  const [passengerErrorMessage, setPassengerErrorMessage] = useState<string | null>(null);

  // Crew submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loggedInUser = await authService.login({ username, password });
      const targetPath = redirectUrl.split('?')[0];
      const destination =
        redirectUrl &&
        targetPath !== '/forbidden' &&
        targetPath !== '/login' &&
        canAccessPath(loggedInUser.role, targetPath)
          ? redirectUrl
          : homeForRole(loggedInUser.role);
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  // Passenger submit
  const handlePassengerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = cabinNumber.trim().toLowerCase();
    const v = guestVerification.trim().toLowerCase();

    if (!c) {
      setPassengerErrorMessage('Vui lòng nhập số phòng buồng (Cabin Number).');
      return;
    }
    if (!v) {
      setPassengerErrorMessage('Vui lòng nhập Họ Tên, SĐT hoặc Mã Đặt Chỗ để xác thực.');
      return;
    }

    setIsPassengerLoading(true);
    setPassengerErrorMessage(null);

    try {
      let authenticatedPassengerId: number | null = null;
      let authenticatedPassengerProfile: { fullName?: string; cabinNumber?: string } | null = null;
      const fallbackPassenger = INITIAL_PASSENGERS.find((p) => {
        const matchCabin =
          p.cabinNumber.toLowerCase().includes(c) ||
          c.includes(p.cabinNumber.split(' ')[0].toLowerCase());
        const matchName = p.fullName.toLowerCase().includes(v);
        const matchPhone = p.phoneNumber?.toLowerCase().includes(v);
        const matchRfid = p.rfidTag?.toLowerCase().includes(v);
        const matchQr = p.qrCode?.toLowerCase().includes(v);
        const matchCode = `bk-${p.id}026`.includes(v) || `cruise-${p.tourId}`.includes(v);
        return matchCabin && (matchName || matchPhone || matchRfid || matchQr || matchCode);
      });

      // 1. Authenticate against backend to acquire a real PASSENGER JWT token
      try {
        const authRes = await apiClient.post<{
          success: boolean;
          data?: {
            accessToken?: string;
            token?: string;
            user?: {
              id: number;
              username: string;
              fullName: string;
              role: string;
              email?: string;
              cabinNumber?: string;
              rfidTag?: string;
            };
          };
        }>('/auth/passenger-login', {
          cabinNumber: cabinNumber.trim(),
          verification: guestVerification.trim(),
        });
        const token = authRes.data?.data?.accessToken || authRes.data?.data?.token;
        const user = authRes.data?.data?.user;
        if (token && user) {
          const parsedPassengerId = Number(user.username) || fallbackPassenger?.id || 1;
          authenticatedPassengerId = parsedPassengerId;
          authenticatedPassengerProfile = {
            fullName: user.fullName,
            cabinNumber: user.cabinNumber || cabinNumber.trim(),
          };
          localStorage.setItem('authToken', token);
          localStorage.setItem(
            'currentUser',
            JSON.stringify({
              id: parsedPassengerId,
              passengerId: parsedPassengerId,
              username: user.username,
              fullName: user.fullName,
              role: 'PASSENGER',
              email: user.email,
            })
          );
        }
      } catch (authErr: unknown) {
        const status = (authErr as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 400 || status === 403) {
          setPassengerErrorMessage(
            'Không tìm thấy thông tin hành khách phù hợp với số phòng và mã xác thực đã nhập. Vui lòng kiểm tra lại.'
          );
          return;
        }
        // Backend offline/unavailable: continue with local demo fallback in non-production environments
        const isNonProdFallbackAllowed =
          typeof import.meta !== 'undefined' &&
          !import.meta.env?.PROD &&
          (import.meta.env?.MODE === 'test' || import.meta.env?.DEV);
        if (!isNonProdFallbackAllowed || !fallbackPassenger) {
          throw authErr;
        }
      }

      const targetPassengerId = authenticatedPassengerId ?? fallbackPassenger?.id ?? null;
      if (targetPassengerId) {
        if (!authenticatedPassengerId && fallbackPassenger) {
          localStorage.setItem(
            'authToken',
            `mock-passenger-jwt-${fallbackPassenger.id}-${Date.now()}`
          );
          localStorage.setItem(
            'currentUser',
            JSON.stringify({
              id: fallbackPassenger.id,
              passengerId: fallbackPassenger.id,
              username: String(fallbackPassenger.id),
              fullName: fallbackPassenger.fullName,
              role: 'PASSENGER',
              email: fallbackPassenger.email,
            })
          );
        }

        try {
          const summary = await getPassengerBookingSummary(targetPassengerId);
          if (summary.passengerId !== targetPassengerId) {
            throw new Error('Passenger summary ID mismatch');
          }
          const sessionData = {
            id: summary.passengerId,
            fullName: summary.fullName,
            cabinNumber: summary.cabinNumber,
            rfidTag: summary.rfidTag,
            qrCode: summary.qrCode,
            tourPackage: summary.tourPackage,
            bleZone: summary.bleZone,
            checkInStatus: summary.checkInStatus,
          };
          localStorage.setItem('currentPassenger', JSON.stringify(sessionData));
          localStorage.setItem('passengerId', String(summary.passengerId));
        } catch {
          if (fallbackPassenger && fallbackPassenger.id === targetPassengerId) {
            localStorage.setItem('currentPassenger', JSON.stringify(fallbackPassenger));
            localStorage.setItem('passengerId', String(fallbackPassenger.id));
          } else {
            localStorage.setItem(
              'currentPassenger',
              JSON.stringify({
                id: targetPassengerId,
                fullName: authenticatedPassengerProfile?.fullName,
                cabinNumber: authenticatedPassengerProfile?.cabinNumber || cabinNumber.trim(),
              })
            );
            localStorage.setItem('passengerId', String(targetPassengerId));
          }
        }

        const target =
          redirectUrl && redirectUrl !== '/login' && redirectUrl !== '/'
            ? redirectUrl
            : '/passenger-home';
        navigate(target, { replace: true });
        return;
      }

      setPassengerErrorMessage(
        'Không tìm thấy thông tin hành khách phù hợp với số phòng và mã xác thực đã nhập. Vui lòng kiểm tra lại.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xác thực hành khách thất bại.';
      setPassengerErrorMessage(msg);
    } finally {
      setIsPassengerLoading(false);
    }
  };

  const handleQuickPassengerSelect = (c: string, name: string) => {
    setCabinNumber(c);
    setGuestVerification(name);
    setPassengerErrorMessage(null);
  };

  return (
    <div
      data-theme="admin-editorial"
      className="min-h-screen bg-[#F7F4ED] text-[#252B32] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-[#102A43] selection:text-[#F7F4ED]"
    >
      {/* Top status bar */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-[#102A43] tracking-wider uppercase">
          <Ship className="w-4 h-4 text-[#397C80]" />
          <span>Grand Pearl Voyager</span>
        </div>
        <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-white text-[#102A43] border border-[#C5A572] flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-[#397C80]" /> Maritime Security
        </span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md border border-[#E5E0D7] bg-white p-6 sm:p-8 rounded-2xl shadow-xl relative z-10">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-[#F7F4ED] rounded-xl border border-[#E5E0D7] mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('crew');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'crew'
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#627D98] hover:text-[#102A43]'
            }`}
          >
            <Ship className="w-3.5 h-3.5 text-[#C5A572]" />
            <span>Thủy Thủ Đoàn</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('passenger');
              setPassengerErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'passenger'
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'text-[#627D98] hover:text-[#102A43]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#C5A572]" />
            <span>Hành Khách</span>
          </button>
        </div>

        {activeTab === 'crew' ? (
          <>
            {/* Crew Brand Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#102A43] text-[#C5A572] border border-[#C5A572]/40 shadow-xs mb-3">
                <Ship className="w-6 h-6 text-[#C5A572]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#102A43] uppercase font-display">
                CRUISE MANAGER
              </h1>
              <p className="text-xs font-mono font-semibold text-[#C5A572] uppercase tracking-wider mt-1">
                FLEET OPERATIONS & CREW CONSOLE
              </p>
              <p className="text-xs text-[#627D98] mt-2">
                Đăng nhập bằng tài khoản Thủy thủ đoàn hoặc Quản trị viên để truy cập bảng điều khiển vận hành.
              </p>
            </div>

            {/* Crew Error Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Crew Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#102A43] mb-1.5"
                >
                  Tên đăng nhập / Mã định danh
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627D98]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="username-input"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: admin hoặc ops.manager"
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E5E0D7] bg-[#F7F4ED] rounded-xl text-xs font-medium text-[#252B32] placeholder-[#627D98]/70 shadow-xs transition-all focus:bg-white focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] focus:outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#102A43] mb-1.5"
                >
                  Mật khẩu xác thực
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627D98]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-[#E5E0D7] bg-[#F7F4ED] rounded-xl text-xs font-medium text-[#252B32] placeholder-[#627D98]/70 shadow-xs transition-all focus:bg-white focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] focus:outline-none"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#627D98] hover:text-[#102A43] transition-colors"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isLoading ? 'Đang xác thực...' : 'Đăng nhập Vận Hành'}
              </button>
            </form>

            {/* Enterprise Maritime Security & Testing Drawer */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D7] text-center">
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#627D98] uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#397C80]" />
                <span>SOLAS & ISPS Security Level 1 • 256-Bit TLS</span>
              </div>
              <p className="text-[10px] text-[#627D98]/80 leading-relaxed font-mono">
                Hệ thống quản trị du thuyền bảo mật cao. Mọi hành vi truy cập trái phép đều được ghi lại trong nhật ký an ninh hàng hải.
              </p>

              {/* Collapsible Developer Drawer */}
              <details className="mt-3 group text-left">
                <summary className="text-[10px] font-mono font-medium text-[#627D98] hover:text-[#102A43] cursor-pointer flex items-center justify-center gap-1 transition-colors py-1">
                  <span>Hỗ trợ môi trường kiểm thử (Testing Guidelines)</span>
                </summary>
                <div className="mt-2 p-3 bg-[#F7F4ED] rounded-xl border border-[#E5E0D7] text-[11px]">
                  <p className="font-semibold text-[#102A43] mb-2 uppercase text-[10px] tracking-wider">
                    Tài khoản kiểm thử vận hành:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin', 'admin123')}
                      className="p-2 text-[10px] rounded-lg border border-[#E5E0D7] bg-white hover:border-[#C5A572] hover:text-[#102A43] text-[#252B32] font-semibold transition-all cursor-pointer truncate shadow-xs"
                    >
                      Admin Toàn Quyền
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('ops.manager', 'admin123')}
                      className="p-2 text-[10px] rounded-lg border border-[#E5E0D7] bg-white hover:border-[#C5A572] hover:text-[#102A43] text-[#252B32] font-semibold transition-all cursor-pointer truncate shadow-xs"
                    >
                      Ops Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('coordinator', 'admin123')}
                      className="p-2 text-[10px] rounded-lg border border-[#E5E0D7] bg-white hover:border-[#C5A572] hover:text-[#102A43] text-[#252B32] font-semibold transition-all cursor-pointer truncate shadow-xs"
                    >
                      Điều Phối Viên
                    </button>
                  </div>
                </div>
              </details>
            </div>
          </>
        ) : (
          <>
            {/* Passenger Brand Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#102A43] text-[#C5A572] border border-[#C5A572]/40 shadow-xs mb-3">
                <Compass className="w-6 h-6 text-[#C5A572]" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#102A43] uppercase font-display">
                GRAND PEARL
              </h1>
              <p className="text-xs font-mono font-semibold text-[#C5A572] uppercase tracking-wider mt-1">
                GUEST EXPERIENCE & FOLIO PORTAL
              </p>
              <p className="text-xs text-[#627D98] mt-2">
                Xác thực số phòng và thông tin đặt chỗ để mở khóa Ví Chi Tiêu, Thẻ Lên Tàu và Lịch Trình cá nhân.
              </p>
            </div>

            {/* Passenger Error Alert */}
            {passengerErrorMessage && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passengerErrorMessage}</span>
              </div>
            )}

            {/* Passenger Form */}
            <form onSubmit={handlePassengerSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="cabin-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#102A43] mb-1.5"
                >
                  Số Phòng Buồng (Cabin Number)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627D98]">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <input
                    id="cabin-input"
                    type="text"
                    value={cabinNumber}
                    onChange={(e) => setCabinNumber(e.target.value)}
                    placeholder="Ví dụ: 402, 718, 505..."
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E5E0D7] bg-[#F7F4ED] rounded-xl text-xs font-medium text-[#252B32] placeholder-[#627D98]/70 shadow-xs transition-all focus:bg-white focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] focus:outline-none"
                    disabled={isPassengerLoading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="guest-verify-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#102A43] mb-1.5"
                >
                  Họ Tên / Mã Đặt Chỗ / Số Điện Thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627D98]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="guest-verify-input"
                    type="text"
                    value={guestVerification}
                    onChange={(e) => setGuestVerification(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Minh, 0901234567 hoặc BK-1026"
                    className="w-full pl-10 pr-4 py-2.5 border border-[#E5E0D7] bg-[#F7F4ED] rounded-xl text-xs font-medium text-[#252B32] placeholder-[#627D98]/70 shadow-xs transition-all focus:bg-white focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] focus:outline-none"
                    disabled={isPassengerLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPassengerLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-[#C5A572]" />
                <span>{isPassengerLoading ? 'Đang xác thực...' : 'Mở Khóa Ví Chi Tiêu & Dịch Vụ'}</span>
              </button>
            </form>

            {/* Quick Guest Selector Drawer */}
            <div className="mt-6 pt-4 border-t border-[#E5E0D7]">
              <p className="text-[10px] font-mono font-semibold text-[#627D98] uppercase tracking-wider mb-2 text-center">
                Chọn nhanh khách hàng mẫu trên hải trình:
              </p>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickPassengerSelect('402', 'Nguyễn Văn Minh')}
                  className="w-full p-2 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] text-left transition-all flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#102A43] bg-white px-2 py-0.5 rounded border border-[#E5E0D7]">
                      P. 402
                    </span>
                    <span className="font-semibold text-[#252B32]">Nguyễn Văn Minh</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#397C80] font-medium">VIP Ban công</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPassengerSelect('718', 'Trần Thị Thu Thảo')}
                  className="w-full p-2 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] text-left transition-all flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#102A43] bg-white px-2 py-0.5 rounded border border-[#E5E0D7]">
                      P. 718
                    </span>
                    <span className="font-semibold text-[#252B32]">Trần Thị Thu Thảo</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#C5A572] font-semibold">Suite Hoàng Gia</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPassengerSelect('505', 'Lê Hoàng Nam')}
                  className="w-full p-2 rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] text-left transition-all flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#102A43] bg-white px-2 py-0.5 rounded border border-[#E5E0D7]">
                      P. 505
                    </span>
                    <span className="font-semibold text-[#252B32]">Lê Hoàng Nam</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#627D98] font-medium">Tiêu chuẩn</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
