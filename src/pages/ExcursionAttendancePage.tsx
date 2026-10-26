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
      {/* Top Banner & Excursion Selector — Luxury Maritime */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#102A43] text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-[#C5A572]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20 tracking-wider">
                  ALL-ABOARD SAFETY
                </span>
                <span className="text-[10px] text-[#687787] font-semibold">• REAL-TIME DISPATCH</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43] uppercase tracking-tight">
                Điểm Danh & Kiểm Soát Tour Bờ
              </h1>
              <p className="text-xs text-[#687787] mt-0.5">
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
            className="text-xs font-semibold bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg py-2 px-3 text-[#252B32] focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
          >
            {excursions.map((exc) => (
              <option key={exc.id} value={exc.id}>
                {exc.title} ({exc.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => void loadData(selectedExcursionId)}
            className="w-9 h-9 bg-white hover:bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7] rounded-lg shadow-xs flex items-center justify-center transition-colors cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setScannerTargetStatus('CHECKED_IN');
              setIsQrModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 py-2 px-3 text-xs font-semibold bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#C5A572]" /> Quét QR / Thẻ
          </button>

          <button
            onClick={() => setIsMissingModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold uppercase text-white bg-rose-700 hover:bg-rose-800 border border-rose-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300" /> Khách Chưa Về ({summary?.totalMissingReturn || 0})
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div
          className={`p-4 border rounded-xl flex items-center justify-between text-xs font-medium shadow-xs ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="px-2 py-0.5 border border-current rounded-md text-xs font-semibold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Overview — Luxury Maritime 4-Up Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Tổng Đăng Ký</span>
            <Users className="w-4 h-4 text-[#397C80]" />
          </div>
          <div className="text-3xl font-bold text-[#102A43] mt-1 tabular-nums">{summary?.totalRegistered || 0}</div>
          <p className="text-[10px] text-[#687787] mt-1">Sức chứa tối đa: {currentExcursion?.maxCapacity || 0}</p>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Đã Tập Trung (Bến)</span>
            <UserCheck className="w-4 h-4 text-[#397C80]" />
          </div>
          <div className="text-3xl font-bold text-[#397C80] mt-1 tabular-nums">{summary?.totalCheckedIn || 0}</div>
          <p className="text-[10px] text-[#687787] mt-1">Chờ khởi hành: {summary?.totalPendingDeparture || 0}</p>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Đang Đi Tour</span>
            <Bus className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-600 mt-1 tabular-nums">{summary?.totalOnTour || 0}</div>
          <p className="text-[10px] text-amber-700 font-medium mt-1">Đang trên các xe tham quan</p>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Đã Về Tàu An Toàn</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 mt-1 tabular-nums">{summary?.totalReturnedSafe || 0}</div>
          <p className="text-[10px] text-[#687787] mt-1">
            Giờ All-Aboard: <strong className="text-rose-600">{currentExcursion?.allAboardTime || currentExcursion?.returnToShipTime}</strong>
          </p>
        </div>
      </div>

      {/* Bus Logistics Cards */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 space-y-4 shadow-xs">
        <h2 className="text-base font-serif font-bold text-[#102A43] uppercase flex items-center gap-2 pb-3 border-b border-[#E5E0D7]">
          <Bus className="w-5 h-5 text-[#397C80]" /> Tiến Độ Điểm Danh Theo Phương Tiện (Xe Buýt)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(summary?.busStats || []).map((bus) => (
            <div key={bus.busNumber} className="border border-[#E5E0D7] rounded-xl p-4 bg-[#F7F4ED]/50 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#102A43] text-base uppercase">{bus.busNumber}</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-[#102A43]/20 bg-[#102A43]/10 text-[#102A43]">
                  {bus.checkedIn}/{bus.total} Khách
                </span>
              </div>
              <div className="w-full bg-[#E5E0D7] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 rounded-full h-full transition-all duration-300"
                  style={{ width: `${bus.total > 0 ? (bus.returnedSafe / bus.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-[#252B32]">
                <span>Về an toàn: <strong className="text-[#397C80] font-semibold">{bus.returnedSafe}</strong></span>
                <span>Chưa về: <strong className="text-rose-600 font-semibold">{bus.missing}</strong></span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleBulkCheckInByBus(bus.busNumber, 'CHECKED_IN')}
                  className="flex-1 py-1.5 text-[11px] font-medium text-[#102A43] bg-white border border-[#E5E0D7] rounded-lg shadow-xs hover:bg-[#F7F4ED] transition cursor-pointer"
                >
                  Xuất bến xe này
                </button>
                <button
                  onClick={() => handleBulkCheckInByBus(bus.busNumber, 'RETURNED_SAFE')}
                  className="flex-1 py-1.5 text-[11px] font-semibold text-white bg-[#102A43] hover:bg-[#0B1F33] rounded-lg shadow-xs transition cursor-pointer"
                >
                  Về tàu cả xe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Passenger Table & Controls */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#E5E0D7]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687787] pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm hành khách theo tên, cabin, mã vé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg text-[#252B32] placeholder-[#687787]/60 focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedBusFilter}
              onChange={(e) => setSelectedBusFilter(e.target.value)}
              className="font-semibold text-xs bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg py-2 px-3 text-[#252B32] focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
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
              className="font-semibold text-xs bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg py-2 px-3 text-[#252B32] focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
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
        <div className="overflow-x-auto border border-[#E5E0D7] rounded-lg">
          <table className="w-full text-left text-xs text-[#252B32]">
            <thead className="bg-[#F7F4ED] text-[#687787] uppercase font-semibold text-[10px] border-b border-[#E5E0D7] tracking-wider">
              <tr>
                <th className="py-3 px-4">Hành Khách</th>
                <th className="py-3 px-4">Số Cabin</th>
                <th className="py-3 px-4">Mã Vé</th>
                <th className="py-3 px-4">Phân Xe / Đoàn</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác Điểm Danh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D7] bg-white text-[#252B32]">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#687787] font-medium">
                    Không tìm thấy hành khách nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F4ED]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#252B32]">{p.passengerName}</div>
                      {p.emergencyPhone && (
                        <div className="text-[11px] text-[#687787] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#397C80]" /> {p.emergencyPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#102A43]">{p.cabinNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{p.ticketCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#252B32]">{p.busNumber || 'Chưa phân xe'}</div>
                      <div className="text-[10px] text-[#687787]">{p.groupName || 'Chưa xếp nhóm'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === 'RETURNED_SAFE' ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Đã về tàu
                        </span>
                      ) : p.status === 'ON_TOUR' ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-[#102A43]/20 bg-[#102A43]/10 text-[#102A43] flex items-center gap-1 w-fit">
                          <Bus className="w-3 h-3" /> Đang đi tour
                        </span>
                      ) : p.status === 'CHECKED_IN' ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-[#E5E0D7] bg-[#F7F4ED] text-[#252B32] flex items-center gap-1 w-fit">
                          <UserCheck className="w-3 h-3 text-[#397C80]" /> Đã tập trung
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-[#E5E0D7] bg-white text-[#687787] flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Chưa điểm danh
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'CHECKED_IN')}
                          className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7] rounded-md transition-colors cursor-pointer"
                          title="Điểm danh tập trung bến cảng"
                        >
                          Tập trung
                        </button>
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'ON_TOUR')}
                          className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7] rounded-md transition-colors cursor-pointer"
                          title="Xác nhận lên xe đi tour"
                        >
                          Lên xe
                        </button>
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'RETURNED_SAFE')}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors shadow-xs cursor-pointer"
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
