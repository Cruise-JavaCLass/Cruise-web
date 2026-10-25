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
      navigate(decodeURIComponent(redirectUrl), { replace: true });
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
      className="min-h-screen bg-[#F6F7F9] text-[#20242C] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans"
    >
      {/* Top back to guest portal */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E5E7EB] bg-white text-xs font-medium text-[#20242C] shadow-xs hover:bg-[#F1F3F7] transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#5277D9]" /> Về Cổng Khách Hàng (Guest Portal)
        </Link>
        <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-[6px] bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20">
          Maritime Security
        </span>
      </div>

      {/* Login Card - Soft Editorial Modern SaaS */}
      <div className="w-full max-w-md border border-[#E5E7EB] bg-white p-6 sm:p-8 rounded-[18px] shadow-sm relative z-10">
        {/* Header & Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[12px] bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 shadow-xs mb-3">
            <Ship className="w-6 h-6 text-[#5277D9]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#20242C] uppercase font-display">
            CRUISE MANAGER
          </h1>
          <p className="text-xs font-mono font-semibold text-[#5277D9] uppercase tracking-wider mt-1">
            FLEET OPERATIONS & CREW CONSOLE
          </p>
          <p className="text-xs text-[#687080] mt-2">
            Đăng nhập bằng tài khoản Thủy thủ đoàn hoặc Quản trị viên để truy cập bảng điều khiển vận hành.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-[10px] border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username-input" className="block text-xs font-semibold uppercase tracking-wider text-[#20242C] mb-1.5">
              Tên đăng nhập / Mã định danh
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#687080]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: admin hoặc ops.manager"
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] bg-[#F1F3F7] rounded-[10px] text-xs font-medium text-[#20242C] placeholder-[#687080]/70 shadow-xs transition-all focus:bg-white focus:border-[#5277D9] focus:outline-none"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-input" className="block text-xs font-semibold uppercase tracking-wider text-[#20242C] mb-1.5">
              Mật khẩu xác thực
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#687080]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-[#E5E7EB] bg-[#F1F3F7] rounded-[10px] text-xs font-medium text-[#20242C] placeholder-[#687080]/70 shadow-xs transition-all focus:bg-white focus:border-[#5277D9] focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#687080] hover:text-[#20242C] transition-colors"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-[10px] bg-[#5277D9] hover:bg-[#4364C2] text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng nhập Vận Hành'}
          </button>
        </form>

        {/* Demo Fast Logins Section */}
        <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#687080] mb-2.5 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#5277D9]" />
            <span>Tài khoản Demo Thủy Thủ Đoàn:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="p-2 text-[11px] rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F7] hover:bg-[#EEF2FF] hover:border-[#5277D9]/40 hover:text-[#5277D9] text-[#20242C] font-semibold transition-all cursor-pointer truncate"
            >
              Admin Toàn Quyền
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ops.manager', 'ops123')}
              className="p-2 text-[11px] rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F7] hover:bg-[#EEF2FF] hover:border-[#5277D9]/40 hover:text-[#5277D9] text-[#20242C] font-semibold transition-all cursor-pointer truncate"
            >
              Ops Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('coordinator', 'coord123')}
              className="p-2 text-[11px] rounded-[8px] border border-[#E5E7EB] bg-[#F1F3F7] hover:bg-[#EEF2FF] hover:border-[#5277D9]/40 hover:text-[#5277D9] text-[#20242C] font-semibold transition-all cursor-pointer truncate"
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
