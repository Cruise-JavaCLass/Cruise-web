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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white border border-[#E5E0D7] rounded-2xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden text-[#252B32]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D7] bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#102A43] text-[#C5A572] flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 id="change-history-title" className="text-base font-bold font-serif text-[#102A43]">
                Lịch Sử Thay Đổi Lịch Trình
              </h2>
              <p className="text-xs text-[#5A6578] truncate max-w-md">{tourName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng lịch sử thay đổi"
            className="p-1.5 text-[#5A6578] hover:text-[#102A43] hover:bg-[#E5E0D7]/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12 text-[#5A6578]">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#5A6578]" />
              <p className="text-sm">Chưa có bản ghi thay đổi nào cho hải trình này.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E0D7]">
              {history.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#102A43] ring-4 ring-[#F7F4ED] shadow-xs" />

                  {/* Card */}
                  <div className="bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl p-4 hover:border-[#102A43]/30 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F4ED] text-[#397C80] border border-[#E5E0D7]">
                          {item.action}
                        </span>
                        {item.dayNumber && (
                          <span className="text-xs font-medium text-[#252B32]">
                            Ngày {item.dayNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#5A6578]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#5A6578]" />
                          {item.timestamp}
                        </span>
                        <span className="flex items-center gap-1 text-[#102A43] font-medium">
                          <User className="w-3.5 h-3.5 text-[#397C80]" />
                          {item.author}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-[#102A43] mb-1">{item.description}</p>

                    {item.details && (
                      <p className="text-xs text-[#5A6578] mb-2">{item.details}</p>
                    )}

                    {/* Field Changes */}
                    {item.field && (item.oldValue || item.newValue) && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-[#E5E0D7] text-xs flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-[#5A6578] font-mono text-[11px]">
                          <Tag className="w-3 h-3 text-[#5A6578]" />
                          {item.field}:
                        </span>
                        {item.oldValue && (
                          <span className="line-through text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            {item.oldValue}
                          </span>
                        )}
                        <ArrowRight className="w-3 h-3 text-[#5A6578]" />
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
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
        <div className="px-6 py-3.5 border-t border-[#E5E0D7] bg-[#F7F4ED] flex items-center justify-between text-xs text-[#5A6578]">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Nhật ký kiểm toán an toàn (Audit Log)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl transition-colors cursor-pointer text-xs font-medium shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryChangeHistoryModal;
