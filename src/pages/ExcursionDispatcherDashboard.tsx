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
      <div className="flex flex-col items-center justify-center p-16 text-[#252B32] gap-4">
        <div className="w-12 h-12 bg-white border border-[#E5E0D7] rounded-xl shadow-sm flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#102A43] animate-spin" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-[#687787]">Đang tải trung tâm điều phối tour bờ...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header — Luxury Maritime Broadside */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20 tracking-wider">
              SHORE LOGISTICS
            </span>
            <span className="text-[10px] text-[#687787] font-semibold">• BUS FLEET DISPATCH</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43] uppercase tracking-tight flex items-center gap-2.5">
            <Bus className="w-6 h-6 text-[#397C80]" />
            Điều Phối Tour Bờ & Bảng Phân Xe (Bus Dispatcher)
          </h1>
          <p className="text-xs text-[#687787] mt-1">
            Điều phối danh sách hành khách theo từng xe du lịch, quản lý sức chứa và linh hoạt chuyển xe.
          </p>
        </div>

        {/* Excursion Switcher */}
        <div className="flex items-center gap-2">
          <label htmlFor="excursion-select" className="text-xs font-semibold text-[#252B32] uppercase">Chọn Tour Bờ:</label>
          <select
            id="excursion-select"
            value={selectedExcursionId || ''}
            onChange={(e) => {
              setSelectedExcursionId(Number(e.target.value));
              setBusFilter('ALL');
            }}
            className="font-semibold text-xs bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg py-2 px-3 text-[#252B32] focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-medium shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
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
              className={`p-4 text-left transition-all rounded-xl border cursor-pointer ${
                busFilter === bus
                  ? 'bg-[#102A43] text-white border-[#102A43] shadow-md'
                  : 'bg-white hover:bg-[#F7F4ED]/60 border-[#E5E0D7] shadow-xs'
              }`}
              onClick={() => setBusFilter(busFilter === bus ? 'ALL' : bus)}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className={busFilter === bus ? 'text-white' : 'text-[#252B32]'}>{bus}</span>
                <span className={busFilter === bus ? 'text-[#C5A572]' : 'text-[#397C80]'}>{percentage}%</span>
              </div>
              <div className="text-xl font-bold mb-2 tabular-nums">
                {seated} <span className="text-xs font-medium opacity-75">/ {maxCapacity} chỗ</span>
              </div>
              <div className="w-full h-2 bg-[#E5E0D7] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 100 ? 'bg-rose-600' : percentage >= 80 ? 'bg-amber-500' : 'bg-[#397C80]'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#687787] absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên, cabin, mã vé EXC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 py-2 text-xs bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg text-[#252B32] placeholder-[#687787]/60 focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-[#397C80] shrink-0" />
          <span className="text-xs font-semibold text-[#252B32] uppercase">Lọc theo xe:</span>
          <select
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="font-semibold text-xs bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg py-2 px-3 text-[#252B32] focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
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
      <div className="bg-white border border-[#E5E0D7] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <h2 className="text-sm font-bold text-[#102A43] font-serif uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-[#397C80]" />
            Danh Sách Hành Khách Đã Đặt Chỗ ({filteredPassengers.length})
          </h2>
          <span className="text-xs text-[#687787] font-semibold">
            {currentExcursion?.meetingTime || currentExcursion?.departureTime} - {currentExcursion?.departureTime}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] text-[#687787] border-b border-[#E5E0D7] font-semibold text-[10px] uppercase tracking-wider">
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
            <tbody className="divide-y divide-[#E5E0D7] bg-white text-[#252B32]">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#687787] font-medium">
                    Không tìm thấy hành khách nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F4ED]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#102A43]">{p.ticketCode}</td>
                    <td className="py-3 px-4 font-semibold text-[#252B32]">{p.passengerName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 border border-[#E5E0D7] bg-[#F7F4ED] rounded-md font-semibold text-[10px]">
                        {p.cabinNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-700">{p.busNumber || 'Chưa gán'}</td>
                    <td className="py-3 px-4 text-[#687787]">{p.groupName || 'Nhóm 1'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-[#E5E0D7] bg-[#F7F4ED] text-[#252B32]">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenReassign(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-[#397C80]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs" role="dialog" aria-modal="true">
          <div className="bg-white border border-[#E5E0D7] rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative text-[#252B32]">
            <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-serif font-bold text-[#102A43] uppercase flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-[#397C80]" />
                Điều Phối & Đổi Xe Vận Chuyển
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#687787]">
                Hành khách: <strong className="text-[#252B32]">{selectedPassenger.passengerName}</strong> (Cabin {selectedPassenger.cabinNumber}) - Vé: {selectedPassenger.ticketCode}
              </p>

              <form onSubmit={handleReassignSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reassign-bus-select" className="block text-xs font-semibold text-[#687787] uppercase mb-1">Xe vận chuyển mới:</label>
                  <select
                    id="reassign-bus-select"
                    value={targetBus}
                    onChange={(e) => setTargetBus(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg px-3 py-2 text-[#252B32] focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
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
                    className="flex-1 px-4 py-2 bg-white text-[#102A43] border border-[#E5E0D7] hover:bg-[#F7F4ED] rounded-lg text-xs font-medium transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={reassigning}
                    className="flex-1 px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                  >
                    {reassigning ? 'Đang Chuyển...' : 'Xác Nhận Đổi Xe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExcursionDispatcherDashboard;
