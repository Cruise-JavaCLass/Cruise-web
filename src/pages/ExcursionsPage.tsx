import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Clock,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Bus,
  Edit2,
  Trash2,
  ArrowRight,
  LayoutGrid,
  List,
  Ticket,
} from 'lucide-react';
import {
  type ShoreExcursion,
  type ExcursionStatus,
  fetchExcursions,
  deleteExcursion,
  EXCURSION_STATUS_MAP,
  EXCURSION_CATEGORY_LABELS,
  EXCURSION_DIFFICULTY_LABELS,
} from '../services/excursionService';
import { INITIAL_TOURS } from '../services/tourService';
import { INITIAL_PORTS } from '../services/portStopService';
import { ExcursionModal } from '../components/excursions/ExcursionModal';
import { ExcursionStatusModal } from '../components/excursions/ExcursionStatusModal';
import { ExcursionManifestModal } from '../components/excursions/ExcursionManifestModal';
import { PassengerBookingModal } from '../components/excursions/PassengerBookingModal';
import { ExcursionStatusCards } from '../components/excursions/ExcursionStatusCards';

export function ExcursionsPage() {
  const [selectedTourId, setSelectedTourId] = useState<number | 'ALL'>('ALL');
  const [selectedPortId, setSelectedPortId] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [excursions, setExcursions] = useState<ShoreExcursion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [excursionToEdit, setExcursionToEdit] = useState<ShoreExcursion | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [excursionToChangeStatus, setExcursionToChangeStatus] = useState<ShoreExcursion | null>(null);

  const [isManifestModalOpen, setIsManifestModalOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [excursionForBooking, setExcursionForBooking] = useState<ShoreExcursion | null>(null);

  const [excursionForManifest, setExcursionForManifest] = useState<ShoreExcursion | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadExcursionList = useCallback(async () => {
    setLoading(true);
    const filterParams = {
      tourId: selectedTourId === 'ALL' ? undefined : Number(selectedTourId),
      portId: selectedPortId === 'ALL' ? undefined : Number(selectedPortId),
      status: selectedStatus === 'ALL' ? undefined : (selectedStatus as ExcursionStatus),
      category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      keyword: searchTerm,
    };

    fetchExcursions(filterParams)
      .then((data) => {
        setExcursions(data);
      })
      .catch(() => {
        showToast('Không thể tải danh sách tour trên bờ.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedTourId, selectedPortId, selectedStatus, selectedCategory, searchTerm]);

  useEffect(() => {
    void loadExcursionList();
  }, [loadExcursionList]);

  const handleOpenCreateModal = () => {
    setExcursionToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (exc: ShoreExcursion) => {
    setExcursionToEdit(exc);
    setIsFormModalOpen(true);
  };

  const handleOpenStatusModal = (exc: ShoreExcursion) => {
    setExcursionToChangeStatus(exc);
    setIsStatusModalOpen(true);
  };

  const handleOpenBookingModal = (exc: ShoreExcursion) => {
    setExcursionForBooking(exc);
    setIsBookingModalOpen(true);
  };
  const handleOpenManifestModal = (exc: ShoreExcursion) => {
    setExcursionForManifest(exc);
    setIsManifestModalOpen(true);
  };

  const handleDeleteExcursion = async (id: number, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tour trên bờ "${title}"?`)) {
      return;
    }
    try {
      await deleteExcursion(id);
      showToast(`Đã xóa tour trên bờ "${title}" thành công!`);
      void loadExcursionList();
    } catch {
      showToast('Có lỗi xảy ra khi xóa tour.');
    }
  };

  // KPIs
  const totalCount = excursions.length;
  const inProgressCount = excursions.filter((e) => e.status === 'IN_PROGRESS').length;
  const delayedCount = excursions.filter((e) => e.status === 'DELAYED').length;
  const totalBooked = excursions.reduce((sum, e) => sum + (e.bookedCount || 0), 0);
  const totalCapacity = excursions.reduce((sum, e) => sum + (e.maxCapacity || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-white border border-[#E5E7EB] text-[#20242C] px-4 py-3 rounded-[12px] shadow-md flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header — Soft Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 tracking-wider">
              SHORE EXCURSIONS
            </span>
            <span className="text-[11px] font-medium text-[#687080]">• PORT DISPATCH</span>
          </div>
          <h2 className="text-2xl font-bold text-[#20242C] flex items-center gap-2.5 tracking-tight">
            <Compass className="w-6 h-6 text-[#5277D9]" /> Quản Lý Tour Trên Bờ (Shore Excursion)
          </h2>
          <p className="text-xs text-[#687080] mt-1">
            Điều phối điểm dừng • Giám sát giờ All-Aboard • Phân bổ xe và hướng dẫn viên địa phương
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 text-xs font-semibold rounded-[8px] transition-colors ${
                viewMode === 'grid' ? 'bg-white text-[#5277D9] shadow-xs' : 'text-[#687080] hover:text-[#20242C]'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 text-xs font-semibold rounded-[8px] transition-colors ${
                viewMode === 'table' ? 'bg-white text-[#5277D9] shadow-xs' : 'text-[#687080] hover:text-[#20242C]'
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => void loadExcursionList()}
            className="p-2 bg-white hover:bg-[#F9FAFB] text-[#20242C] border border-[#E5E7EB] rounded-[10px] shadow-xs transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5277D9] hover:bg-[#4364BE] text-white text-xs font-semibold rounded-[10px] shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo Excursion Mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ExcursionStatusCards
        totalCount={totalCount}
        inProgressCount={inProgressCount}
        delayedCount={delayedCount}
        occupancyRate={occupancyRate}
        totalBooked={totalBooked}
        totalCapacity={totalCapacity}
      />

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Select Tour */}
          <div>
            <label htmlFor="filter-excursion-tour" className="block text-[11px] font-semibold text-[#687080] uppercase tracking-wider mb-1">
              Tour Du Thuyền
            </label>
            <select
              id="filter-excursion-tour"
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9]"
            >
              <option value="ALL">Tất cả hải trình</option>
              {INITIAL_TOURS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Port */}
          <div>
            <label htmlFor="filter-excursion-port" className="block text-[11px] font-semibold text-[#687080] uppercase tracking-wider mb-1">
              Cảng Dừng (Port of Call)
            </label>
            <select
              id="filter-excursion-port"
              value={selectedPortId}
              onChange={(e) => setSelectedPortId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9]"
            >
              <option value="ALL">Tất cả cảng đến</option>
              {INITIAL_PORTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          {/* Select Status */}
          <div>
            <label htmlFor="filter-excursion-status" className="block text-[11px] font-semibold text-[#687080] uppercase tracking-wider mb-1">
              Trạng Thái
            </label>
            <select
              id="filter-excursion-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SCHEDULED">Lên lịch (SCHEDULED)</option>
              <option value="IN_PROGRESS">Đang khởi hành (IN_PROGRESS)</option>
              <option value="DELAYED">Bị trễ giờ (DELAYED)</option>
              <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>

          {/* Search Keyword */}
          <div className="lg:col-span-2">
            <label htmlFor="filter-excursion-keyword" className="block text-[11px] font-semibold text-[#687080] uppercase tracking-wider mb-1">
              Tìm Kiếm Tên, Mã Tour, Đối Tác
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#687080] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="filter-excursion-keyword"
                type="text"
                placeholder="Nhập tên excursion, địa danh, xe đưa đón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] placeholder-[#687080]/60 focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-[#687080] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#5277D9]" /> Thể loại:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 text-xs font-medium rounded-[8px] shrink-0 transition-colors cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#5277D9] text-white shadow-xs'
                : 'bg-white text-[#687080] border border-[#E5E7EB] hover:bg-[#F9FAFB]'
            }`}
          >
            Tất cả
          </button>
          {Object.entries(EXCURSION_CATEGORY_LABELS).map(([catKey, catLabel]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1 text-xs font-medium rounded-[8px] shrink-0 transition-colors cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-[#5277D9] text-white shadow-xs'
                  : 'bg-white text-[#687080] border border-[#E5E7EB] hover:bg-[#F9FAFB]'
              }`}
            >
              {catLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {excursions.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5E7EB] rounded-[16px] p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-[#EEF2FF] rounded-[10px] mx-auto flex items-center justify-center text-[#5277D9]">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#20242C]">Không tìm thấy tour trên bờ nào</h3>
          <p className="text-xs text-[#687080] max-w-sm mx-auto">
            Không có excursion nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc tạo tour mới.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#5277D9] hover:bg-[#4364BE] text-white text-xs font-semibold rounded-[10px] shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo Excursion Đầu Tiên
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {excursions.map((exc) => {
            const statusConfig = EXCURSION_STATUS_MAP[exc.status];
            const diffConfig = EXCURSION_DIFFICULTY_LABELS[exc.difficulty];
            const percentFilled = Math.min(100, Math.round((exc.bookedCount / exc.maxCapacity) * 100));

            return (
              <div
                key={exc.id}
                className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xs hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Card Header & Cover */}
                  <div className="relative h-44 w-full bg-[#F6F7F9] overflow-hidden border-b border-[#E5E7EB]">
                    {exc.imageUrl ? (
                      <img
                        src={exc.imageUrl}
                        alt={exc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#F6F7F9] text-[#687080]/30">
                        <Compass className="w-12 h-12" />
                      </div>
                    )}

                    {/* Status & Category Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-white/95 backdrop-blur-xs text-[#20242C] border border-[#E5E7EB] shadow-xs">
                        {statusConfig.label}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 shadow-xs">
                        {EXCURSION_CATEGORY_LABELS[exc.category]}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-white/95 backdrop-blur-xs text-[#20242C] border border-[#E5E7EB] shadow-xs">
                        {diffConfig.label}
                      </span>
                    </div>

                    {/* Port & Code banner */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-xs text-[#20242C] px-2.5 py-1 rounded-[6px] border border-[#E5E7EB] shadow-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#5277D9]" /> {exc.portCity} ({exc.portName})
                      </span>
                      <span className="bg-[#20242C] text-white px-2 py-1 rounded-[6px] font-mono text-[11px] shadow-xs">
                        {exc.code}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <Link
                        to={`/excursions/${exc.id}`}
                        className="font-bold text-lg text-[#20242C] group-hover:text-[#5277D9] transition-colors line-clamp-1 tracking-tight"
                      >
                        {exc.title}
                      </Link>
                      <p className="text-xs text-[#687080] line-clamp-2 mt-1 leading-relaxed">
                        {exc.description || 'Chưa có thông tin mô tả chi tiết cho tour trên bờ này.'}
                      </p>
                    </div>

                    {/* Operational Time Strip */}
                    <div className="bg-[#F9FAFB] p-3 rounded-[10px] border border-[#E5E7EB] space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-[#20242C]">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#5277D9]" /> Ngày: <strong className="font-semibold">{exc.excursionDate}</strong>
                        </span>
                        <span className="text-rose-600 font-semibold flex items-center gap-1 uppercase">
                          All-Aboard: {exc.allAboardTime}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center text-[10px] pt-1.5 border-t border-[#E5E7EB]">
                        <div>
                          <span className="text-[#687080] block font-medium">Tập trung</span>
                          <strong className="text-[#20242C]">{exc.meetingTime}</strong>
                        </div>
                        <div>
                          <span className="text-[#687080] block font-medium">Khởi hành</span>
                          <strong className="text-[#20242C]">{exc.departureTime}</strong>
                        </div>
                        <div>
                          <span className="text-amber-600 block font-medium">Về tàu</span>
                          <strong className="text-amber-700">{exc.returnToShipTime}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Warning if delayed */}
                    {exc.status === 'DELAYED' && exc.delayReason && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-[8px] flex items-start gap-2 text-[11px] font-medium text-amber-900 shadow-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <strong>Cảnh báo trễ giờ:</strong> {exc.delayReason}
                        </div>
                      </div>
                    )}

                    {/* Operator & Guide */}
                    <div className="flex items-center justify-between text-xs font-mono text-[#171717]/80 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-[#3155E7] shrink-0" />
                        <span className="truncate font-bold">{exc.operatorName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[#171717] font-bold">
                        <Bus className="w-3.5 h-3.5 text-[#3155E7]" />
                        <span>{exc.busNumber || 'Xe riêng'}</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1.5 font-mono">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#171717]/70 flex items-center gap-1 font-bold">
                          <Users className="w-3.5 h-3.5 text-[#3155E7]" /> Đã đặt:
                        </span>
                        <span className="font-black text-[#171717]">
                          {exc.bookedCount} / {exc.maxCapacity} khách ({percentFilled}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#E7E4DC] border-2 border-[#171717] h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            percentFilled >= 90
                              ? 'bg-[#DC2626]'
                              : percentFilled >= 70
                              ? 'bg-[#3155E7]'
                              : 'bg-[#10B981]'
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>

                    {/* Price and Package Badge */}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-[#171717]">
                      <div>
                        {exc.isIncluded ? (
                          <span className="neo-badge bg-[#10B981] text-[#171717]">
                            Đã bao gồm trong giá vé
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-[11px] text-[#171717]/70 font-bold">Giá vé:</span>
                            <span className="text-base font-display font-black text-[#171717]">
                              {exc.price.toLocaleString('vi-VN')} {exc.currency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenBookingModal(exc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#5277D9] hover:bg-[#4364BE] text-white rounded-[6px] shadow-xs transition-colors"
                      title="Đặt vé tour trên bờ"
                    >
                      <Ticket className="w-3.5 h-3.5" /> Đặt Tour
                    </button>
                    <button
                      onClick={() => handleOpenManifestModal(exc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#EEF2FF] text-[#5277D9] hover:bg-[#E0E7FF] rounded-[6px] border border-[#5277D9]/20 transition-colors"
                      title="Xem danh sách đoàn & xe đưa đón"
                    >
                      <Users className="w-3.5 h-3.5 text-[#3155E7]" /> Đoàn & Xe
                    </button>
                    <button
                      onClick={() => handleOpenStatusModal(exc)}
                      className="px-2 py-1 text-xs font-medium bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#20242C] rounded-[6px] transition-colors"
                      title="Đổi trạng thái"
                    >
                      Trạng thái
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(exc)}
                      className="p-1.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#D9FF43] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                      title="Chỉnh sửa tour"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#171717]" />
                    </button>
                    <button
                      onClick={() => handleDeleteExcursion(exc.id, exc.title)}
                      className="p-1.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#DC2626] hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                      title="Xóa tour"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/excursions/${exc.id}`}
                      className="p-1.5 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#2040c0] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                      title="Xem chi tiết"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#20242C]">
              <thead className="bg-[#F9FAFB] text-[#687080] uppercase tracking-wider text-[10px] font-semibold border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3 px-4">Tour Trên Bờ</th>
                  <th className="py-3 px-4">Điểm Dừng / Cảng</th>
                  <th className="py-3 px-4">Thời Gian & All-Aboard</th>
                  <th className="py-3 px-4">Đối Tác & Xe</th>
                  <th className="py-3 px-4">Sức Chứa</th>
                  <th className="py-3 px-4">Chi Phí</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {excursions.map((exc) => {
                  const statusConfig = EXCURSION_STATUS_MAP[exc.status];
                  return (
                    <tr key={exc.id} className="hover:bg-[#D9FF43]/10 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/excursions/${exc.id}`}
                          className="font-display font-black text-sm text-[#171717] hover:text-[#3155E7] transition-colors block uppercase"
                        >
                          {exc.title}
                        </Link>
                        <span className="font-mono text-[10px] font-bold text-[#3155E7] block">{exc.code}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#171717] block">{exc.portCity}</span>
                        <span className="text-[10px] text-[#171717]/60">{exc.portName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px]">
                          <span className="text-[#171717]/70 block">Ngày: {exc.excursionDate}</span>
                          <span className="text-[#3155E7] font-bold">
                            {exc.departureTime} → {exc.returnToShipTime}
                          </span>
                          <span className="text-[10px] text-[#DC2626] block font-black uppercase">
                            All-Aboard: {exc.allAboardTime}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#171717] block">{exc.operatorName}</span>
                        <span className="text-[10px] text-[#171717]/60 flex items-center gap-1 mt-0.5">
                          <Bus className="w-3 h-3 text-[#3155E7]" /> {exc.busNumber || 'Xe du lịch'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-[#171717]">
                          {exc.bookedCount} / {exc.maxCapacity}
                        </span>
                        <span className="text-[10px] text-[#171717]/60 block">
                          ({Math.round((exc.bookedCount / exc.maxCapacity) * 100)}%)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {exc.isIncluded ? (
                          <span className="neo-badge bg-[#10B981] text-[#171717]">Bao gồm</span>
                        ) : (
                          <span className="text-[#171717] font-black">
                            {exc.price.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="neo-badge bg-white text-[#171717]">
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenBookingModal(exc)}
                            className="p-1.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#D9FF43] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Đặt vé tour"
                          >
                            <Ticket className="w-3.5 h-3.5 text-[#3155E7]" />
                          </button>
                          <button
                            onClick={() => handleOpenManifestModal(exc)}
                            className="p-1.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#D9FF43] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Xem đoàn & xe"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(exc)}
                            className="p-1.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#D9FF43] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Đổi trạng thái"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(exc)}
                            className="p-1.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#D9FF43] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Chỉnh sửa tour"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExcursion(exc.id, exc.title)}
                            className="p-1.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#DC2626] hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Xóa tour"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/excursions/${exc.id}`}
                            className="p-1.5 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] hover:bg-[#2040c0] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                            title="Xem chi tiết"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isFormModalOpen && (
        <ExcursionModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            showToast(excursionToEdit ? 'Đã cập nhật tour thành công!' : 'Đã tạo tour mới thành công!');
            void loadExcursionList();
          }}
          excursionToEdit={excursionToEdit}
          defaultTourId={selectedTourId === 'ALL' ? 1 : selectedTourId}
        />
      )}

      {/* Status Modal */}
      {isStatusModalOpen && excursionToChangeStatus && (
        <ExcursionStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={() => {
            showToast('Đã cập nhật trạng thái tour thành công!');
            void loadExcursionList();
          }}
          excursion={excursionToChangeStatus}
        />
      )}

      {/* Manifest Modal */}
      {isManifestModalOpen && excursionForManifest && (
        <ExcursionManifestModal
          isOpen={isManifestModalOpen}
          onClose={() => setIsManifestModalOpen(false)}
          excursion={excursionForManifest}
          onUpdatePassengers={(updatedPassengers) => {
            const updated = {
              ...excursionForManifest,
              passengers: updatedPassengers,
              bookedCount: updatedPassengers.length,
            };
            setExcursionForManifest(updated);
            setExcursions((prev) =>
              prev.map((e) => (e.id === updated.id ? updated : e))
            );
          }}
        />
      )}

      {/* Passenger Booking Modal */}
      {isBookingModalOpen && excursionForBooking && (
        <PassengerBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setExcursionForBooking(null);
          }}
          excursion={excursionForBooking}
          onBookingSuccess={() => {
            showToast('Đặt tour thành công!');
            void loadExcursionList();
          }}
        />
      )}
    </div>
  );
}

export default ExcursionsPage;
