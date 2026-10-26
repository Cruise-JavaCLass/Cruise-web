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
    <div className="bg-white p-4.5 rounded-xl border border-[#E5E0D7] shadow-xs space-y-3.5" data-testid="excursion-schedule-timeline">
      <h4 className="text-xs font-semibold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-[#102A43]" /> Lịch Trình Thời Gian & Giờ Tàu Nhổ Neo
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-[#F7F4ED] p-3 rounded-lg border border-[#E5E0D7]">
          <span className="text-[10px] text-[#687787] font-semibold block uppercase">1. Tập Trung</span>
          <strong className="text-sm font-bold text-[#102A43]">{meetingTime || '07:30'}</strong>
          <span className="text-[10px] text-[#687787] block">Sảnh đón</span>
        </div>
        <div className="bg-[#F7F4ED] p-3 rounded-lg border border-[#E5E0D7]">
          <span className="text-[10px] text-[#687787] font-semibold block uppercase">2. Khởi Hành</span>
          <strong className="text-sm font-bold text-[#102A43]">{departureTime}</strong>
          <span className="text-[10px] text-[#687787] block">Rời bến cảng</span>
        </div>
        <div className="bg-[#F7F4ED] p-3 rounded-lg border border-[#E5E0D7]">
          <span className="text-[10px] text-[#397C80] font-semibold block uppercase">3. Về Tàu</span>
          <strong className="text-sm font-bold text-[#102A43]">{returnToShipTime}</strong>
          <span className="text-[10px] text-[#687787] block">Đón lên tàu</span>
        </div>
        <div className="bg-[#F7F4ED] p-3 rounded-lg border border-[#E5E0D7]">
          <span className="text-[10px] text-rose-700 font-semibold block uppercase">4. All-Aboard</span>
          <strong className="text-sm font-bold text-rose-700">{allAboardTime}</strong>
          <span className="text-[10px] text-rose-600 block">Tàu nhổ neo</span>
        </div>
      </div>

      {/* Maritime Buffer Status */}
      <div
        className={`p-3 rounded-lg border flex items-center justify-between text-xs font-medium ${
          marginMinutes < 30
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
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
