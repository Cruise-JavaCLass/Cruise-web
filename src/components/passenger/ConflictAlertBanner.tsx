import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import type { ScheduleConflict } from '../../services/passengerScheduleService';

interface ConflictAlertBannerProps {
  conflicts: ScheduleConflict[];
  onDismiss?: () => void;
}

export const ConflictAlertBanner: React.FC<ConflictAlertBannerProps> = ({
  conflicts,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-label="Cảnh báo trùng lịch"
      className="mb-6 border border-amber-300 bg-amber-50/90 text-amber-950 rounded-2xl shadow-sm overflow-hidden transition-all animate-in fade-in slide-in-from-top-2"
    >
      <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl border border-amber-300 bg-amber-100 text-amber-800 shrink-0 mt-0.5 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold uppercase tracking-tight text-amber-950 text-sm sm:text-base">
                Phát hiện {conflicts.length} xung đột lịch trình trong ngày
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-amber-300 bg-amber-200/80 text-amber-900 rounded-full">
                {conflicts.length} TRÙNG LỊCH
              </span>
            </div>
            <p className="text-xs font-normal text-amber-800 mt-1 leading-relaxed">
              Bạn có các hoạt động hoặc tour tham quan trên bờ trùng lặp khung giờ. Vui lòng kiểm tra lại để không bỏ lỡ giờ đón xe hoặc sự kiện.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 border border-amber-200 rounded-lg bg-white text-amber-900 hover:bg-amber-100 shadow-xs transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Thu gọn chi tiết xung đột' : 'Xem chi tiết xung đột'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 border border-amber-200 rounded-lg bg-white text-amber-900 hover:bg-amber-100 shadow-xs transition-colors cursor-pointer"
              aria-label="Đóng cảnh báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-amber-200 mt-1">
          <div className="mt-3 space-y-2">
            {conflicts.map((conflict, index) => (
              <div
                key={`conflict-${index}-${conflict.firstEventId}-${conflict.secondEventId}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-amber-200 rounded-xl bg-white text-xs shadow-xs"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-bold text-[#102A43]">{conflict.firstEventTitle}</span>
                  <span className="font-mono text-[#5A6B7C]">({conflict.firstStartTime} - {conflict.firstEndTime})</span>
                  <span className="text-rose-600 font-semibold px-1.5">⚡ trùng với</span>
                  <span className="font-bold text-[#102A43]">{conflict.secondEventTitle}</span>
                  <span className="font-mono text-[#5A6B7C]">({conflict.secondStartTime} - {conflict.secondEndTime})</span>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 font-mono text-[11px] text-amber-900 font-bold border border-amber-300 bg-amber-100 px-2 py-0.5 rounded-lg">
                  <span>Trùng {conflict.overlapMinutes} phút</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
