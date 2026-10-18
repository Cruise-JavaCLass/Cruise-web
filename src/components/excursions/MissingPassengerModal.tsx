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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-red-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <AlertTriangle className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Cảnh Báo Hành Khách Chưa Về Tàu</h2>
              <p className="text-xs text-red-100">
                Tour: {summary.excursionTitle} | Giờ All-Aboard: <span className="font-semibold text-white">{summary.returnToShipTime || '17:00'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-red-50/50 border-b border-red-100 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, số cabin hoặc mã vé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs font-semibold text-slate-600">Lọc xe:</span>
            <select
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-red-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
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
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-600 font-semibold">Tất cả hành khách đã về tàu an toàn hoặc không khớp bộ lọc!</p>
            </div>
          ) : (
            missingList.map((p) => (
              <div
                key={p.excursionPassengerId}
                className="bg-white border border-slate-200 hover:border-red-300 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{p.passengerName}</span>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                      Chưa về tàu
                    </span>
                    <span className="px-2 py-0.5 text-xs font-mono bg-slate-100 text-slate-600 rounded">
                      {p.ticketCode}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Home className="w-3.5 h-3.5 text-slate-400" /> Cabin: {p.cabinNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-slate-400" /> {p.busNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {p.groupName}
                    </span>
                    {p.emergencyPhone && (
                      <a
                        href={`tel:${p.emergencyPhone}`}
                        className="flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5" /> SĐT: {p.emergencyPhone}
                      </a>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onQuickCheckIn(p.excursionPassengerId, p.passengerName)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận về tàu
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số hành khách cần tìm kiếm: <strong className="text-red-600 font-bold">{missingList.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
