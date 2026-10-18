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
      {/* Top Banner & Excursion Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Điểm Danh & Kiểm Soát Tour Bờ</h1>
              <p className="text-sm text-slate-500">
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
            className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {excursions.map((exc) => (
              <option key={exc.id} value={exc.id}>
                {exc.title} ({exc.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => void loadData(selectedExcursionId)}
            className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-slate-200 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setScannerTargetStatus('CHECKED_IN');
              setIsQrModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 transition"
          >
            <QrCode className="w-4 h-4" /> Quét QR / Thẻ
          </button>

          <button
            onClick={() => setIsMissingModalOpen(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2 transition animate-pulse"
          >
            <AlertTriangle className="w-4 h-4" /> Khách Chưa Về ({summary?.totalMissingReturn || 0})
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-semibold ${
            notificationMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Đăng Ký</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{summary?.totalRegistered || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Sức chứa tối đa: {currentExcursion?.maxCapacity || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Tập Trung (Bến)</span>
            <UserCheck className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">{summary?.totalCheckedIn || 0}</div>
          <p className="text-xs text-indigo-400 mt-1">Chờ khởi hành: {summary?.totalPendingDeparture || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đang Đi Tour</span>
            <Bus className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{summary?.totalOnTour || 0}</div>
          <p className="text-xs text-amber-500 font-medium mt-1">Đang trên các xe tham quan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Về Tàu An Toàn</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{summary?.totalReturnedSafe || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Giờ All-Aboard: <strong className="text-slate-700">{currentExcursion?.allAboardTime || currentExcursion?.returnToShipTime}</strong></p>
        </div>
      </div>

      {/* Bus Logistics Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bus className="w-5 h-5 text-blue-600" /> Tiến Độ Điểm Danh Theo Phương Tiện (Xe Buýt)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(summary?.busStats || []).map((bus) => (
            <div key={bus.busNumber} className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">{bus.busNumber}</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  {bus.checkedIn}/{bus.total} Khách
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${bus.total > 0 ? (bus.returnedSafe / bus.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Về an toàn: <strong className="text-emerald-600">{bus.returnedSafe}</strong></span>
                <span>Chưa về: <strong className="text-red-600">{bus.missing}</strong></span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleBulkCheckInByBus(bus.busNumber, 'CHECKED_IN')}
                  className="flex-1 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-lg shadow-sm transition"
                >
                  Xuất bến xe này
                </button>
                <button
                  onClick={() => handleBulkCheckInByBus(bus.busNumber, 'RETURNED_SAFE')}
                  className="flex-1 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                >
                  Về tàu cả xe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Passenger Table & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm hành khách theo tên, cabin, mã vé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedBusFilter}
              onChange={(e) => setSelectedBusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none"
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
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-700 focus:outline-none"
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
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Hành Khách</th>
                <th className="py-3 px-4">Số Cabin</th>
                <th className="py-3 px-4">Mã Vé</th>
                <th className="py-3 px-4">Phân Xe / Đoàn</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác Điểm Danh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                    Không tìm thấy hành khách nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.passengerName}</div>
                      {p.emergencyPhone && (
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {p.emergencyPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{p.cabinNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{p.ticketCode}</td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-800">{p.busNumber || 'Chưa phân xe'}</div>
                      <div className="text-xs text-slate-500">{p.groupName || 'Chưa xếp nhóm'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.status === 'RETURNED_SAFE' ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Đã về tàu
                        </span>
                      ) : p.status === 'ON_TOUR' ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <Bus className="w-3 h-3" /> Đang đi tour
                        </span>
                      ) : p.status === 'CHECKED_IN' ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1 w-fit">
                          <UserCheck className="w-3 h-3" /> Đã tập trung
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Chưa điểm danh
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'CHECKED_IN')}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                          title="Điểm danh tập trung bến cảng"
                        >
                          Tập trung
                        </button>
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'ON_TOUR')}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition"
                          title="Xác nhận lên xe đi tour"
                        >
                          Lên xe
                        </button>
                        <button
                          onClick={() => handleIndividualStatusChange(p, 'RETURNED_SAFE')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm transition"
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
