import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Ship,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
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
    <div className="min-h-screen bg-[#F7F5F0] text-[#171717] flex flex-col justify-center items-center p-4 relative overflow-hidden dark:bg-slate-900 dark:text-white">
      {/* Top back to guest portal */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 border-2 border-[#171717] bg-white px-3 py-1 text-xs font-black uppercase text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Về Cổng Khách Hàng (Guest Portal)
        </Link>
        <span className="border border-[#171717] bg-[#D9FF43] text-black font-black uppercase px-2.5 py-0.5 text-[10px] tracking-wider shadow-[1px_1px_0px_#171717]">
          Maritime Security
        </span>
      </div>

      {/* Login Card - Neo-Brutalist Masterpiece */}
      <div className="w-full max-w-md border-4 border-[#171717] bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#171717] relative z-10 dark:bg-slate-800">
        {/* Header & Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 border-2 border-[#171717] bg-[#3155E7] text-white shadow-[3px_3px_0px_#171717] mb-3">
            <Ship className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black dark:text-white">
            CRUISE MANAGER
          </h1>
          <p className="text-xs font-mono font-black text-[#3155E7] uppercase tracking-widest mt-1 dark:text-[#D9FF43]">
            FLEET OPERATIONS & CREW CONSOLE
          </p>
          <p className="text-xs font-medium text-neutral-600 mt-2 dark:text-neutral-400">
            Đăng nhập bằng tài khoản Thủy thủ đoàn hoặc Quản trị viên để truy cập bảng điều khiển vận hành.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 border-2 border-[#171717] bg-[#DC2626] text-white text-xs font-bold flex items-center gap-2.5 shadow-[3px_3px_0px_#171717]"
          >
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username-input" className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 dark:text-neutral-300">
              Tên đăng nhập / Mã định danh
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: admin hoặc ops.manager"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-[#171717] bg-[#F7F5F0] text-xs font-bold text-black placeholder-neutral-500 shadow-[2px_2px_0px_#171717] transition-all focus:bg-white focus:outline-none dark:bg-slate-900 dark:text-white"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password-input" className="block text-xs font-black uppercase tracking-wider text-black mb-1.5 dark:text-neutral-300">
              Mật khẩu xác thực
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border-2 border-[#171717] bg-[#F7F5F0] text-xs font-bold text-black placeholder-neutral-500 shadow-[2px_2px_0px_#171717] transition-all focus:bg-white focus:outline-none dark:bg-slate-900 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-black transition-colors dark:hover:text-white"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 border-2 border-[#171717] bg-[#171717] hover:bg-[#3155E7] text-white text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#3155E7] transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer active:translate-x-[2px] active:translate-y-[2px]"
          >
            {isLoading ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <span>Đăng nhập Vận Hành</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-6 pt-5 border-t-2 border-[#171717] dark:border-slate-700">
          <p className="text-[11px] font-mono font-bold uppercase text-neutral-600 flex items-center gap-1.5 mb-2.5 dark:text-neutral-400">
            <Sparkles className="w-3.5 h-3.5 text-[#3155E7] dark:text-[#D9FF43]" />
            Tài khoản kiểm thử nhanh (Demo Crew Roles):
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="text-[11px] px-3 py-1 border-2 border-[#171717] bg-[#F7F5F0] hover:bg-[#E7E4DC] text-black font-black uppercase shadow-[2px_2px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-700 dark:text-white"
            >
              Admin Toàn Quyền
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ops.manager', 'ops123')}
              className="text-[11px] px-3 py-1 border-2 border-[#171717] bg-[#F7F5F0] hover:bg-[#E7E4DC] text-black font-black uppercase shadow-[2px_2px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-700 dark:text-white"
            >
              Ops Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('coordinator', 'coord123')}
              className="text-[11px] px-3 py-1 border-2 border-[#171717] bg-[#F7F5F0] hover:bg-[#E7E4DC] text-black font-black uppercase shadow-[2px_2px_0px_#171717] transition-all active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-700 dark:text-white"
            >
              Điều Phối Viên
            </button>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-5 text-center text-[10px] text-neutral-600 font-mono font-bold uppercase flex items-center justify-center gap-1.5 dark:text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hệ thống bảo vệ an ninh hàng hải quốc tế SOLAS</span>
        </div>
      </div>
    </div>
  );
};
