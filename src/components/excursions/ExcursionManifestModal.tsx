import { useState } from 'react';
import {
  X,
  Bus,
  Search,
  Phone,
  Clock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  type ShoreExcursion,
  type ExcursionPassenger,
  INITIAL_EXCURSION_PASSENGERS,
} from '../../services/excursionService';

interface ExcursionManifestModalProps {
  isOpen: boolean;
  onClose: () => void;
  excursion: ShoreExcursion;
}

export function ExcursionManifestModal({
  isOpen,
  onClose,
  excursion,
}: ExcursionManifestModalProps) {
  const [passengers, setPassengers] = useState<ExcursionPassenger[]>(
    excursion.passengers && excursion.passengers.length > 0
      ? excursion.passengers
      : INITIAL_EXCURSION_PASSENGERS
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredPassengers = passengers.filter((p) => {
    const matchSearch =
      p.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticketCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = selectedGroup === 'ALL' || p.busNumber === selectedGroup;
    return matchSearch && matchGroup;
  });

  const busOptions = Array.from(new Set(passengers.map((p) => p.busNumber)));

  const handleToggleStatus = (id: number) => {
    setPassengers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        let nextStatus: ExcursionPassenger['status'] = 'CHECKED_IN';
        if (p.status === 'REGISTERED') nextStatus = 'CHECKED_IN';
        else if (p.status === 'CHECKED_IN') nextStatus = 'ON_TOUR';
        else if (p.status === 'ON_TOUR') nextStatus = 'RETURNED_SAFE';
        else if (p.status === 'RETURNED_SAFE') nextStatus = 'REGISTERED';
        return { ...p, status: nextStatus };
      })
    );
  };

  const getPassengerStatusBadge = (status: ExcursionPassenger['status']) => {
    switch (status) {
      case 'REGISTERED':
        return {
          label: 'Đã Đăng Ký',
          cls: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
          icon: Clock,
        };
      case 'CHECKED_IN':
        return {
          label: 'Đã Lên Xe',
          cls: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
          icon: UserCheck,
        };
      case 'ON_TOUR':
        return {
          label: 'Đang Tham Quan',
          cls: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
          icon: Bus,
        };
      case 'RETURNED_SAFE':
        return {
          label: 'Về Tàu An Toàn',
          cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          icon: ShieldCheck,
        };
    }
  };

  const returnedSafeCount = passengers.filter((p) => p.status === 'RETURNED_SAFE').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manifest-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="manifest-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                Danh Sách Đoàn & Xe Đưa Đón (Passenger Manifest)
              </h3>
              <p className="text-xs text-slate-400">
                {excursion.title} • {excursion.portCity} ({excursion.excursionDate})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & KPI Bar */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Tổng số khách đăng ký</span>
              <span className="text-base font-bold text-white">
                {passengers.length} / {excursion.maxCapacity} khách
              </span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Hướng dẫn viên</span>
              <span className="text-xs font-semibold text-cyan-300 truncate block">
                {excursion.guideName || 'Chưa phân bổ'}
              </span>
              <span className="text-[10px] text-slate-400">{excursion.guidePhone}</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <span className="text-[11px] text-slate-400 block">Phương tiện chính</span>
              <span className="text-xs font-semibold text-white truncate block">
                {excursion.busNumber || 'Xe du lịch'}
              </span>
              <span className="text-[10px] text-slate-400">{excursion.operatorName}</span>
            </div>
            <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/40">
              <span className="text-[11px] text-emerald-400 block">Đã về tàu an toàn</span>
              <span className="text-base font-bold text-emerald-300">
                {returnedSafeCount} / {passengers.length} khách
              </span>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-72">
              <label htmlFor="manifest-search-input" className="sr-only">
                Tìm hành khách theo tên hoặc cabin
              </label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="manifest-search-input"
                type="text"
                placeholder="Tìm theo tên, cabin, mã vé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="manifest-bus-filter" className="text-xs text-slate-400 whitespace-nowrap">
                Lọc theo xe:
              </label>
              <select
                id="manifest-bus-filter"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Tất cả xe đưa đón</option>
                {busOptions.map((bus) => (
                  <option key={bus} value={bus}>
                    {bus}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Passenger Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="py-2.5 px-3">Hành Khách</th>
                  <th className="py-2.5 px-3">Cabin</th>
                  <th className="py-2.5 px-3">Mã Vé</th>
                  <th className="py-2.5 px-3">Xe / Nhóm</th>
                  <th className="py-2.5 px-3">SĐT Khẩn Cấp</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPassengers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Không tìm thấy hành khách nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredPassengers.map((p) => {
                    const badge = getPassengerStatusBadge(p.status);
                    const Icon = badge.icon;
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {p.passengerName}
                          {p.specialRequirements && (
                            <span className="block text-[10px] text-amber-400 font-normal">
                              Lưu ý: {p.specialRequirements}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-cyan-400">{p.cabinNumber}</td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{p.ticketCode}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                            <Bus className="w-3 h-3 text-cyan-400" />
                            {p.busNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3 text-slate-500" /> {p.emergencyPhone}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.cls}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[10px] font-medium transition-colors"
                            title="Chuyển trạng thái điểm danh"
                          >
                            Đổi trạng thái
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Footer Controls */}
          <footer className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Hiển thị {filteredPassengers.length} / {passengers.length} hành khách
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-medium transition-all"
            >
              Đóng
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
