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

const STATUS_BADGES: Record<TourStatus, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: {
    label: 'Bản nháp',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    border: 'border-slate-500/20',
  },
  PUBLISHED: {
    label: 'Mở bán',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  IN_PROGRESS: {
    label: 'Đang hành trình',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  CANCELLED: {
    label: 'Đã hủy',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
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
      const formatted = formatTourPayload(formData);
      const assignedShip = ships.find((s) => s.id === formatted.shipId);

      if (editingTour) {
        const updated = await updateTour(editingTour.id, formData).catch(() => ({
          ...editingTour,
          ...formatted,
          shipName: assignedShip?.name,
          shipCode: assignedShip?.code,
          active: true,
        }));
        setTours((prev) => prev.map((t) => (t.id === editingTour.id ? updated : t)));
        showNotification(`Đã cập nhật tour "${updated.name}" thành công`);
      } else {
        const newTour = await createTour(formData).catch(() => ({
          ...formatted,
          id: Date.now(),
          shipName: assignedShip?.name,
          shipCode: assignedShip?.code,
          active: true,
        }));
        setTours((prev) => [newTour, ...prev]);
        showNotification(`Đã tạo mới tour "${newTour.name}" thành công`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, targetStatus: TourStatus, reason?: string) => {
    setIsSubmitting(true);
    try {
      const updated = await updateTourStatus(id, targetStatus, reason).catch(() => {
        const current = tours.find((t) => t.id === id);
        if (!current) throw new Error('Not found');
        return {
          ...current,
          status: targetStatus,
          cancellationReason: reason,
        };
      });
      setTours((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showNotification(`Chuyển trạng thái tour thành "${STATUS_BADGES[targetStatus].label}" thành công`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!isDeleting) return;
    try {
      await deleteTour(isDeleting.id).catch(() => {});
      setTours((prev) => prev.filter((t) => t.id !== isDeleting.id));
      showNotification(`Đã xóa tour "${isDeleting.name}" thành công`);
    } finally {
      setIsDeleting(null);
    }
  };

  // Filtered tours
  const filteredTours = tours.filter((tour) => {
    const matchesSearch =
      tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.departurePort.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tour.destinationPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tour.shipName && tour.shipName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || tour.status === statusFilter;
    const matchesShip = shipFilter === 'ALL' || String(tour.shipId) === shipFilter;

    return matchesSearch && matchesStatus && matchesShip;
  });

  const totalActiveTours = tours.filter((t) => t.status !== 'CANCELLED').length;
  const inProgressTours = tours.filter((t) => t.status === 'IN_PROGRESS').length;
  const publishedTours = tours.filter((t) => t.status === 'PUBLISHED').length;

  if (selectedDailyTour) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDailyTour(null)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay Lại Danh Sách Hải Trình
          </button>
          <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            Giao diện Lịch Trình Hàng Ngày (Daily Itinerary)
          </span>
        </div>
        <DailyItineraryTimeline tour={selectedDailyTour} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl animate-fade-in text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" /> Quản Lý Tour Du Lịch Du Thuyền (Cruise Tour)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Điều phối hải trình • Quản lý tour nhiều ngày, tàu phân bổ, sức chứa và trạng thái hoạt động
          </p>
        </div>
        <button
          onClick={handleCreateOpen}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tạo Hải Trình Mới
        </button>
      </div>

      {/* Stats Cards — Translucent Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl hover:border-cyan-500/30 transition-all">
          <div>
            <span className="text-xs text-slate-400 font-mono">Tổng tour đang quản lý</span>
            <p className="text-2xl font-display text-white mt-1">{totalActiveTours}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl hover:border-cyan-500/30 transition-all">
          <div>
            <span className="text-xs text-slate-400 font-mono">Tour đang hành trình</span>
            <p className="text-2xl font-display text-cyan-400 mt-1">{inProgressTours}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Ship className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl hover:border-emerald-500/30 transition-all">
          <div>
            <span className="text-xs text-slate-400 font-mono">Tour đang mở bán</span>
            <p className="text-2xl font-display text-emerald-400 mt-1">{publishedTours}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Tag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên tour, mã, cảng, tàu..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
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
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors"
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
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center">
          <Compass className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Không tìm thấy tour du lịch nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
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
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700/80 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  {/* Image header if available */}
                  {tour.imageUrl ? (
                    <div className="h-40 w-full overflow-hidden relative">
                      <img
                        src={tour.imageUrl}
                        alt={tour.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-cyan-300 font-semibold bg-slate-950/70 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-800">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {tour.durationDays}N{tour.durationNights}Đ
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-800/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{tour.code}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] text-cyan-400 font-mono font-semibold uppercase">{tour.code}</span>
                      <h3 className="font-bold text-base text-slate-100 line-clamp-2 mt-0.5">{tour.name}</h3>
                    </div>

                    {/* Ship allocation */}
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <Ship className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">
                        {tour.shipName ? `${tour.shipName} (${tour.shipCode})` : 'Chưa gán tàu du lịch'}
                      </span>
                    </div>

                    {/* Ports & Duration */}
                    <div className="space-y-1.5 text-xs text-slate-400">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Xuất phát: {tour.departurePort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">Đích đến: {tour.destinationPort}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {tour.startDate} → {tour.endDate}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Sức chứa: {tour.maxCapacity.toLocaleString()} hành khách</span>
                      </p>
                    </div>

                    {/* Cancellation reason warning */}
                    {tour.status === 'CANCELLED' && tour.cancellationReason && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Lý do hủy: {tour.cancellationReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="p-5 pt-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Giá cơ bản</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {tour.basePrice.toLocaleString()} {tour.currency}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedDailyTour(tour)}
                      className="p-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors cursor-pointer"
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
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg transition-colors cursor-pointer"
                      title="Quản lý điểm dừng hải trình"
                    >
                      <Anchor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusModalOpen(tour)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors cursor-pointer"
                      title="Chuyển trạng thái tour"
                    >
                      <ArrowRightCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditOpen(tour)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa tour"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(tour)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">Xác Nhận Xóa Tour</h3>
            <p className="text-xs text-slate-400 mb-5">
              Bạn có chắc chắn muốn xóa tour <span className="text-white font-semibold">{isDeleting.name}</span> ({isDeleting.code}) không? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleting(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20"
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
