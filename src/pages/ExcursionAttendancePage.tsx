import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Bus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Phone,
} from 'lucide-react';
import {
  fetchExcursions,
  getAttendanceSummary,
  checkInPassenger,
  bulkCheckInPassengers,
  type ShoreExcursion,
  type AttendanceSummary,
  type ExcursionPassenger,
  type ExcursionCheckInPayload,
  type ExcursionCheckInResult,
} from '../services/excursionService';
import { MissingPassengerModal } from '../components/excursions/MissingPassengerModal';
import { QrScannerModal } from '../components/excursions/QrScannerModal';

export const ExcursionAttendancePage: React.FC = () => {
  const [excursions, setExcursions] = useState<ShoreExcursion[]>([]);
  const [selectedExcursionId, setSelectedExcursionId] = useState<number>(1);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBusFilter, setSelectedBusFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [scannerTargetStatus, setScannerTargetStatus] = useState<'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE'>('CHECKED_IN');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const loadRequestRef = useRef(0);

  const loadData = async (excId?: number) => {
    const requestId = ++loadRequestRef.current;
    try {
      const allExc = await fetchExcursions();
      if (requestId !== loadRequestRef.current) return;
      setExcursions(allExc);

      const targetId = excId || selectedExcursionId || allExc[0]?.id || 1;
      setSelectedExcursionId(targetId);

      const sum = await getAttendanceSummary(targetId);
      if (requestId !== loadRequestRef.current) return;
      setSummary(sum);
    } catch (err) {
      if (requestId === loadRequestRef.current) {
        console.error('Error loading attendance summary:', err);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const currentExcursion = excursions.find((e) => e.id === selectedExcursionId) || excursions[0];
  const passengerList: ExcursionPassenger[] = currentExcursion?.passengers || [];

  // Filter passengers
  const filteredPassengers = passengerList.filter((p) => {
    const matchSearch =
      p.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.ticketCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchBus = selectedBusFilter === 'ALL' || p.busNumber === selectedBusFilter;
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

    return matchSearch && matchBus && matchStatus;
  });

  const busList = Array.from(new Set(passengerList.map((p) => p.busNumber).filter(Boolean)));

  const handleIndividualStatusChange = async (passenger: ExcursionPassenger, targetStatus: 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE') => {
    try {
      await checkInPassenger(selectedExcursionId, {
        excursionPassengerId: passenger.id,
        targetStatus,
      });
      setNotificationMsg({ type: 'success', text: `Đã cập nhật ${passenger.passengerName} sang ${targetStatus}` });
      await loadData(selectedExcursionId);
    } catch (err: unknown) {
      setNotificationMsg({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi cập nhật điểm danh' });
    }
  };

  const handleBulkCheckInByBus = async (busNumber: string, targetStatus: 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE') => {
    try {
      const res = await bulkCheckInPassengers(selectedExcursionId, {
        busNumber,
        targetStatus,
      });
      setNotificationMsg({ type: 'success', text: res.message });
      await loadData(selectedExcursionId);
    } catch (err: unknown) {
      setNotificationMsg({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi cập nhật đoàn' });
    }
  };

  const handleScanSubmit = async (payload: ExcursionCheckInPayload): Promise<ExcursionCheckInResult | null> => {
    const res = await checkInPassenger(selectedExcursionId, payload);
    await loadData(selectedExcursionId);
    return res;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Excursion Selector — Editorial Broadside */}
      <div className="neo-card bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[6px_6px_0px_#171717]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="neo-badge bg-[#D9FF43] text-[#171717]">ALL-ABOARD SAFETY</span>
                <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• REAL-TIME DISPATCH</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-[#171717] uppercase tracking-tight">
                Điểm Danh & Kiểm Soát Tour Bờ
              </h1>
              <p className="text-xs font-mono text-[#171717]/70 mt-0.5">
                Quản lý lên xe xuất bến và xác nhận hành khách quay lại tàu an toàn (All-Aboard)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedExcursionId}
            onChange={(e) => {
              const newId = Number(e.target.value);
              setSelectedExcursionId(newId);
              void loadData(newId);
            }}
            className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-2 px-3"
          >
            {excursions.map((exc) => (
              <option key={exc.id} value={exc.id}>
                {exc.title} ({exc.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => void loadData(selectedExcursionId)}
            className="w-9 h-9 bg-white hover:bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setScannerTargetStatus('CHECKED_IN');
              setIsQrModalOpen(true);
            }}
            className="neo-btn neo-btn-primary py-2 px-3 text-xs flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" /> Quét QR / Thẻ
          </button>

          <button
            onClick={() => setIsMissingModalOpen(true)}
            className="px-3.5 py-2 text-xs font-mono font-black uppercase text-white bg-[#DC2626] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center gap-1.5 hover:bg-[#DC2626]/90 transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <AlertTriangle className="w-4 h-4 text-[#D9FF43]" /> Khách Chưa Về ({summary?.totalMissingReturn || 0})
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div
          className={`p-4 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center justify-between text-xs font-mono font-bold ${
            notificationMsg.type === 'success' ? 'bg-[#D9FF43] text-[#171717]' : 'bg-[#DC2626] text-white'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="px-2 py-0.5 border border-[#171717] text-xs font-bold uppercase">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Overview — Neo-Brutalist 4-Up Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="neo-card bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Tổng Đăng Ký</span>
            <Users className="w-4 h-4 text-[#3155E7]" />
          </div>
          <div className="text-3xl font-display font-black text-[#171717] mt-1">{summary?.totalRegistered || 0}</div>
          <p className="text-[10px] font-mono text-[#171717]/60 mt-1">Sức chứa tối đa: {currentExcursion?.maxCapacity || 0}</p>
        </div>

        <div className="neo-card bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Đã Tập Trung (Bến)</span>
            <UserCheck className="w-4 h-4 text-[#3155E7]" />
          </div>
          <div className="text-3xl font-display font-black text-[#3155E7] mt-1">{summary?.totalCheckedIn || 0}</div>
          <p className="text-[10px] font-mono text-[#171717]/60 mt-1">Chờ khởi hành: {summary?.totalPendingDeparture || 0}</p>
        </div>

        <div className="neo-card bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Đang Đi Tour</span>
            <Bus className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-display font-black text-amber-600 mt-1">{summary?.totalOnTour || 0}</div>
          <p className="text-[10px] font-mono text-amber-700 font-bold mt-1">Đang trên các xe tham quan</p>
        </div>

        <div className="neo-card bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Đã Về Tàu An Toàn</span>
            <CheckCircle2 className="w-4 h-4 text-[#171717]" />
          </div>
          <div className="text-3xl font-display font-black text-[#171717] mt-1">{summary?.totalReturnedSafe || 0}</div>
          <p className="text-[10px] font-mono text-[#171717]/60 mt-1">
            Giờ All-Aboard: <strong className="text-[#DC2626]">{currentExcursion?.allAboardTime || currentExcursion?.returnToShipTime}</strong>
          </p>
        </div>
      </div>

      {/* Bus Logistics Cards */}
      <div className="neo-card bg-white p-6 space-y-4">
        <h2 className="text-base font-display font-black text-[#171717] uppercase flex items-center gap-2 pb-3 border-b-2 border-[#171717]">
          <Bus className="w-5 h-5 text-[#3155E7]" /> Tiến Độ Điểm Danh Theo Phương Tiện (Xe Buýt)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(summary?.busStats || []).map((bus) => (
            <div key={bus.busNumber} className="border-2 border-[#171717] p-4 bg-[#F7F5F0] shadow-[2px_2px_0px_#171717] flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-[#171717] text-base uppercase">{bus.busNumber}</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold border border-[#171717] bg-[#3155E7] text-white">
                  {bus.checkedIn}/{bus.total} Khách
                </span>
              </div>
              <div className="w-full bg-white border-2 border-[#171717] h-3 overflow-hidden">
                <div
                  className="bg-[#D9FF43] border-r-2 border-[#171717] h-full transition-all duration-300"
                  style={{ width: `${bus.total > 0 ? (bus.returnedSafe / bus.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#171717]">
                <span>Về an toàn: <strong className="text-[#3155E7]">{bus.returnedSafe}</strong></span>
                <span>Chưa về: <strong className="text-[#DC2626]">{bus.missing}</strong></span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleBulkCheckInByBus(bus.busNumber, 'CHECKED_IN')}
                  className="flex-1 py-1.5 text-[11px] font-mono font-bold text-[#171717] bg-white border-2 border-[#171717] shadow-[1px_1px_0px_#171717] hover:bg-[#E7E4DC] active:translate-x-0.5 active:translate-y-0.5 transition"
                >
                  Xuất bến xe này
                </button>
                <button
                  onClick={() => handleBulkCheckInByBus(bus.busNumber, 'RETURNED_SAFE')}
                  className="flex-1 py-1.5 text-[11px] font-mono font-bold text-[#171717] bg-[#D9FF43] border-2 border-[#171717] shadow-[1px_1px_0px_#171717] hover:bg-[#D9FF43]/90 active:translate-x-0.5 active:translate-y-0.5 transition"
                >
                  Về tàu cả xe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Passenger Table & Controls */}
      <div className="neo-card bg-white p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b-2 border-[#171717]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#171717]/60 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm hành khách theo tên, cabin, mã vé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input w-full pl-9 py-2 text-xs bg-[#F7F5F0]"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedBusFilter}
              onChange={(e) => setSelectedBusFilter(e.target.value)}
              className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-2 px-3"
            >
              <option value="ALL">Tất cả xe ({passengerList.length})</option>
              {busList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-2 px-3"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="REGISTERED">Chưa điểm danh (REGISTERED)</option>
              <option value="CHECKED_IN">Đã tập trung (CHECKED_IN)</option>
              <option value="ON_TOUR">Đang đi tour (ON_TOUR)</option>
              <option value="RETURNED_SAFE">Đã về tàu (RETURNED_SAFE)</option>
            </select>
          </div>
        </div>

        {/* Passenger List Table */}
        <div className="overflow-x-auto border-2 border-[#171717]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#E7E4DC] text-[#171717] uppercase font-bold text-[10px] border-b-2 border-[#171717]">
              <tr>
                <th className="py-3 px-4">Hành Khách</th>
                <th className="py-3 px-4">Số Cabin</th>
                <th className="py-3 px-4">Mã Vé</th>
                <th className="py-3 px-4">Phân Xe / Đoàn</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác Điểm Danh</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#171717] bg-white text-[#171717]">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#171717]/60 font-mono font-bold">
                    Không tìm thấy hành khách nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F5F0] transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#171717]">{p.passengerName}</div>
                      {p.emergencyPhone && (
                        <div className="text-[11px] text-[#171717]/70 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#3155E7]" /> {p.emergencyPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#3155E7]">{p.cabinNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{p.ticketCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#171717]">{p.busNumber || 'Chưa phân xe'}</div>
                      <div className="text-[10px] text-[#171717]/60">{p.groupName || 'Chưa xếp nhóm'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === 'RETURNED_SAFE' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold border border-[#171717] bg-[#D9FF43] text-[#171717] flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Đã về tàu
                        </span>
                      ) : p.status === 'ON_TOUR' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold border border-[#171717] bg-[#3155E7] text-white flex items-center gap-1 w-fit">
                          <Bus className="w-3 h-3" /> Đang đi tour
                        </span>
                      ) : p.status === 'CHECKED_IN' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold border border-[#171717] bg-[#E7E4DC] text-[#171717] flex items-center gap-1 w-fit">
                          <UserCheck className="w-3 h-3" /> Đã tập trung
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold border border-[#171717] bg-white text-[#171717]/70 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Chưa điểm danh
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'CHECKED_IN')}
                          className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white hover:bg-[#E7E4DC] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5"
                          title="Điểm danh tập trung bến cảng"
                        >
                          Tập trung
                        </button>
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'ON_TOUR')}
                          className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white hover:bg-[#E7E4DC] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5"
                          title="Xác nhận lên xe đi tour"
                        >
                          Lên xe
                        </button>
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'RETURNED_SAFE')}
                          className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#D9FF43] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] hover:bg-[#D9FF43]/90 active:translate-x-0.5 active:translate-y-0.5"
                          title="Xác nhận về tàu an toàn"
                        >
                          Về tàu
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MissingPassengerModal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
        summary={summary}
        onQuickCheckIn={async (pId) => {
          try {
            await checkInPassenger(selectedExcursionId, {
              excursionPassengerId: pId,
              targetStatus: 'RETURNED_SAFE',
            });
            await loadData(selectedExcursionId);
          } catch (err: unknown) {
            setNotificationMsg({
              type: 'error',
              text: err instanceof Error ? err.message : 'Lỗi xác nhận về tàu',
            });
          }
        }}
      />

      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSubmit={handleScanSubmit}
        targetStatus={scannerTargetStatus}
      />
    </div>
  );
};
export default ExcursionAttendancePage;
