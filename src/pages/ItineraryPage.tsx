import { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Ship,
  MapPin,
  Users,
  Tag,
  Edit2,
  Trash2,
  ArrowRightCircle,
  AlertTriangle,
  CheckCircle2,
  Anchor,
  CalendarDays,
  ArrowLeft,
} from 'lucide-react';
import { DailyItineraryTimeline } from '../components/itinerary/DailyItineraryTimeline';
import type { CruiseTour, TourFormData, TourStatus } from '../services/tourService';
import {
  getTours,
  createTour,
  updateTour,
  updateTourStatus,
  deleteTour,
  formatTourPayload,
} from '../services/tourService';
import type { Ship as ShipType } from '../services/shipService';
import { getShips } from '../services/shipService';
import type { Port } from '../services/portStopService';
import { getPorts } from '../services/portStopService';
import { TourFormModal } from '../components/tours/TourFormModal';
import { StatusTransitionModal } from '../components/tours/StatusTransitionModal';
import { TourStopsModal } from '../components/tours/TourStopsModal';

const STATUS_BADGES: Record<TourStatus, { label: string; cls: string }> = {
  DRAFT: {
    label: 'Bản nháp',
    cls: 'bg-gray-100 text-gray-700 border border-gray-200/70',
  },
  PUBLISHED: {
    label: 'Mở bán',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
  },
  IN_PROGRESS: {
    label: 'Đang hành trình',
    cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls: 'bg-sky-50 text-sky-700 border border-sky-200/70',
  },
  CANCELLED: {
    label: 'Đã hủy',
    cls: 'bg-rose-50 text-rose-700 border border-rose-200/70',
  },
};

export function ItineraryPage() {
  const [tours, setTours] = useState<CruiseTour[]>([]);
  const [ships, setShips] = useState<ShipType[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [shipFilter, setShipFilter] = useState<string>('ALL');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<CruiseTour | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTour, setStatusTour] = useState<CruiseTour | null>(null);

  const [isStopsModalOpen, setIsStopsModalOpen] = useState(false);
  const [stopsTour, setStopsTour] = useState<CruiseTour | null>(null);

  const [selectedDailyTour, setSelectedDailyTour] = useState<CruiseTour | null>(null);

  const [isDeleting, setIsDeleting] = useState<CruiseTour | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const [tourList, shipList, portList] = await Promise.all([getTours(), getShips(), getPorts()]);
    setTours(tourList);
    setShips(shipList);
    setPorts(portList);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateOpen = () => {
    setEditingTour(null);
    setIsFormModalOpen(true);
  };

  const handleEditOpen = (tour: CruiseTour) => {
    setEditingTour(tour);
    setIsFormModalOpen(true);
  };

  const handleStatusModalOpen = (tour: CruiseTour) => {
    setStatusTour(tour);
    setIsStatusModalOpen(true);
  };

  const handleFormSubmit = async (formData: TourFormData) => {
    setIsSubmitting(true);
    try {
      const payload = formatTourPayload(formData);
      if (editingTour) {
        const updated = await updateTour(editingTour.id, payload);
        setTours((prev) => prev.map((t) => (t.id === editingTour.id ? updated : t)));
        showNotification(`Đã cập nhật tour ${formData.name} (${formData.code}) thành công!`);
      } else {
        const created = await createTour(payload);
        setTours((prev) => [created, ...prev]);
        showNotification(`Đã tạo mới tour ${formData.name} (${formData.code}) thành công!`);
      }
      setIsFormModalOpen(false);
    } catch {
      showNotification('Có lỗi xảy ra khi lưu thông tin tour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, targetStatus: TourStatus, reason?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await updateTourStatus(id, targetStatus, reason);
      setTours((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showNotification(`Đã chuyển trạng thái tour ${statusTour?.code || id} sang ${targetStatus}!`);
      setIsStatusModalOpen(false);
    } catch {
      showNotification('Không thể chuyển trạng thái tour.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isDeleting) return;
    try {
      await deleteTour(isDeleting.id);
      setTours((prev) => prev.filter((t) => t.id !== isDeleting.id));
      showNotification(`Đã xóa tour ${isDeleting.name} thành công!`);
      setIsDeleting(null);
    } catch {
      showNotification('Không thể xóa tour này.');
    }
  };

  const filteredTours = tours.filter((tour) => {
    const matchesSearch =
      tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.departurePort.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.destinationPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tour.shipName && tour.shipName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tour.status === statusFilter;
    const matchesShip = shipFilter === 'ALL' || (tour.shipId && tour.shipId.toString() === shipFilter);

    return matchesSearch && matchesStatus && matchesShip;
  });

  const totalActiveTours = tours.filter((t) => t.status !== 'CANCELLED').length;
  const inProgressTours = tours.filter((t) => t.status === 'IN_PROGRESS').length;
  const publishedTours = tours.filter((t) => t.status === 'PUBLISHED').length;

  if (selectedDailyTour) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <button
            onClick={() => setSelectedDailyTour(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#20242C] text-xs font-semibold rounded-[10px] shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay Lại Danh Sách Hải Trình
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20">
            Giao diện Lịch Trình Hàng Ngày (Daily Itinerary)
          </span>
        </div>
        <DailyItineraryTimeline tour={selectedDailyTour} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium px-4 py-3 rounded-[10px] shadow-sm text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header — Soft Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 tracking-wider">
              VOYAGE MANAGEMENT
            </span>
            <span className="text-[11px] font-medium text-[#687080]">• MULTI-DAY ITINERARY</span>
          </div>
          <h2 className="text-2xl font-bold text-[#20242C] flex items-center gap-2.5 tracking-tight">
            <Compass className="w-6 h-6 text-[#5277D9]" /> Quản Lý Tour Du Lịch Du Thuyền (Cruise Tour)
          </h2>
          <p className="text-xs text-[#687080] mt-1">
            Điều phối hải trình • Quản lý tour nhiều ngày, tàu phân bổ, sức chứa và trạng thái hoạt động
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5277D9] hover:bg-[#4364BE] text-white text-xs font-semibold rounded-[10px] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tạo Hải Trình Mới
        </button>
      </div>

      {/* Stats Cards — Soft Editorial Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#687080] uppercase tracking-wider">Tổng tour đang quản lý</span>
            <p className="text-2xl font-bold tabular-nums text-[#20242C] mt-1">{totalActiveTours}</p>
          </div>
          <div className="w-10 h-10 bg-[#EEF2FF] rounded-[10px] flex items-center justify-center text-[#5277D9]">
            <Compass className="w-5 h-5 text-[#5277D9]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#687080] uppercase tracking-wider">Tour đang hành trình</span>
            <p className="text-2xl font-bold tabular-nums text-[#5277D9] mt-1">{inProgressTours}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 rounded-[10px] flex items-center justify-center text-indigo-600">
            <Ship className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#687080] uppercase tracking-wider">Tour đang mở bán</span>
            <p className="text-2xl font-bold tabular-nums text-emerald-600 mt-1">{publishedTours}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-[10px] flex items-center justify-center text-emerald-600">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#687080] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tour, mã, cảng, tàu..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#687080]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
              className="px-3 py-1.5 text-xs font-semibold bg-[#F9FAFB] hover:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Mở bán</option>
              <option value="IN_PROGRESS">Đang hành trình</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          {/* Ship Filter */}
          <select
            value={shipFilter}
            onChange={(e) => setShipFilter(e.target.value)}
            aria-label="Lọc theo tàu"
            className="px-3 py-1.5 text-xs font-semibold bg-[#F9FAFB] hover:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9]"
          >
            <option value="ALL">Tất cả tàu</option>
            {ships.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tour Cards Grid */}
      {filteredTours.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5E7EB] rounded-[16px] p-12 text-center">
          <Compass className="w-12 h-12 text-[#687080]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#20242C]">Không tìm thấy tour du lịch nào</h3>
          <p className="text-xs text-[#687080] mt-1 max-w-md mx-auto">
            Không có tour nào phù hợp với bộ lọc tìm kiếm hiện tại. Hãy thử thay đổi từ khóa hoặc bộ lọc trạng thái.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map((tour) => {
            const badge = STATUS_BADGES[tour.status];
            return (
              <div
                key={tour.id}
                className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image header if available */}
                  {tour.imageUrl ? (
                    <div className="h-40 w-full overflow-hidden relative border-b border-[#E5E7EB]">
                      <img
                        src={tour.imageUrl}
                        alt={tour.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium bg-white/95 backdrop-blur-xs text-[#20242C] px-2.5 py-1 rounded-[6px] border border-[#E5E7EB] shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-[#5277D9]" />
                        <span>
                          {tour.durationDays}N{tour.durationNights}Đ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
                      <span className="text-xs font-mono font-semibold text-[#5277D9] tracking-wider">{tour.code}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[11px] text-[#5277D9] font-mono font-semibold">{tour.code}</span>
                      <h3 className="font-bold text-base text-[#20242C] line-clamp-2 mt-0.5 tracking-tight">{tour.name}</h3>
                    </div>

                    {/* Ship allocation */}
                    <div className="flex items-center gap-2 text-xs font-medium text-[#20242C] bg-[#F9FAFB] p-2.5 rounded-[8px] border border-[#E5E7EB]">
                      <Ship className="w-4 h-4 text-[#5277D9] shrink-0" />
                      <span className="truncate">
                        {tour.shipName ? `${tour.shipName} (${tour.shipCode})` : 'Chưa gán tàu du lịch'}
                      </span>
                    </div>

                    {/* Ports & Duration */}
                    <div className="space-y-1.5 text-xs text-[#687080]">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#5277D9] shrink-0" />
                        <span className="truncate">Xuất phát: {tour.departurePort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#687080] shrink-0" />
                        <span className="truncate">Đích đến: {tour.destinationPort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#687080] shrink-0" />
                        <span>
                          {tour.startDate} → {tour.endDate}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Sức chứa: {tour.maxCapacity.toLocaleString()} hành khách</span>
                      </p>
                    </div>

                    {/* Cancellation reason warning */}
                    {tour.status === 'CANCELLED' && tour.cancellationReason && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium rounded-[8px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>Lý do hủy: {tour.cancellationReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="p-4 pt-3 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-medium text-[#687080] block uppercase">Giá cơ bản</span>
                    <span className="text-xs font-bold tabular-nums text-[#20242C]">
                      {tour.basePrice.toLocaleString()} {tour.currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDailyTour(tour)}
                      className="p-1.5 bg-white hover:bg-[#EEF2FF] text-[#20242C] hover:text-[#5277D9] border border-[#E5E7EB] rounded-[8px] transition-colors shadow-xs"
                      title="Xem lịch trình hàng ngày"
                      aria-label="Xem lịch trình hàng ngày"
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setStopsTour(tour);
                        setIsStopsModalOpen(true);
                      }}
                      className="p-1.5 bg-white hover:bg-[#EEF2FF] text-[#20242C] hover:text-[#5277D9] border border-[#E5E7EB] rounded-[8px] transition-colors shadow-xs"
                      title="Quản lý điểm dừng hải trình"
                    >
                      <Anchor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusModalOpen(tour)}
                      className="p-1.5 bg-white hover:bg-[#EEF2FF] text-[#20242C] hover:text-[#5277D9] border border-[#E5E7EB] rounded-[8px] transition-colors shadow-xs"
                      title="Chuyển trạng thái tour"
                    >
                      <ArrowRightCircle className="w-4 h-4 text-[#5277D9]" />
                    </button>
                    <button
                      onClick={() => handleEditOpen(tour)}
                      className="p-1.5 bg-white hover:bg-[#EEF2FF] text-[#20242C] hover:text-[#5277D9] border border-[#E5E7EB] rounded-[8px] transition-colors shadow-xs"
                      title="Chỉnh sửa tour"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(tour)}
                      className="p-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-[#20242C] border border-[#E5E7EB] rounded-[8px] transition-colors shadow-xs"
                      title="Xóa tour"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tour Stops Modal */}
      <TourStopsModal
        isOpen={isStopsModalOpen}
        onClose={() => setIsStopsModalOpen(false)}
        tour={stopsTour}
        ports={ports}
      />

      {/* Tour Form Modal (Create / Edit) */}
      <TourFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        tour={editingTour}
        ships={ships}
        isSubmitting={isSubmitting}
      />

      {/* Status Transition Modal */}
      <StatusTransitionModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        tour={statusTour}
        onStatusChange={handleStatusChange}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-6 max-w-sm w-full text-[#20242C] shadow-xl">
            <h3 className="text-base font-bold text-[#20242C] mb-2">Xác Nhận Xóa Tour</h3>
            <p className="text-xs text-[#687080] mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa tour <span className="font-semibold text-[#20242C]">{isDeleting.name}</span> ({isDeleting.code}) không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-3.5 py-2 text-xs font-medium text-[#20242C] bg-white border border-[#E5E7EB] rounded-[8px] hover:bg-[#F9FAFB] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-[8px] shadow-xs transition-colors"
              >
                Xóa Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItineraryPage;
