import React, { useState, useEffect } from 'react';
import { Bus, Users, ArrowRightLeft, Search, Filter, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchExcursions, reassignBusBooking } from '../../services/excursionService';
import type { ShoreExcursion, ExcursionPassenger } from '../../services/excursionService';

export const ExcursionDispatcherDashboard: React.FC = () => {
  const [excursions, setExcursions] = useState<ShoreExcursion[]>([]);
  const [selectedExcursionId, setSelectedExcursionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [busFilter, setBusFilter] = useState<string>('ALL');

  // Reassign modal state
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<ExcursionPassenger | null>(null);
  const [targetBus, setTargetBus] = useState('XE-01 (45 Chỗ)');
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchExcursions();
        setExcursions(list);
        if (list.length > 0 && selectedExcursionId === null) {
          setSelectedExcursionId(list[0].id);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách tour bờ';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedExcursionId]);

  const currentExcursion = excursions.find((e) => e.id === selectedExcursionId) || null;
  const passengers = currentExcursion?.passengers || [];

  const buses = Array.from(new Set(passengers.map((p) => p.busNumber).filter(Boolean)));
  if (!buses.includes('XE-01 (45 Chỗ)')) buses.unshift('XE-01 (45 Chỗ)');
  if (!buses.includes('XE-02 (29 Chỗ)')) buses.push('XE-02 (29 Chỗ)');
  if (!buses.includes('XE-03 (45 Chỗ)')) buses.push('XE-03 (45 Chỗ)');

  const filteredPassengers = passengers.filter((p) => {
    const matchSearch =
      p.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ticketCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchBus = busFilter === 'ALL' || p.busNumber === busFilter;
    return matchSearch && matchBus;
  });

  const handleOpenReassign = (p: ExcursionPassenger) => {
    setSelectedPassenger(p);
    setTargetBus(p.busNumber || 'XE-01 (45 Chỗ)');
    setReassignModalOpen(true);
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPassenger || !selectedExcursionId) return;

    setReassigning(true);
    setError(null);
    try {
      const res = await reassignBusBooking(selectedExcursionId, selectedPassenger.id, {
        newBusNumber: targetBus,
        newGroupName: `Nhóm ${targetBus}`,
      });

      setActionSuccess(`Chuyển xe thành công: Vé ${res.ticketCode} sang ${res.newBusNumber}`);
      setReassignModalOpen(false);

      // Cập nhật lại UI state
      setExcursions((prev) =>
        prev.map((exc) => {
          if (exc.id === selectedExcursionId && exc.passengers) {
            return {
              ...exc,
              passengers: exc.passengers.map((pass) =>
                pass.id === selectedPassenger.id
                  ? { ...pass, busNumber: targetBus, groupName: `Nhóm ${targetBus}` }
                  : pass
              ),
            };
          }
          return exc;
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chuyển xe thất bại';
      setError(msg);
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-cyan-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span>Đang tải trung tâm điều phối tour bờ...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            Shore Excursions Operations
          </span>
          <h1 className="text-2xl font-bold text-white mt-1 flex items-center gap-2.5">
            <Bus className="w-6 h-6 text-cyan-400" />
            Điều Phối Tour Bờ & Bảng Phân Xe (Bus Dispatcher)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Điều phối danh sách hành khách theo từng xe du lịch, quản lý sức chứa và linh hoạt chuyển xe.
          </p>
        </div>

        {/* Excursion Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium">Chọn Tour Bờ:</label>
          <select
            value={selectedExcursionId || ''}
            onChange={(e) => setSelectedExcursionId(Number(e.target.value))}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {excursions.map((exc) => (
              <option key={exc.id} value={exc.id}>
                {exc.title} ({exc.portName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Fleet & Bus Occupancy Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buses.map((bus) => {
          const seated = passengers.filter((p) => p.busNumber === bus).length;
          const maxCapacity = bus.includes('16') ? 16 : bus.includes('29') ? 29 : 45;
          const percentage = Math.min(100, Math.round((seated / maxCapacity) * 100));

          return (
            <div
              key={bus}
              className={`p-4 rounded-xl border transition-all ${
                busFilter === bus
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/10'
              } cursor-pointer`}
              onClick={() => setBusFilter(busFilter === bus ? 'ALL' : bus)}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-200">{bus}</span>
                <span className="font-mono text-cyan-400">{percentage}%</span>
              </div>
              <div className="text-xl font-bold text-white mb-2">
                {seated} <span className="text-xs text-slate-400 font-normal">/ {maxCapacity} chỗ</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 100 ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-cyan-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên, cabin, mã vé EXC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400">Lọc theo xe:</span>
          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tất cả xe ({passengers.length} khách)</option>
            {buses.map((b) => (
              <option key={b} value={b}>
                {b} ({passengers.filter((p) => p.busNumber === b).length} khách)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Passenger Roster Table */}
      <div className="bg-[#0b0f19] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Danh Sách Hành Khách Đã Đặt Chỗ ({filteredPassengers.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {currentExcursion?.gatheringTime} - {currentExcursion?.departureTime}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-white/5 font-medium">
              <tr>
                <th className="py-3 px-4">Mã Vé (Ticket)</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-4">Số Cabin</th>
                <th className="py-3 px-4">Xe Hiện Tại</th>
                <th className="py-3 px-4">Đoàn / Nhóm</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy hành khách nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{p.ticketCode}</td>
                    <td className="py-3 px-4 font-medium text-white">{p.passengerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {p.cabinNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-400">{p.busNumber || 'Chưa gán'}</td>
                    <td className="py-3 px-4 text-slate-400">{p.groupName || 'Nhóm 1'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReassign(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg font-medium text-xs transition-colors"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Đổi Xe
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reassign Bus */}
      {reassignModalOpen && selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true">
          <div className="bg-[#0b0f19] border border-cyan-500/20 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
              Điều Phối & Đổi Xe Vận Chuyển
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Hành khách: <strong className="text-white">{selectedPassenger.passengerName}</strong> (Cabin {selectedPassenger.cabinNumber}) - Vé: {selectedPassenger.ticketCode}
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Xe vận chuyển mới:</label>
                <select
                  value={targetBus}
                  onChange={(e) => setTargetBus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  {buses.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reassigning}
                  className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-medium shadow-lg transition-all disabled:opacity-50"
                >
                  {reassigning ? 'Đang Chuyển...' : 'Xác Nhận Đổi Xe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
