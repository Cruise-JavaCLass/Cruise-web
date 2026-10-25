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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-[#D9FF43] text-[#171717]">
            <CheckCircle2 className="w-3 h-3 text-[#171717]" /> Xác nhận
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-amber-300 text-[#171717]">
            <Clock className="w-3 h-3 text-[#171717]" /> Chờ duyệt
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-[#DC2626] text-white">
            <XCircle className="w-3 h-3 text-white" /> Đã hủy
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
          className="fixed top-20 right-6 z-50 bg-[#171717] border-2 border-[#D9FF43] text-white px-5 py-3 shadow-[4px_4px_0px_#171717] text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#D9FF43]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Actions — Editorial Broadside */}
      <div className="neo-card bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[6px_6px_0px_#171717]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#3155E7] text-white">PASSENGER MANIFEST</span>
            <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• BLE SMART ZONE TRACKING</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-black text-[#171717] flex items-center gap-2 uppercase tracking-tight">
            <Users className="w-6 h-6 text-[#3155E7]" /> Danh Sách Hành Khách & Định Vị BLE
          </h2>
          <p className="text-xs font-mono text-[#171717]/70 mt-1">
            Gán thẻ QR / RFID • Phân loại gói tour • Quản lý trạng thái đăng ký • Xuất file CSV báo cáo cảng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="neo-btn neo-btn-acid py-2 px-3 text-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Đăng Ký Khách
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="neo-btn neo-btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#3155E7]" /> {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
          <button
            onClick={loadPassengers}
            disabled={loading}
            aria-label="Tải lại danh sách"
            className="w-9 h-9 bg-white hover:bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Registration & Check-in Status KPI Summary Cards (KAN-152) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="neo-card bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Tổng Đăng Ký</p>
            <p className="text-3xl font-display font-black text-[#171717] mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
            <Users className="w-5 h-5 text-[#3155E7]" />
          </div>
        </div>

        <div className="neo-card bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Đã Xác Nhận</p>
            <p className="text-3xl font-display font-black text-[#171717] mt-1">
              {passengers.filter((p) => p.registrationStatus === 'CONFIRMED').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-[#D9FF43] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="neo-card bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Chờ Duyệt</p>
            <p className="text-3xl font-display font-black text-amber-600 mt-1">
              {passengers.filter((p) => p.registrationStatus === 'PENDING').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-200 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="neo-card bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Đã Lên Tàu</p>
            <p className="text-3xl font-display font-black text-[#3155E7] mt-1">
              {passengers.filter((p) => p.checkInStatus === 'BOARDED').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Tour Selection Bar */}
      <div className="neo-card bg-white p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tour Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#171717] uppercase">Chọn Tour:</span>
            <select
              aria-label="Chọn Tour"
              value={selectedTourId}
              onChange={(e) => handleTourChange(Number(e.target.value))}
              className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-1.5 px-3"
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
            <Filter className="w-3.5 h-3.5 text-[#3155E7]" />
            <span className="text-xs font-mono font-bold text-[#171717] uppercase">Trạng thái:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusFilterChange(st)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold border-2 border-[#171717] transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                    statusFilter === st
                      ? 'bg-[#3155E7] text-white shadow-[2px_2px_0px_#171717]'
                      : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
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
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#171717]/60 pointer-events-none" />
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
              className="neo-input w-full pl-9 pr-8 py-2 text-xs bg-[#F7F5F0]"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => {
                  setSearchTerm('');
                  setPage(0);
                }}
                className="absolute right-2.5 top-2.5 text-[#171717]/60 hover:text-[#DC2626]"
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
              className="neo-btn neo-btn-secondary py-2 px-3 text-xs whitespace-nowrap"
              title="Đặt lại bộ lọc"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Passenger Table */}
      <div className="neo-card bg-white overflow-hidden shadow-[6px_6px_0px_#171717]">
        <div className="p-4 border-b-2 border-[#171717] flex items-center justify-between bg-[#E7E4DC]">
          <h3 className="font-display font-black text-sm text-[#171717] uppercase">
            Danh Sách Hành Khách Đăng Ký ({totalCount} Khách)
          </h3>
          <span className="text-xs font-mono font-bold text-[#3155E7] flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-[#3155E7] animate-pulse" /> BLE Zone Tracking: Hoạt động
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white text-[#171717] uppercase text-[10px] font-bold tracking-wider border-b-2 border-[#171717]">
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
            <tbody className="divide-y-2 divide-[#171717] bg-white text-[#171717]">
              {loading && passengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#171717]/70 font-bold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#3155E7]" />
                    Đang tải danh sách hành khách...
                  </td>
                </tr>
              ) : passengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#171717]/70 font-bold">
                    Không tìm thấy hành khách nào phù hợp với từ khóa "{searchTerm}"
                  </td>
                </tr>
              ) : (
                passengers.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F5F0] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#171717]">{p.fullName}</div>
                      <div className="text-[11px] text-[#171717]/60">
                        {p.email || p.phoneNumber || 'Không có liên hệ'}
                      </div>
                    </td>
                    <td className="p-3.5 text-[#171717] font-bold">{p.cabinNumber}</td>
                    <td className="p-3.5 font-mono text-[#3155E7] font-bold">
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5" /> {p.rfidTag}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="border border-[#171717] bg-[#E7E4DC] px-2 py-0.5 text-[10px] font-bold text-[#171717]">
                        {p.tourPackage}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#3155E7] font-bold">{p.bleZone || 'Chưa cập nhật'}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(p.registrationStatus)}
                        <select
                          aria-label={`Đổi trạng thái đăng ký của ${p.fullName}`}
                          value={p.registrationStatus}
                          onChange={(e) =>
                            handleRegistrationStatusChange(p.id, e.target.value as RegistrationStatus)
                          }
                          className="neo-input py-0.5 px-2 text-[10px] font-bold bg-[#F7F5F0]"
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
                          className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase border border-[#171717] shadow-[1px_1px_0px_#171717] transition-all active:translate-x-0.5 active:translate-y-0.5 ${
                            p.checkInStatus === 'BOARDED'
                              ? 'bg-[#D9FF43] text-[#171717]'
                              : 'bg-white text-[#171717]/70 hover:bg-[#E7E4DC]'
                          }`}
                        >
                          {p.checkInStatus === 'BOARDED' ? 'Đã lên tàu' : 'Chưa check-in'}
                        </button>
                        {p.boardedAt && (
                          <span className="text-[10px] text-[#171717]/60 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#3155E7]" />
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
          <div className="p-4 border-t-2 border-[#171717] flex items-center justify-between text-xs font-mono font-bold text-[#171717]">
            <span>
              Trang {page + 1} / {totalPages} (Tổng số {totalCount} hành khách)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="neo-btn neo-btn-secondary py-1 px-3 text-xs disabled:opacity-40"
              >
                Trang trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className="neo-btn neo-btn-secondary py-1 px-3 text-xs disabled:opacity-40"
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

export default PassengersPage;
