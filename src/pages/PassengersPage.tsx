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
import { getTours, INITIAL_TOURS, type CruiseTour } from '../services/tourService';
import { RegisterPassengerModal } from '../components/passengers/RegisterPassengerModal';

export function PassengersPage() {
  const [tours, setTours] = useState<CruiseTour[]>(INITIAL_TOURS);
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

  useEffect(() => {
    void getTours().then((list) => {
      if (list.length > 0) {
        setTours(list);
        setSelectedTourId((prev) => {
          if (list.some((t) => t.id === prev)) return prev;
          setPage(0);
          return list[0].id;
        });
      }
    });
  }, []);

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
    void loadPassengers();
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
      void loadPassengers();
    } catch {
      showToast('Cập nhật check-in thất bại.');
    }
  };

  const handleRegistrationStatusChange = async (passengerId: number, status: RegistrationStatus) => {
    try {
      await updateRegistrationStatus(passengerId, status);
      showToast('Đã cập nhật trạng thái đăng ký thành công!');
      void loadPassengers();
    } catch {
      showToast('Cập nhật trạng thái đăng ký thất bại.');
    }
  };

  const handleRegisterSuccess = async (payload: RegisterPassengerPayload) => {
    await registerPassenger(payload);
    showToast(`Đã đăng ký thành công cho hành khách ${payload.fullName}!`);
    void loadPassengers();
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Xác nhận
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ duyệt
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Đã hủy
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
          className="fixed top-20 right-6 z-50 bg-white border border-[#E5E0D7] text-[#252B32] px-5 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Actions — Luxury Maritime */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/30 tracking-wider">
              PASSENGER MANIFEST
            </span>
            <span className="text-[11px] font-medium text-[#687787]">• BLE SMART ZONE TRACKING</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43] flex items-center gap-2 tracking-tight">
            <Users className="w-6 h-6 text-[#102A43]" /> Danh Sách Hành Khách & Định Vị BLE
          </h2>
          <p className="text-xs text-[#687787] mt-1">
            Gán thẻ QR / RFID • Phân loại gói tour • Quản lý trạng thái đăng ký • Xuất file CSV báo cáo cảng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#102A43] hover:bg-[#183B5B] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Đăng Ký Khách
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-[#E5E0D7] hover:bg-[#F7F4ED] text-[#102A43] rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#102A43]" /> {isExporting ? 'Đang xuất...' : 'Xuất CSV'}
          </button>
          <button
            onClick={() => void loadPassengers()}
            disabled={loading}
            aria-label="Tải lại danh sách"
            className="w-9 h-9 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-lg shadow-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Registration & Check-in Status KPI Summary Cards (KAN-152) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#687787] uppercase tracking-wider">Tổng Đăng Ký</p>
            <p className="text-2xl font-serif font-bold tabular-nums text-[#102A43] mt-1">{totalCount}</p>
          </div>
          <div className="w-10 h-10 bg-[#F7F4ED] rounded-xl flex items-center justify-center text-[#102A43] border border-[#E5E0D7]">
            <Users className="w-5 h-5 text-[#102A43]" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#687787] uppercase tracking-wider">Đã Xác Nhận</p>
            <p className="text-2xl font-serif font-bold tabular-nums text-emerald-700 mt-1">
              {passengers.filter((p) => p.registrationStatus === 'CONFIRMED').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#687787] uppercase tracking-wider">Chờ Duyệt</p>
            <p className="text-2xl font-serif font-bold tabular-nums text-amber-700 mt-1">
              {passengers.filter((p) => p.registrationStatus === 'PENDING').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-[#687787] uppercase tracking-wider">Đã Lên Tàu</p>
            <p className="text-2xl font-serif font-bold tabular-nums text-[#102A43] mt-1">
              {passengers.filter((p) => p.checkInStatus === 'BOARDED').length}
            </p>
          </div>
          <div className="w-10 h-10 bg-[#102A43]/10 rounded-xl flex items-center justify-center text-[#102A43] border border-[#102A43]/20">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Tour Selection Bar */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tour Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#687787] uppercase tracking-wider">Chọn Tour:</span>
            <select
              aria-label="Chọn Tour"
              value={selectedTourId}
              onChange={(e) => handleTourChange(Number(e.target.value))}
              className="text-xs font-semibold bg-[#F7F4ED] hover:bg-white focus:bg-white border border-[#E5E0D7] rounded-lg text-[#252B32] py-1.5 px-3 focus:outline-none focus:border-[#102A43]"
            >
              {tours.length === 0 ? (
                <option value={1}>Tour #1 (Mặc định)</option>
              ) : (
                tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} - {t.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#102A43]" />
            <span className="text-xs font-semibold text-[#687787] uppercase tracking-wider">Trạng thái:</span>
            <div className="flex items-center gap-1">
              {(['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusFilterChange(st)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#102A43] text-white shadow-xs'
                      : 'bg-white text-[#687787] border border-[#E5E0D7] hover:bg-[#F7F4ED]'
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
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#687787] pointer-events-none" />
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
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7F4ED] hover:bg-white focus:bg-white border border-[#E5E0D7] rounded-lg text-[#252B32] focus:outline-none focus:border-[#102A43] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => {
                  setSearchTerm('');
                  setPage(0);
                }}
                className="absolute right-2.5 top-2.5 text-[#687787] hover:text-rose-600 cursor-pointer"
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
              className="px-3.5 py-2 text-xs font-semibold text-[#102A43] bg-white border border-[#E5E0D7] rounded-lg hover:bg-[#F7F4ED] shadow-xs whitespace-nowrap transition-colors cursor-pointer"
              title="Đặt lại bộ lọc"
            >
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* Passenger Table */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <h3 className="font-serif font-bold text-sm text-[#102A43]">
            Danh Sách Hành Khách Đăng Ký ({totalCount} Khách)
          </h3>
          <span className="text-xs font-medium text-[#102A43] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#102A43] animate-pulse" /> BLE Zone Tracking: Hoạt động
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] text-[#687787] uppercase text-[10px] font-semibold tracking-wider border-b border-[#E5E0D7]">
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
            <tbody className="divide-y divide-[#E5E0D7] bg-white text-[#252B32]">
              {loading && passengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#687787] font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#102A43]" />
                    Đang tải danh sách hành khách...
                  </td>
                </tr>
              ) : passengers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#687787] font-medium">
                    Không tìm thấy hành khách nào phù hợp với từ khóa "{searchTerm}"
                  </td>
                </tr>
              ) : (
                passengers.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F4ED]/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-[#252B32]">{p.fullName}</div>
                      <div className="text-[11px] text-[#687787]">
                        {p.email || p.phoneNumber || 'Không có liên hệ'}
                      </div>
                    </td>
                    <td className="p-3.5 text-[#252B32] font-semibold">{p.cabinNumber}</td>
                    <td className="p-3.5 font-mono text-[#102A43] font-semibold">
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5" /> {p.rfidTag}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7]">
                        {p.tourPackage}
                      </span>
                    </td>
                    <td className="p-3.5 text-[#102A43] font-medium">{p.bleZone || 'Chưa cập nhật'}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(p.registrationStatus)}
                        <select
                          aria-label={`Đổi trạng thái đăng ký của ${p.fullName}`}
                          value={p.registrationStatus}
                          onChange={(e) =>
                            handleRegistrationStatusChange(p.id, e.target.value as RegistrationStatus)
                          }
                          className="py-1 px-2 text-xs font-medium rounded-md bg-[#F7F4ED] border border-[#E5E0D7] text-[#252B32] focus:outline-none focus:border-[#102A43]"
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
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            p.checkInStatus === 'BOARDED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-white text-[#687787] border border-[#E5E0D7] hover:bg-[#F7F4ED]'
                          }`}
                        >
                          {p.checkInStatus === 'BOARDED' ? 'Đã lên tàu' : 'Chưa check-in'}
                        </button>
                        {p.boardedAt && (
                          <span className="text-[11px] text-[#687787] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#102A43]" />
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
          <div className="p-4 border-t border-[#E5E0D7] flex items-center justify-between text-xs font-semibold text-[#252B32]">
            <span>
              Trang {page + 1} / {totalPages} (Tổng số {totalCount} hành khách)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                className="py-1 px-3 text-xs bg-white border border-[#E5E0D7] rounded-lg disabled:opacity-40 hover:bg-[#F7F4ED] cursor-pointer"
              >
                Trang trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                className="py-1 px-3 text-xs bg-white border border-[#E5E0D7] rounded-lg disabled:opacity-40 hover:bg-[#F7F4ED] cursor-pointer"
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
