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
      className="mb-6 border-2 border-[#171717] bg-amber-300 text-black shadow-[4px_4px_0px_#171717] overflow-hidden transition-all animate-in fade-in slide-in-from-top-2"
    >
      <div className="p-4 sm:p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 border-2 border-[#171717] bg-black text-amber-300 shrink-0 mt-0.5 shadow-[2px_2px_0px_#171717]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black uppercase tracking-tight text-black text-sm sm:text-base">
                Phát hiện {conflicts.length} xung đột lịch trình trong ngày
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-black border border-black bg-black text-[#D9FF43]">
                {conflicts.length} TRÙNG LỊCH
              </span>
            </div>
            <p className="text-xs font-bold text-neutral-800 mt-1">
              Bạn có các hoạt động hoặc tour tham quan trên bờ trùng lặp khung giờ. Vui lòng kiểm tra lại để không bỏ lỡ giờ đón xe hoặc sự kiện.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 border border-black bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_#171717] transition-colors"
            aria-label={isExpanded ? 'Thu gọn chi tiết xung đột' : 'Xem chi tiết xung đột'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 border border-black bg-white text-black hover:bg-neutral-100 shadow-[1px_1px_0px_#171717] transition-colors"
              aria-label="Đóng cảnh báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t-2 border-[#171717] mt-1">
          <div className="mt-3 space-y-2">
            {conflicts.map((conflict, index) => (
              <div
                key={`conflict-${index}-${conflict.firstEventId}-${conflict.secondEventId}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border-2 border-[#171717] bg-white text-xs shadow-[2px_2px_0px_#171717]"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-black text-black">{conflict.firstEventTitle}</span>
                  <span className="font-mono text-neutral-600">({conflict.firstStartTime} - {conflict.firstEndTime})</span>
                  <span className="text-rose-600 font-black px-1.5 uppercase">⚡ trùng với</span>
                  <span className="font-black text-black">{conflict.secondEventTitle}</span>
                  <span className="font-mono text-neutral-600">({conflict.secondStartTime} - {conflict.secondEndTime})</span>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 font-mono text-[11px] text-black font-black border border-black bg-[#D9FF43] px-2 py-0.5">
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
