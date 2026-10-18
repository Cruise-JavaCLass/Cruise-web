import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  RefreshCw,
  Clock,
  MapPin,
  Compass,
  ShieldCheck,
  User,
  Radio,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import {
  activityAttendanceService,
  type ActivityPassResponse,
} from '../../services/activityAttendanceService';

interface ActivityPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: number;
  passengerId: number;
  activityTitle?: string;
}

export const ActivityPassModal: React.FC<ActivityPassModalProps> = ({
  isOpen,
  onClose,
  activityId,
  passengerId,
  activityTitle,
}) => {
  const [pass, setPass] = useState<ActivityPassResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const isFetchingRef = useRef(false);

  const fetchPass = useCallback(async () => {
    if (!activityId || !passengerId) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await activityAttendanceService.getActivityPass(activityId, passengerId);
      setPass(data);
      const expiresAtMs = new Date(data.expiresAt).getTime();
      const nowMs = Date.now();
      const diffSec = Math.max(1, Math.round((expiresAtMs - nowMs) / 1000));
      setCountdown(Math.min(60, diffSec));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải mã thẻ hoạt động';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [activityId, passengerId]);

  // Initial load when modal opens
  useEffect(() => {
    if (!isOpen || !activityId || !passengerId) return;

    let isMounted = true;
    activityAttendanceService
      .getActivityPass(activityId, passengerId)
      .then((data) => {
        if (isMounted) {
          setPass(data);
          const expiresAtMs = new Date(data.expiresAt).getTime();
          const nowMs = Date.now();
          const diffSec = Math.max(1, Math.round((expiresAtMs - nowMs) / 1000));
          setCountdown(Math.min(60, diffSec));
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Không thể tải mã thẻ hoạt động';
          setErrorMessage(msg);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, activityId, passengerId]);

  // Countdown timer & auto-refresh
  useEffect(() => {
    if (!isOpen || !pass || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void fetchPass();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, pass, countdown, fetchPass]);

  if (!isOpen) return null;

  const progressPercentage = Math.round((countdown / 60) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-pass-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Cruise Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-6 h-6 text-sky-200 animate-spin-slow" />
              <div>
                <h3 id="activity-pass-title" className="text-lg font-bold">
                  Thẻ Tham Gia Hoạt Động
                </h3>
                <p className="text-xs text-blue-100">Dynamic Boarding Pass (TTL 60s)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Đóng thẻ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {errorMessage ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Lỗi tải thẻ tham gia</p>
                <p>{errorMessage}</p>
                <button
                  onClick={() => void fetchPass()}
                  className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử lại</span>
                </button>
              </div>
            </div>
          ) : isLoading && !pass ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Đang khởi tạo mã QR bảo mật...</p>
            </div>
          ) : pass ? (
            <>
              {/* Activity Info Banner */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug">
                    {pass.activityTitle || activityTitle}
                  </h4>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold whitespace-nowrap ml-2">
                    {pass.category || 'Giải trí'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span className="truncate">{pass.venue || pass.location}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      {pass.startTime} - {pass.endTime}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Vị trí: {pass.deck}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>Hôm nay</span>
                  </div>
                </div>
              </div>

              {/* QR Code Container with Countdown Indicator */}
              <div className="relative flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                {/* Anti-fraud live watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none text-slate-900 dark:text-white font-extrabold text-2xl rotate-12">
                  CRUISE SECURE PASS • {pass.cabinNumber}
                </div>

                {/* Simulated QR Code SVG with dynamic patterns */}
                <div className="relative p-3 bg-white rounded-xl shadow-md border border-slate-200 dark:border-slate-600">
                  <svg
                    className="w-48 h-48"
                    viewBox="0 0 200 200"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label={`Mã QR cho ${pass.passengerName}`}
                  >
                    {/* Corner Position Detection Patterns */}
                    <rect x="10" y="10" width="50" height="50" rx="6" fill="#0f172a" />
                    <rect x="20" y="20" width="30" height="30" rx="3" fill="#ffffff" />
                    <rect x="27" y="27" width="16" height="16" rx="2" fill="#0284c7" />

                    <rect x="140" y="10" width="50" height="50" rx="6" fill="#0f172a" />
                    <rect x="150" y="20" width="30" height="30" rx="3" fill="#ffffff" />
                    <rect x="157" y="27" width="16" height="16" rx="2" fill="#0284c7" />

                    <rect x="10" y="140" width="50" height="50" rx="6" fill="#0f172a" />
                    <rect x="20" y="150" width="30" height="30" rx="3" fill="#ffffff" />
                    <rect x="27" y="157" width="16" height="16" rx="2" fill="#0284c7" />

                    {/* Dynamic Data Modules simulated from token hash */}
                    <g fill="#1e293b">
                      <rect x="70" y="20" width="10" height="10" rx="2" />
                      <rect x="90" y="20" width="20" height="10" rx="2" />
                      <rect x="120" y="20" width="10" height="10" rx="2" />
                      <rect x="70" y="40" width="20" height="10" rx="2" />
                      <rect x="100" y="40" width="10" height="10" rx="2" />
                      <rect x="120" y="40" width="10" height="10" rx="2" />

                      <rect x="20" y="70" width="10" height="20" rx="2" />
                      <rect x="40" y="80" width="20" height="10" rx="2" />
                      <rect x="70" y="70" width="10" height="10" rx="2" />
                      <rect x="90" y="80" width="20" height="10" rx="2" />
                      <rect x="120" y="70" width="10" height="20" rx="2" />
                      <rect x="140" y="70" width="20" height="10" rx="2" />
                      <rect x="170" y="80" width="10" height="10" rx="2" />

                      <rect x="20" y="100" width="20" height="10" rx="2" />
                      <rect x="50" y="110" width="10" height="10" rx="2" />
                      <rect x="70" y="100" width="20" height="10" rx="2" />
                      <rect x="100" y="100" width="10" height="20" rx="2" />
                      <rect x="120" y="110" width="20" height="10" rx="2" />
                      <rect x="150" y="100" width="20" height="10" rx="2" />
                      <rect x="180" y="110" width="10" height="10" rx="2" />

                      <rect x="70" y="130" width="10" height="20" rx="2" />
                      <rect x="90" y="140" width="10" height="10" rx="2" />
                      <rect x="110" y="130" width="20" height="10" rx="2" />
                      <rect x="140" y="140" width="10" height="10" rx="2" />
                      <rect x="160" y="130" width="20" height="10" rx="2" />

                      <rect x="70" y="160" width="20" height="10" rx="2" />
                      <rect x="100" y="160" width="10" height="20" rx="2" />
                      <rect x="120" y="170" width="20" height="10" rx="2" />
                      <rect x="150" y="160" width="10" height="20" rx="2" />
                      <rect x="170" y="170" width="10" height="10" rx="2" />
                    </g>

                    {/* Center Cruise Shield Emblem */}
                    <circle cx="100" cy="100" r="16" fill="#0284c7" />
                    <path
                      d="M93 99L98 104L108 94"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Live Countdown & Progress Indicator */}
                <div className="w-full mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Mã tự động làm mới sau:</span>
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        countdown <= 10
                          ? 'text-red-600 animate-pulse'
                          : countdown <= 20
                          ? 'text-amber-500'
                          : 'text-blue-600'
                      }`}
                    >
                      {countdown}s
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                        countdown <= 10 ? 'bg-red-500' : countdown <= 20 ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Passenger Card Details */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Hành khách</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {pass.passengerName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Số Cabin</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {pass.cabinNumber}
                    </p>
                  </div>
                </div>

                {pass.rfidTag && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                    <span className="flex items-center space-x-1">
                      <Radio className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Thẻ RFID:</span>
                    </span>
                    <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                      {pass.rfidTag}
                    </span>
                  </div>
                )}
              </div>

              {/* Manual Refresh Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => void fetchPass()}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới mã ngay</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
