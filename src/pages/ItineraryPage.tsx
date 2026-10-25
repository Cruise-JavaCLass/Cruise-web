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
    cls: 'bg-[#E7E4DC] text-[#171717]',
  },
  PUBLISHED: {
    label: 'Mở bán',
    cls: 'bg-[#10B981] text-[#171717]',
  },
  IN_PROGRESS: {
    label: 'Đang hành trình',
    cls: 'bg-[#3155E7] text-white',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls: 'bg-[#D9FF43] text-[#171717]',
  },
  CANCELLED: {
    label: 'Đã hủy',
    cls: 'bg-[#DC2626] text-white',
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
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#171717]">
          <button
            onClick={() => setSelectedDailyTour(null)}
            className="neo-btn neo-btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Quay Lại Danh Sách Hải Trình
          </button>
          <span className="neo-badge bg-[#D9FF43] text-[#171717]">
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#10B981]/20 border-2 border-[#171717] text-[#171717] font-mono font-bold px-4 py-3 shadow-[4px_4px_0px_#171717] text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header — Editorial Broadside */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#171717]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#3155E7] text-white">VOYAGE MANAGEMENT</span>
            <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• MULTI-DAY ITINERARY</span>
          </div>
          <h2 className="text-2xl font-display font-black text-[#171717] flex items-center gap-2 uppercase tracking-tight">
            <Compass className="w-6 h-6 text-[#3155E7]" /> Quản Lý Tour Du Lịch Du Thuyền (Cruise Tour)
          </h2>
          <p className="text-xs font-mono text-[#171717]/70 mt-1">
            Điều phối hải trình • Quản lý tour nhiều ngày, tàu phân bổ, sức chứa và trạng thái hoạt động
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="neo-btn neo-btn-acid flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tạo Hải Trình Mới
        </button>
      </div>

      {/* Stats Cards — Neo-Brutalist Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="neo-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#171717]/70 font-mono font-bold uppercase tracking-wider">Tổng tour đang quản lý</span>
            <p className="text-3xl font-display font-black text-[#171717] mt-1">{totalActiveTours}</p>
          </div>
          <div className="w-10 h-10 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
            <Compass className="w-5 h-5 text-[#3155E7]" />
          </div>
        </div>
        <div className="neo-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#171717]/70 font-mono font-bold uppercase tracking-wider">Tour đang hành trình</span>
            <p className="text-3xl font-display font-black text-[#3155E7] mt-1">{inProgressTours}</p>
          </div>
          <div className="w-10 h-10 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
            <Ship className="w-5 h-5" />
          </div>
        </div>
        <div className="neo-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#171717]/70 font-mono font-bold uppercase tracking-wider">Tour đang mở bán</span>
            <p className="text-3xl font-display font-black text-[#059669] mt-1">{publishedTours}</p>
          </div>
          <div className="w-10 h-10 bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neo-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#171717]/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tour, mã, cảng, tàu..."
            className="neo-input w-full pl-9 pr-4 py-2 text-xs font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#171717]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
              className="neo-input px-3 py-1.5 text-xs font-mono font-bold uppercase"
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
            className="neo-input px-3 py-1.5 text-xs font-mono font-bold uppercase"
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
        <div className="neo-card p-12 text-center border-2 border-dashed border-[#171717]">
          <Compass className="w-12 h-12 text-[#171717]/40 mx-auto mb-3" />
          <h3 className="text-base font-display font-black text-[#171717] uppercase">Không tìm thấy tour du lịch nào</h3>
          <p className="text-xs font-mono text-[#171717]/70 mt-1 max-w-md mx-auto">
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
                className="neo-card-interactive flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Image header if available */}
                  {tour.imageUrl ? (
                    <div className="h-40 w-full overflow-hidden relative border-b-2 border-[#171717]">
                      <img
                        src={tour.imageUrl}
                        alt={tour.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`neo-badge ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-mono font-bold bg-white text-[#171717] px-2.5 py-1 border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                        <Clock className="w-3.5 h-3.5 text-[#3155E7]" />
                        <span>
                          {tour.durationDays}N{tour.durationNights}Đ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-b-2 border-[#171717] flex items-center justify-between bg-[#E7E4DC]">
                      <span className="text-xs font-mono font-black text-[#3155E7] uppercase tracking-wider">{tour.code}</span>
                      <span className={`neo-badge ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] text-[#3155E7] font-mono font-black uppercase">{tour.code}</span>
                      <h3 className="font-display font-black text-base text-[#171717] line-clamp-2 mt-0.5 uppercase tracking-tight">{tour.name}</h3>
                    </div>

                    {/* Ship allocation */}
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#171717] bg-[#E7E4DC] p-2.5 border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717]">
                      <Ship className="w-4 h-4 text-[#3155E7] shrink-0" />
                      <span className="truncate">
                        {tour.shipName ? `${tour.shipName} (${tour.shipCode})` : 'Chưa gán tàu du lịch'}
                      </span>
                    </div>

                    {/* Ports & Duration */}
                    <div className="space-y-1.5 text-xs font-mono text-[#171717]/80">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#3155E7] shrink-0" />
                        <span className="truncate">Xuất phát: {tour.departurePort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#171717] shrink-0" />
                        <span className="truncate">Đích đến: {tour.destinationPort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#171717] shrink-0" />
                        <span>
                          {tour.startDate} → {tour.endDate}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                        <span>Sức chứa: {tour.maxCapacity.toLocaleString()} hành khách</span>
                      </p>
                    </div>

                    {/* Cancellation reason warning */}
                    {tour.status === 'CANCELLED' && tour.cancellationReason && (
                      <div className="p-2.5 bg-[#DC2626]/20 border-2 border-[#171717] text-[#171717] text-[11px] font-mono font-bold flex items-start gap-1.5 shadow-[2px_2px_0px_#171717]">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                        <span>Lý do hủy: {tour.cancellationReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="p-4 pt-3 border-t-2 border-[#171717] bg-[#E7E4DC] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#171717]/60 block uppercase">Giá cơ bản</span>
                    <span className="text-xs font-display font-black text-[#171717]">
                      {tour.basePrice.toLocaleString()} {tour.currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDailyTour(tour)}
                      className="p-1.5 bg-white hover:bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
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
                      className="p-1.5 bg-white hover:bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                      title="Quản lý điểm dừng hải trình"
                    >
                      <Anchor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusModalOpen(tour)}
                      className="p-1.5 bg-white hover:bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                      title="Chuyển trạng thái tour"
                    >
                      <ArrowRightCircle className="w-4 h-4 text-[#3155E7]" />
                    </button>
                    <button
                      onClick={() => handleEditOpen(tour)}
                      className="p-1.5 bg-white hover:bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                      title="Chỉnh sửa tour"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(tour)}
                      className="p-1.5 bg-white hover:bg-[#DC2626] hover:text-white text-[#171717] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="neo-card bg-white p-6 max-w-sm w-full text-[#171717] shadow-[6px_6px_0px_#171717]">
            <h3 className="text-base font-display font-black text-[#171717] uppercase mb-2">Xác Nhận Xóa Tour</h3>
            <p className="text-xs font-mono text-[#171717]/80 mb-5">
              Bạn có chắc chắn muốn xóa tour <span className="font-bold text-[#171717]">{isDeleting.name}</span> ({isDeleting.code}) không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleting(null)}
                className="neo-btn neo-btn-secondary text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="neo-btn bg-[#DC2626] text-white hover:bg-[#b91c1c] text-xs shadow-[3px_3px_0px_#171717]"
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
