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
  INITIAL_TOURS,
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
    cls: 'bg-[#F7F4ED] text-[#252B32]/70 border border-[#E5E0D7]',
  },
  PUBLISHED: {
    label: 'Mở bán',
    cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
  },
  IN_PROGRESS: {
    label: 'Đang hành trình',
    cls: 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls: 'bg-sky-50 text-sky-800 border border-sky-200/80',
  },
  CANCELLED: {
    label: 'Đã hủy',
    cls: 'bg-rose-50 text-rose-800 border border-rose-200/80',
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
    setTours(tourList && tourList.length > 0 ? tourList : INITIAL_TOURS);
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
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D7]">
          <button
            onClick={() => setSelectedDailyTour(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E5E0D7] hover:bg-[#F7F4ED] text-[#102A43] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#C5A572]" /> Quay Lại Danh Sách Hải Trình
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium px-4 py-3 rounded-xl shadow-sm text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header — Luxury Maritime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D7]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] tracking-wider">
              VOYAGE MANAGEMENT
            </span>
            <span className="text-[11px] font-medium text-[#5A6578]">• MULTI-DAY ITINERARY</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-[#102A43] flex items-center gap-2.5 tracking-tight">
            <Compass className="w-6 h-6 text-[#102A43]" /> Quản Lý Tour Du Lịch Du Thuyền (Cruise Tour)
          </h2>
          <p className="text-xs text-[#5A6578] mt-1">
            Điều phối hải trình • Quản lý tour nhiều ngày, tàu phân bổ, sức chứa và trạng thái hoạt động
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C5A572]" /> Tạo Hải Trình Mới
        </button>
      </div>

      {/* Stats Cards — Luxury Maritime Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider">Tổng tour đang quản lý</span>
            <p className="text-2xl font-bold tabular-nums text-[#102A43] mt-1">{totalActiveTours}</p>
          </div>
          <div className="w-10 h-10 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-center text-[#102A43]">
            <Compass className="w-5 h-5 text-[#102A43]" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider">Tour đang hành trình</span>
            <p className="text-2xl font-bold tabular-nums text-[#397C80] mt-1">{inProgressTours}</p>
          </div>
          <div className="w-10 h-10 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-center text-[#397C80]">
            <Ship className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider">Tour đang mở bán</span>
            <p className="text-2xl font-bold tabular-nums text-emerald-700 mt-1">{publishedTours}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-center text-emerald-700">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#5A6578] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tour, mã, cảng, tàu..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F4ED]/50 hover:bg-white focus:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#5A6578]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
              className="px-3 py-1.5 text-xs font-medium bg-[#F7F4ED]/50 hover:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
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
            className="px-3 py-1.5 text-xs font-medium bg-[#F7F4ED]/50 hover:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
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
        <div className="bg-white border border-dashed border-[#E5E0D7] rounded-2xl p-12 text-center">
          <Compass className="w-12 h-12 text-[#5A6578]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold font-serif text-[#102A43]">Không tìm thấy tour du lịch nào</h3>
          <p className="text-xs text-[#5A6578] mt-1 max-w-md mx-auto">
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
                className="bg-white border border-[#E5E0D7] rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Image header if available */}
                  {tour.imageUrl ? (
                    <div className="h-40 w-full overflow-hidden relative border-b border-[#E5E0D7]">
                      <img
                        src={tour.imageUrl}
                        alt={tour.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium bg-white/95 backdrop-blur-xs text-[#252B32] px-2.5 py-1 rounded-lg border border-[#E5E0D7] shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-[#397C80]" />
                        <span>
                          {tour.durationDays}N{tour.durationNights}Đ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
                      <span className="text-xs font-mono font-semibold text-[#397C80] tracking-wider">{tour.code}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[11px] text-[#397C80] font-mono font-semibold">{tour.code}</span>
                      <h3 className="font-bold font-serif text-base text-[#102A43] line-clamp-2 mt-0.5 tracking-tight">{tour.name}</h3>
                    </div>

                    {/* Ship allocation */}
                    <div className="flex items-center gap-2 text-xs font-medium text-[#252B32] bg-[#F7F4ED]/50 p-2.5 rounded-xl border border-[#E5E0D7]">
                      <Ship className="w-4 h-4 text-[#102A43] shrink-0" />
                      <span className="truncate">
                        {tour.shipName ? `${tour.shipName} (${tour.shipCode})` : 'Chưa gán tàu du lịch'}
                      </span>
                    </div>

                    {/* Ports & Duration */}
                    <div className="space-y-1.5 text-xs text-[#5A6578]">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#397C80] shrink-0" />
                        <span className="truncate">Xuất phát: {tour.departurePort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#5A6578] shrink-0" />
                        <span className="truncate">Đích đến: {tour.destinationPort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#5A6578] shrink-0" />
                        <span>
                          {tour.startDate} → {tour.endDate}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Sức chứa: {tour.maxCapacity.toLocaleString()} hành khách</span>
                      </p>
                    </div>

                    {/* Cancellation reason warning */}
                    {tour.status === 'CANCELLED' && tour.cancellationReason && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium rounded-xl flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>Lý do hủy: {tour.cancellationReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="p-4 pt-3 border-t border-[#E5E0D7] bg-[#F7F4ED]/50 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-medium text-[#5A6578] block uppercase">Giá cơ bản</span>
                    <span className="text-xs font-bold tabular-nums text-[#102A43]">
                      {tour.basePrice.toLocaleString()} {tour.currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDailyTour(tour)}
                      className="p-1.5 bg-white hover:bg-[#F7F4ED] text-[#252B32] hover:text-[#102A43] border border-[#E5E0D7] rounded-lg transition-colors shadow-xs cursor-pointer"
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
                      className="p-1.5 bg-white hover:bg-[#F7F4ED] text-[#252B32] hover:text-[#102A43] border border-[#E5E0D7] rounded-lg transition-colors shadow-xs cursor-pointer"
                      title="Quản lý điểm dừng hải trình"
                    >
                      <Anchor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusModalOpen(tour)}
                      className="p-1.5 bg-white hover:bg-[#F7F4ED] text-[#252B32] hover:text-[#102A43] border border-[#E5E0D7] rounded-lg transition-colors shadow-xs cursor-pointer"
                      title="Chuyển trạng thái tour"
                    >
                      <ArrowRightCircle className="w-4 h-4 text-[#397C80]" />
                    </button>
                    <button
                      onClick={() => handleEditOpen(tour)}
                      className="p-1.5 bg-white hover:bg-[#F7F4ED] text-[#252B32] hover:text-[#102A43] border border-[#E5E0D7] rounded-lg transition-colors shadow-xs cursor-pointer"
                      title="Chỉnh sửa tour"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(tour)}
                      className="p-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-[#252B32] border border-[#E5E0D7] rounded-lg transition-colors shadow-xs cursor-pointer"
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

      {/* Delete Confirmation Modal — Luxury Maritime */}
      {isDeleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-[#E5E0D7] p-6 max-w-sm w-full text-[#252B32] shadow-xl">
            <h3 className="text-base font-bold font-serif text-[#102A43] mb-2">Xác Nhận Xóa Tour</h3>
            <p className="text-xs text-[#5A6578] mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa tour <span className="font-semibold text-[#102A43]">{isDeleting.name}</span> ({isDeleting.code}) không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-4 py-2 text-xs font-medium text-[#102A43] bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl hover:bg-[#ECE7DC] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
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
