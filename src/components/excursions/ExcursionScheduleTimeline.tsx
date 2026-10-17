import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

export interface ExcursionScheduleTimelineProps {
  meetingTime?: string;
  departureTime: string;
  returnToShipTime: string;
  allAboardTime: string;
  marginMinutes: number;
}

export const ExcursionScheduleTimeline: React.FC<ExcursionScheduleTimelineProps> = ({
  meetingTime,
  departureTime,
  returnToShipTime,
  allAboardTime,
  marginMinutes,
}) => {
  return (
    <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3" data-testid="excursion-schedule-timeline">
      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-4 h-4" /> Lịch Trình Thời Gian & Giờ Tàu Nhổ Neo
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">1. Tập Trung</span>
          <strong className="text-sm text-white">{meetingTime || '07:30'}</strong>
          <span className="text-[10px] text-slate-500 block">Sảnh đón</span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">2. Khởi Hành</span>
          <strong className="text-sm text-cyan-400">{departureTime}</strong>
          <span className="text-[10px] text-slate-500 block">Rời bến cảng</span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-amber-400 block uppercase">3. Về Tàu</span>
          <strong className="text-sm text-amber-300">{returnToShipTime}</strong>
          <span className="text-[10px] text-slate-500 block">Đón lên tàu</span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-rose-400 block uppercase">4. All-Aboard</span>
          <strong className="text-sm text-rose-300">{allAboardTime}</strong>
          <span className="text-[10px] text-rose-500 block">Tàu nhổ neo</span>
        </div>
      </div>

      {/* Maritime Buffer Status */}
      <div
        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
          marginMinutes < 30
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            Khoảng đệm an toàn hải hành: <strong>{marginMinutes} phút</strong>
          </span>
        </div>
        <span className="text-[11px] opacity-80">
          {marginMinutes >= 30 ? 'Chuẩn an toàn hàng hải quốc tế' : 'Cần giám sát liên tục'}
        </span>
      </div>
    </div>
  );
};
