import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Anchor,
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
  Server
} from 'lucide-react';
import { checkBackendHealth, getBackendInfo } from '../services/api';
import type { SystemHealth, SystemInfo } from '../services/api';

export function MainLayout() {
  const [backendHealth, setBackendHealth] = useState<SystemHealth | null>(null);
  const [backendInfo, setBackendInfo] = useState<SystemInfo | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

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

  const navItems = [
    { to: '/', label: 'Dashboard Tổng quan', icon: Compass },
    { to: '/itinerary', label: 'Hải trình & Cảng dừng', icon: MapPin },
    { to: '/activities', label: 'Hoạt động & Excursion', icon: Activity },
    { to: '/pos', label: 'POS & Chi tiêu Onboard', icon: CreditCard },
    { to: '/passengers', label: 'Hành khách & Check-in', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                CRUISE MANAGER
              </h1>
              <p className="text-[10px] text-cyan-400 font-medium uppercase tracking-wider">Luxury Activity & POS</p>
            </div>
          </div>

          {/* Ship Status badge */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Ship className="w-3.5 h-3.5 text-cyan-400" /> Grand Pearl Voyager
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">
                Sailing
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Route: Hạ Long — Đà Nẵng — Phú Quốc</p>
          </div>

          {/* Navigation Links via React Router NavLink */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Backend Connection Widget */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] font-medium">
              <Server className="w-3.5 h-3.5 text-slate-400" /> Backend Gateway
            </span>
            <button
              onClick={fetchStatus}
              disabled={isCheckingBackend}
              className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
              title="Ping Backend"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
          <div
            className={`flex items-center gap-2 p-2.5 rounded-lg border text-[11px] ${
              backendHealth
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
            }`}
          >
            {backendHealth ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="truncate">
              {backendHealth ? `Online (Port 8080 - ${backendHealth.status})` : 'Offline (localhost:8080)'}
            </span>
          </div>
          {backendInfo && (
            <p className="text-[10px] text-cyan-400/80 mt-1.5 text-center truncate">
              {backendInfo.projectName} ({backendInfo.version})
            </p>
          )}
          <p className="text-[10px] text-slate-500 mt-1 text-center">Jira: KAN-36 / Story: KAN-37</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-medium">
              Cruise Activity & Service System
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Time: 19:35 (UTC)</span>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-200 transition-colors bg-slate-800/50 rounded-lg">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                HT
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">Huy Trần Gia</p>
                <p className="text-[10px] text-slate-400">Operations Lead</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
