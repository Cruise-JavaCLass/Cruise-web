import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  QrCode,
  Search,
  Radio,
  Download,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
} from 'lucide-react';
import {
  type Passenger,
  type RegistrationStatus,
  type RegisterPassengerPayload,
  fetchRegisteredPassengersPaged,
  registerPassenger,
  updateRegistrationStatus,
  updateCheckInStatus,
  exportPassengersCsv,
  INITIAL_PASSENGERS,
} from '../services/passengerService';
import { INITIAL_TOURS } from '../services/tourService';
import { RegisterPassengerModal } from '../components/passengers/RegisterPassengerModal';

export function PassengersPage() {
  const [selectedTourId, setSelectedTourId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>('ALL');
  const [passengers, setPassengers] = useState<Passenger[]>(() =>
    INITIAL_PASSENGERS.filter((p) => p.tourId === 1)
  );
  const [totalCount, setTotalCount] = useState<number>(() =>
    INITIAL_PASSENGERS.filter((p) => p.tourId === 1).length
  );
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadPassengers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRegisteredPassengersPaged(selectedTourId, {
        keyword: searchTerm,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        size: pageSize,
      });
      setPassengers(res.content);
      setTotalCount(res.totalElements);
      setTotalPages(res.totalPages);
    } catch {
      showToast('Không thể tải danh sách hành khách.');
    } finally {
      setLoading(false);
    }
  }, [selectedTourId, searchTerm, statusFilter, page, pageSize]);

  useEffect(() => {
    loadPassengers();
  }, [loadPassengers]);

  const handleTourChange = (newTourId: number) => {
    setSelectedTourId(newTourId);
    setPage(0);
  };

  const handleStatusFilterChange = (newStatus: RegistrationStatus | 'ALL') => {
    setStatusFilter(newStatus);
    setPage(0);
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const blob = await exportPassengersCsv(
        selectedTourId,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passengers_tour_${selectedTourId}${statusFilter !== 'ALL' ? `_${statusFilter}` : ''}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Xuất danh sách hành khách ra file CSV thành công!');
    } catch {
      showToast('Lỗi khi xuất file CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCheckInToggle = async (passenger: Passenger) => {
    const nextStatus = passenger.checkInStatus === 'BOARDED' ? 'NOT_CHECKED_IN' : 'BOARDED';
    try {
      await updateCheckInStatus(passenger.id, nextStatus);
      showToast(`Đã cập nhật check-in cho ${passenger.fullName}: ${nextStatus === 'BOARDED' ? 'Đã lên tàu' : 'Chưa lên tàu'}`);
      loadPassengers();
    } catch {
      showToast('Cập nhật check-in thất bại.');
    }
  };

  const handleRegistrationStatusChange = async (passengerId: number, status: RegistrationStatus) => {
    try {
      await updateRegistrationStatus(passengerId, status);
      showToast('Đã cập nhật trạng thái đăng ký thành công!');
      loadPassengers();
    } catch {
      showToast('Cập nhật trạng thái đăng ký thất bại.');
    }
  };

  const handleRegisterSuccess = async (payload: RegisterPassengerPayload) => {
    await registerPassenger(payload);
    showToast(`Đã đăng ký thành công cho hành khách ${payload.fullName}!`);
    loadPassengers();
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Xác nhận
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" /> Chờ duyệt
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-5 right-5 z-50 bg-cyan-950 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
        >
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Danh Sách Hành Khách & Định Vị BLE
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gán thẻ QR / RFID • Phân loại gói tour • Quản lý trạng thái đăng ký • Xuất file CSV báo cáo cảng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Đăng Ký Khách
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" /> {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
          <button
            onClick={loadPassengers}
            disabled={loading}
            aria-label="Tải lại danh sách"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Registration & Check-in Status KPI Summary Cards (KAN-152) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Đăng Ký</p>
            <p className="text-xl font-bold text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đã Xác Nhận</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {passengers.filter((p) => p.registrationStatus === 'CONFIRMED').length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Chờ Duyệt</p>
            <p className="text-xl font-bold text-amber-400 mt-1">
              {passengers.filter((p) => p.registrationStatus === 'PENDING').length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Đã Lên Tàu</p>
            <p className="text-xl font-bold text-cyan-300 mt-1">
              {passengers.filter((p) => p.checkInStatus === 'BOARDED').length}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Radio className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Tour Selection Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tour Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Chọn Tour:</span>
            <select
              aria-label="Chọn Tour"
              value={selectedTourId}
              onChange={(e) => handleTourChange(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {INITIAL_TOURS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} - {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">Trạng thái:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
              {(['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusFilterChange(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'ALL'
                    ? 'Tất cả'
                    : st === 'CONFIRMED'
                    ? 'Xác nhận'
                    : st === 'PENDING'
                    ? 'Chờ duyệt'
                    : 'Đã hủy'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Input & Reset */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm hành khách"
              placeholder="Tìm theo tên, cabin, mã RFID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => {
                  setSearchTerm('');
                  setPage(0);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {(searchTerm || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPage(0);
              }}
              className="px-2.5 py-2 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl whitespace-nowrap transition-colors"
              title="Đặt lại bộ lọc"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Passenger Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">
            Danh Sách Hành Khách Đăng Ký ({totalCount} Khách)
          </h3>
          <span className="text-xs text-purple-400 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> BLE Zone Tracking: Hoạt động
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Hành khách</th>
                <th className="p-3.5">Cabin</th>
                <th className="p-3.5">Thẻ / Vòng RFID</th>
                <th className="p-3.5">Gói Tour</th>
                <th className="p-3.5">Vị trí BLE ước lượng</th>
                <th className="p-3.5">Trạng thái đăng ký</th>
                <th className="p-3.5">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading && passengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Đang tải danh sách hành khách...
                  </td>
                </tr>
              ) : passengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không tìm thấy hành khách nào phù hợp với từ khóa "{searchTerm}"
                  </td>
                </tr>
              ) : (
                passengers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{p.fullName}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.email || p.phoneNumber || 'Không có liên hệ'}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-medium">{p.cabinNumber}</td>
                    <td className="p-3.5 font-mono text-cyan-400">
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5" /> {p.rfidTag}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
                        {p.tourPackage}
                      </span>
                    </td>
                    <td className="p-3.5 text-purple-300 font-medium">{p.bleZone || 'Chưa cập nhật'}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(p.registrationStatus)}
                        <select
                          aria-label={`Đổi trạng thái đăng ký của ${p.fullName}`}
                          value={p.registrationStatus}
                          onChange={(e) =>
                            handleRegistrationStatusChange(p.id, e.target.value as RegistrationStatus)
                          }
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="CONFIRMED">Xác nhận</option>
                          <option value="PENDING">Chờ duyệt</option>
                          <option value="CANCELLED">Hủy đăng ký</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <button
                          onClick={() => handleCheckInToggle(p)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                            p.checkInStatus === 'BOARDED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {p.checkInStatus === 'BOARDED' ? 'Đã lên tàu' : 'Chưa check-in'}
                        </button>
                        {p.boardedAt && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {new Date(p.boardedAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Trang {page + 1} / {totalPages} (Tổng số {totalCount} hành khách)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors"
              >
                Trang trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition-colors"
              >
                Trang sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Đăng Ký Hành Khách */}
      <RegisterPassengerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tourId={selectedTourId}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
}
