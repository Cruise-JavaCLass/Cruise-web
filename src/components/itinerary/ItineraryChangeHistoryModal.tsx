import React from 'react';
import { History, X, Clock, User, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import type { ItineraryChangeHistoryItem } from '../../services/dailyItineraryService';

interface ItineraryChangeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourName: string;
  history: ItineraryChangeHistoryItem[];
}

export const ItineraryChangeHistoryModal: React.FC<ItineraryChangeHistoryModalProps> = ({
  isOpen,
  onClose,
  tourName,
  history,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 id="change-history-title" className="text-base font-bold text-white">
                Lịch Sử Thay Đổi Lịch Trình
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-md">{tourName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng lịch sử thay đổi"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="text-sm">Chưa có bản ghi thay đổi nào cho hải trình này.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {history.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-slate-900 shadow-sm shadow-cyan-400/50" />

                  {/* Card */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {item.action}
                        </span>
                        {item.dayNumber && (
                          <span className="text-xs font-medium text-slate-300">
                            Ngày {item.dayNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {item.timestamp}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          <User className="w-3.5 h-3.5 text-cyan-400" />
                          {item.author}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 mb-1">{item.description}</p>

                    {item.details && (
                      <p className="text-xs text-slate-400 mb-2">{item.details}</p>
                    )}

                    {/* Field Changes */}
                    {item.field && (item.oldValue || item.newValue) && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                          <Tag className="w-3 h-3 text-slate-500" />
                          {item.field}:
                        </span>
                        {item.oldValue && (
                          <span className="line-through text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                            {item.oldValue}
                          </span>
                        )}
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          {item.newValue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Nhật ký kiểm toán an toàn (Audit Log)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
