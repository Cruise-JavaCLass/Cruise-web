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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#030303]/80 backdrop-blur-xl border border-cyan-500/40 text-cyan-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-cyan-400" /> Quản Lý Tour Trên Bờ (Shore Excursion)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Điều phối điểm dừng • Giám sát giờ All-Aboard • Phân bổ xe và hướng dẫn viên địa phương
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#030303]/60 backdrop-blur-xl p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Xem dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => void loadExcursionList()}
            className="p-2 bg-[#030303]/60 hover:bg-white/[0.06] backdrop-blur-xl text-slate-300 border border-white/10 rounded-xl text-xs font-medium transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Tạo Excursion Mới
          </button>
        </div>
      </div>

      {/* KPI Cards — Translucent Frosted Glass */}
      <ExcursionStatusCards
        totalCount={totalCount}
        inProgressCount={inProgressCount}
        delayedCount={delayedCount}
        occupancyRate={occupancyRate}
        totalBooked={totalBooked}
        totalCapacity={totalCapacity}
      />

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Select Tour */}
          <div>
            <label htmlFor="filter-excursion-tour" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tour Du Thuyền
            </label>
            <select
              id="filter-excursion-tour"
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
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
            <label htmlFor="filter-excursion-port" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Cảng Dừng (Port of Call)
            </label>
            <select
              id="filter-excursion-port"
              value={selectedPortId}
              onChange={(e) => setSelectedPortId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
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
            <label htmlFor="filter-excursion-status" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Trạng Thái
            </label>
            <select
              id="filter-excursion-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
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
            <label htmlFor="filter-excursion-keyword" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tìm Kiếm Tên, Mã Tour, Đối Tác
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="filter-excursion-keyword"
                type="text"
                placeholder="Nhập tên excursion, địa danh, xe đưa đón..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="pt-2 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" /> Thể loại:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          {Object.entries(EXCURSION_CATEGORY_LABELS).map(([catKey, catLabel]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === catKey
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {catLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {excursions.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">Không tìm thấy tour trên bờ nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Không có excursion nào khớp với tiêu chí tìm kiếm của bạn. Hãy thử thay đổi bộ lọc hoặc tạo tour mới.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors mt-2"
          >
            <Plus className="w-4 h-4" /> Tạo Excursion Đầu Tiên
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {excursions.map((exc) => {
            const statusConfig = EXCURSION_STATUS_MAP[exc.status];
            const diffConfig = EXCURSION_DIFFICULTY_LABELS[exc.difficulty];
            const percentFilled = Math.min(100, Math.round((exc.bookedCount / exc.maxCapacity) * 100));

            return (
              <div
                key={exc.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header & Cover */}
                  <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                    {exc.imageUrl ? (
                      <img
                        src={exc.imageUrl}
                        alt={exc.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-cyan-950/60 text-slate-600">
                        <Compass className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40" />

                    {/* Status & Category Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/80 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                        {EXCURSION_CATEGORY_LABELS[exc.category]}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-md ${diffConfig.color}`}>
                        {diffConfig.label}
                      </span>
                    </div>

                    {/* Port & Code banner */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                      <span className="flex items-center gap-1.5 font-medium bg-slate-900/90 px-2.5 py-1 rounded-lg backdrop-blur-md border border-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {exc.portCity} ({exc.portName})
                      </span>
                      <span className="font-mono text-[11px] bg-slate-900/90 px-2 py-1 rounded-lg border border-slate-800 text-slate-400">
                        {exc.code}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <Link
                        to={`/excursions/${exc.id}`}
                        className="font-bold text-base text-white hover:text-cyan-400 transition-colors line-clamp-1"
                      >
                        {exc.title}
                      </Link>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {exc.description || 'Chưa có thông tin mô tả chi tiết cho tour trên bờ này.'}
                      </p>
                    </div>

                    {/* Operational Time Strip */}
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" /> Ngày: <strong>{exc.excursionDate}</strong>
                        </span>
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          All-Aboard: {exc.allAboardTime}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-slate-300 pt-1 border-t border-slate-700/40">
                        <div>
                          <span className="text-slate-500 block">Tập trung</span>
                          <strong>{exc.meetingTime}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Khởi hành</span>
                          <strong>{exc.departureTime}</strong>
                        </div>
                        <div>
                          <span className="text-amber-400 block">Về tàu</span>
                          <strong className="text-amber-300">{exc.returnToShipTime}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Warning if delayed */}
                    {exc.status === 'DELAYED' && exc.delayReason && (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2 text-[11px] text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <div>
                          <strong>Cảnh báo trễ giờ:</strong> {exc.delayReason}
                        </div>
                      </div>
                    )}

                    {/* Operator & Guide */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{exc.operatorName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-300">
                        <Bus className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{exc.busNumber || 'Xe riêng'}</span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" /> Đã đặt:
                        </span>
                        <span className="font-semibold text-white">
                          {exc.bookedCount} / {exc.maxCapacity} khách ({percentFilled}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentFilled >= 90
                              ? 'bg-rose-500'
                              : percentFilled >= 70
                              ? 'bg-cyan-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>

                    {/* Price and Package Badge */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <div>
                        {exc.isIncluded ? (
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            Đã bao gồm trong giá vé
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400">Giá vé:</span>
                            <span className="text-sm font-bold text-cyan-400">
                              {exc.price.toLocaleString('vi-VN')} {exc.currency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-slate-800/40 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenManifestModal(exc)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
                      title="Xem danh sách đoàn & xe đưa đón"
                    >
                      <Users className="w-3.5 h-3.5" /> Đoàn & Xe
                    </button>
                    <button
                      onClick={() => handleOpenStatusModal(exc)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                      title="Đổi trạng thái"
                    >
                      Trạng thái
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(exc)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Chỉnh sửa tour"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExcursion(exc.id, exc.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Xóa tour"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/excursions/${exc.id}`}
                      className="p-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 rounded-lg transition-colors"
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
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700">
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
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {excursions.map((exc) => {
                  const statusConfig = EXCURSION_STATUS_MAP[exc.status];
                  return (
                    <tr key={exc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/excursions/${exc.id}`}
                          className="font-bold text-white hover:text-cyan-400 transition-colors block"
                        >
                          {exc.title}
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400 block">{exc.code}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200 block">{exc.portCity}</span>
                        <span className="text-[10px] text-slate-500">{exc.portName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px]">
                          <span className="text-slate-400 block">Ngày: {exc.excursionDate}</span>
                          <span className="text-cyan-300">
                            {exc.departureTime} → {exc.returnToShipTime}
                          </span>
                          <span className="text-[10px] text-rose-400 block font-medium">
                            All-Aboard: {exc.allAboardTime}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200 block">{exc.operatorName}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Bus className="w-3 h-3 text-cyan-400" /> {exc.busNumber || 'Xe du lịch'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">
                          {exc.bookedCount} / {exc.maxCapacity}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({Math.round((exc.bookedCount / exc.maxCapacity) * 100)}%)
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {exc.isIncluded ? (
                          <span className="text-emerald-400 font-medium">Bao gồm</span>
                        ) : (
                          <span className="text-cyan-400 font-bold">
                            {exc.price.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.cls}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenManifestModal(exc)}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Xem đoàn & xe"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenStatusModal(exc)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Đổi trạng thái"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(exc)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Sửa tour"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExcursion(exc.id, exc.title)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Xóa tour"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
}
