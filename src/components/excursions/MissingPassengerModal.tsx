import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Home,
  Bus,
  Users,
  Search,
} from 'lucide-react';
import type { AttendanceSummary } from '../../services/excursionService';

interface MissingPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: AttendanceSummary | null;
  onQuickCheckIn: (passengerId: number, name: string) => Promise<void>;
}

export const MissingPassengerModal: React.FC<MissingPassengerModalProps> = ({
  isOpen,
  onClose,
  summary,
  onQuickCheckIn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBus, setSelectedBus] = useState<string>('ALL');

  if (!isOpen || !summary) return null;

  const missingList = (summary.missingPassengers || []).filter((p) => {
    const matchSearch =
      p.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBus = selectedBus === 'ALL' || p.busNumber === selectedBus;
    return matchSearch && matchBus;
  });

  const busList = Array.from(new Set((summary.missingPassengers || []).map((p) => p.busNumber).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E5E0D7] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102A43]">Cảnh Báo Hành Khách Chưa Về Tàu</h2>
              <p className="text-xs text-[#252B32]/70">
                Tour: {summary.excursionTitle} | Giờ All-Aboard: <span className="font-semibold text-rose-600">{summary.returnToShipTime || '17:00'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#252B32]/60 hover:text-[#102A43] rounded-lg hover:bg-slate-100 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-[#F7F4ED]/60 border-b border-[#E5E0D7] flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#252B32]/40" />
            <input
              type="text"
              placeholder="Tìm theo tên, số cabin hoặc mã vé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#E5E0D7] rounded-xl text-[#102A43] placeholder-[#252B32]/40 focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-[#102A43]">Lọc xe:</span>
            <select
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-[#E5E0D7] rounded-xl font-medium text-[#102A43] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
            >
              <option value="ALL">Tất cả xe ({summary.totalMissingReturn})</option>
              {busList.map((bus) => (
                <option key={bus} value={bus}>
                  {bus}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {missingList.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <p className="text-[#252B32]/80 font-semibold text-xs">Tất cả hành khách đã về tàu an toàn hoặc không khớp bộ lọc!</p>
            </div>
          ) : (
            missingList.map((p) => (
              <div
                key={p.excursionPassengerId}
                className="bg-white border border-[#E5E0D7] hover:border-[#397C80] rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#102A43] text-sm">{p.passengerName}</span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      Chưa về tàu
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-mono bg-[#F7F4ED] text-[#252B32]/70 rounded border border-[#E5E0D7]">
                      {p.ticketCode}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-[#252B32]/70">
                    <span className="flex items-center gap-1 font-medium text-[#102A43]">
                      <Home className="w-3.5 h-3.5 text-[#397C80]" /> Cabin: {p.cabinNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-[#252B32]/50" /> {p.busNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#252B32]/50" /> {p.groupName}
                    </span>
                    {p.emergencyPhone && (
                      <a
                        href={`tel:${p.emergencyPhone}`}
                        className="flex items-center gap-1 text-[#397C80] hover:underline font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" /> SĐT: {p.emergencyPhone}
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onQuickCheckIn(p.excursionPassengerId, p.passengerName)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận về tàu
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#F7F4ED] px-6 py-3 border-t border-[#E5E0D7] flex items-center justify-between text-xs text-[#252B32]/70">
          <span>Tổng số hành khách cần tìm kiếm: <strong className="text-rose-600 font-bold">{missingList.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-[#102A43] bg-white border border-[#E5E0D7] rounded-xl hover:bg-[#F7F4ED] transition shadow-xs cursor-pointer active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
