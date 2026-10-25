import React, { useState, useEffect } from 'react';
import { Bus, Users, ArrowRightLeft, Search, Filter, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchExcursions, reassignBusBooking } from '../services/excursionService';
import type { ShoreExcursion, ExcursionPassenger } from '../services/excursionService';

function getBusMaxCapacity(bus: string): number {
  const match = bus.match(/\((\d+)\s*Chỗ\)/i);
  if (match) return parseInt(match[1], 10);
  if (bus.includes('16')) return 16;
  if (bus.includes('29')) return 29;
  return 45;
}

function getBusSeatedCount(passengers: ExcursionPassenger[], bus: string): number {
  return passengers.filter((p) => p.busNumber === bus).length;
}

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
        if (list.length > 0) {
          setSelectedExcursionId((prev) => (prev !== null ? prev : list[0].id));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách tour bờ';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

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

    if (targetBus !== selectedPassenger.busNumber) {
      const seated = getBusSeatedCount(passengers, targetBus);
      const maxCap = getBusMaxCapacity(targetBus);
      if (seated >= maxCap) {
        setError(`Xe ${targetBus} đã đầy (${seated}/${maxCap} chỗ). Vui lòng chọn xe khác.`);
        return;
      }
    }

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
      <div className="flex flex-col items-center justify-center p-16 text-[#171717] gap-4">
        <div className="w-12 h-12 bg-[#D9FF43] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#171717] animate-spin" />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider">Đang tải trung tâm điều phối tour bờ...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header — Editorial Neo-Brutalist Broadside */}
      <div className="neo-card bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[6px_6px_0px_#171717]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#3155E7] text-white">SHORE LOGISTICS</span>
            <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• BUS FLEET DISPATCH</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-[#171717] uppercase tracking-tight flex items-center gap-2.5">
            <Bus className="w-6 h-6 text-[#3155E7]" />
            Điều Phối Tour Bờ & Bảng Phân Xe (Bus Dispatcher)
          </h1>
          <p className="text-xs font-mono text-[#171717]/70 mt-1">
            Điều phối danh sách hành khách theo từng xe du lịch, quản lý sức chứa và linh hoạt chuyển xe.
          </p>
        </div>

        {/* Excursion Switcher */}
        <div className="flex items-center gap-2">
          <label htmlFor="excursion-select" className="text-xs font-mono font-bold text-[#171717] uppercase">Chọn Tour Bờ:</label>
          <select
            id="excursion-select"
            value={selectedExcursionId || ''}
            onChange={(e) => {
              setSelectedExcursionId(Number(e.target.value));
              setBusFilter('ALL');
            }}
            className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-2 px-3"
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
        <div className="p-4 bg-[#D9FF43] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center gap-2 text-[#171717] text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#DC2626] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center gap-2 text-white text-xs font-mono font-bold">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#D9FF43]" />
          <span>{error}</span>
        </div>
      )}

      {/* Fleet & Bus Occupancy Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buses.map((bus) => {
          const seated = getBusSeatedCount(passengers, bus);
          const maxCapacity = getBusMaxCapacity(bus);
          const percentage = Math.min(100, Math.round((seated / maxCapacity) * 100));

          return (
            <button
              type="button"
              key={bus}
              className={`neo-card p-4 text-left transition-all cursor-pointer ${
                busFilter === bus
                  ? 'bg-[#3155E7] text-white border-2 border-[#171717]'
                  : 'bg-white hover:bg-[#F7F5F0]'
              }`}
              onClick={() => setBusFilter(busFilter === bus ? 'ALL' : bus)}
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                <span className={busFilter === bus ? 'text-white' : 'text-[#171717]'}>{bus}</span>
                <span className={busFilter === bus ? 'text-[#D9FF43]' : 'text-[#3155E7]'}>{percentage}%</span>
              </div>
              <div className="text-xl font-display font-black mb-2">
                {seated} <span className="text-xs font-mono font-bold opacity-75">/ {maxCapacity} chỗ</span>
              </div>
              <div className="w-full h-2.5 bg-[#E7E4DC] border-2 border-[#171717] overflow-hidden">
                <div
                  className={`h-full border-r-2 border-[#171717] transition-all duration-500 ${
                    percentage >= 100 ? 'bg-[#DC2626]' : percentage >= 80 ? 'bg-[#D9FF43]' : 'bg-[#3155E7]'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="neo-card bg-white p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#171717]/60 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, cabin, mã vé EXC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neo-input w-full pl-9 py-2 text-xs bg-[#F7F5F0]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#3155E7] shrink-0" />
          <span className="text-xs font-mono font-bold text-[#171717] uppercase">Lọc theo xe:</span>
          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-2 px-3"
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
      <div className="neo-card bg-white overflow-hidden shadow-[6px_6px_0px_#171717]">
        <div className="p-4 border-b-2 border-[#171717] flex items-center justify-between bg-[#E7E4DC]">
          <h2 className="text-sm font-display font-black text-[#171717] uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3155E7]" />
            Danh Sách Hành Khách Đã Đặt Chỗ ({filteredPassengers.length})
          </h2>
          <span className="text-xs text-[#171717] font-mono font-bold">
            {currentExcursion?.meetingTime || currentExcursion?.departureTime} - {currentExcursion?.departureTime}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white text-[#171717] border-b-2 border-[#171717] font-bold text-[10px] uppercase">
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
            <tbody className="divide-y-2 divide-[#171717] bg-white text-[#171717]">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#171717]/60 font-bold">
                    Không tìm thấy hành khách nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F5F0] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#3155E7]">{p.ticketCode}</td>
                    <td className="py-3 px-4 font-bold text-[#171717]">{p.passengerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 border border-[#171717] bg-[#E7E4DC] font-bold text-[10px]">
                        {p.cabinNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-700">{p.busNumber || 'Chưa gán'}</td>
                    <td className="py-3 px-4 text-[#171717]/70">{p.groupName || 'Nhóm 1'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold border border-[#171717] bg-[#D9FF43] text-[#171717]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReassign(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-bold text-xs transition-all active:translate-x-0.5 active:translate-y-0.5"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-[#3155E7]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="neo-card bg-white w-full max-w-md p-6 shadow-[8px_8px_0px_#171717] relative text-[#171717]">
            <h3 className="text-lg font-display font-black text-[#171717] mb-2 uppercase flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-[#3155E7]" />
              Điều Phối & Đổi Xe Vận Chuyển
            </h3>
            <p className="text-xs font-mono text-[#171717]/70 mb-4">
              Hành khách: <strong className="text-[#171717]">{selectedPassenger.passengerName}</strong> (Cabin {selectedPassenger.cabinNumber}) - Vé: {selectedPassenger.ticketCode}
            </p>

            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label htmlFor="reassign-bus-select" className="block text-xs font-mono font-bold text-[#171717] uppercase mb-1">Xe vận chuyển mới:</label>
                <select
                  id="reassign-bus-select"
                  value={targetBus}
                  onChange={(e) => setTargetBus(e.target.value)}
                  className="neo-input w-full text-xs font-bold bg-[#F7F5F0]"
                >
                  {buses.map((b) => {
                    const seated = getBusSeatedCount(passengers, b);
                    const maxCap = getBusMaxCapacity(b);
                    const isFull = seated >= maxCap;
                    const isCurrent = selectedPassenger.busNumber === b;
                    const isDisabled = isFull && !isCurrent;
                    return (
                      <option key={b} value={b} disabled={isDisabled}>
                        {b} ({seated}/{maxCap} chỗ){isDisabled ? ' - ĐÃ ĐẦY' : isCurrent ? ' - Xe hiện tại' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="neo-btn neo-btn-secondary flex-1"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={reassigning}
                  className="neo-btn neo-btn-acid flex-1 disabled:opacity-50"
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
export default ExcursionDispatcherDashboard;
