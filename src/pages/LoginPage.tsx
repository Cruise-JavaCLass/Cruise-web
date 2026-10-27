import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Ship,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authService.login({ username, password });
      navigate(redirectUrl, { replace: true });
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

  return (
    <div
      data-theme="admin-editorial"
      className="min-h-screen bg-[#F7F4ED] text-[#252B32] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-[#102A43] selection:text-[#F7F4ED]"
    >
      {/* Top back to guest portal */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E0D7] bg-white text-xs font-medium text-[#102A43] shadow-xs hover:bg-[#F7F4ED] hover:border-[#C5A572] transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#397C80]" /> Về Cổng Khách Hàng (Guest Portal)
        </Link>
        <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-white text-[#102A43] border border-[#C5A572] flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-[#397C80]" /> Maritime Security
        </span>
      </div>

      {/* Login Card - Luxury Maritime Executive Container */}
      <div className="w-full max-w-md border border-[#E5E0D7] bg-white p-6 sm:p-8 rounded-2xl shadow-xl relative z-10">
        {/* Header & Brand */}
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

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2.5 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username-input" className="block text-xs font-semibold uppercase tracking-wider text-[#102A43] mb-1.5">
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
            <label htmlFor="password-input" className="block text-xs font-semibold uppercase tracking-wider text-[#102A43] mb-1.5">
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

        {/* Demo Fast Logins Section */}
        <div className="mt-6 pt-5 border-t border-[#E5E0D7]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#102A43] mb-2.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A572]" />
            <span>Tài khoản Demo Thủy Thủ Đoàn:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="p-2 text-[11px] rounded-lg border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] hover:text-[#102A43] text-[#252B32] font-semibold transition-all cursor-pointer truncate shadow-xs"
            >
              Admin Toàn Quyền
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ops.manager', 'ops123')}
              className="p-2 text-[11px] rounded-lg border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] hover:text-[#102A43] text-[#252B32] font-semibold transition-all cursor-pointer truncate shadow-xs"
            >
              Ops Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('coordinator', 'coord123')}
              className="p-2 text-[11px] rounded-lg border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] hover:text-[#102A43] text-[#252B32] font-semibold transition-all cursor-pointer truncate shadow-xs"
            >
              Điều Phối Viên
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
