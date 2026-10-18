import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Plus,
  Users,
  Clock,
  MapPin,
  Tag,
  Search,
  Filter,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trash2,
  QrCode,
} from 'lucide-react';
import {
  type OnboardActivity,
  type ActivityStatus,
  fetchActivitiesPaged,
  deleteActivity,
  getActivityStatusConfig,
} from '../services/activityService';
import { INITIAL_TOURS } from '../services/tourService';
import { ActivityModal } from '../components/activities/ActivityModal';
import { ActivityStatusModal } from '../components/activities/ActivityStatusModal';

export function ActivitiesPage() {
  const [selectedTourId, setSelectedTourId] = useState<number>(1);
  const [selectedDay, setSelectedDay] = useState<number | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [activities, setActivities] = useState<OnboardActivity[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [activityToEdit, setActivityToEdit] = useState<OnboardActivity | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [activityToChangeStatus, setActivityToChangeStatus] = useState<OnboardActivity | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchActivityList = useCallback(async () => {
    setLoading(true);
    const filterParams = {
      dayNumber: selectedDay === 'ALL' ? undefined : selectedDay,
      category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      keyword: searchTerm,
      page: 0,
      size: 50,
    };

    fetchActivitiesPaged(selectedTourId, filterParams)
      .then((response) => {
        setActivities(response.content);
        setTotalCount(response.totalElements);
      })
      .catch(() => {
        showToast('Không thể tải danh sách hoạt động.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedTourId, selectedDay, selectedCategory, searchTerm]);

  useEffect(() => {
    void fetchActivityList();
  }, [fetchActivityList]);

  const handleOpenCreateModal = () => {
    setActivityToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (act: OnboardActivity) => {
    setActivityToEdit(act);
    setIsFormModalOpen(true);
  };

  const handleOpenStatusModal = (act: OnboardActivity) => {
    setActivityToChangeStatus(act);
    setIsStatusModalOpen(true);
  };

  const handleDeleteActivity = async (id: number, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hoạt động "${title}"?`)) {
      return;
    }
    try {
      await deleteActivity(id);
      showToast(`Đã xóa hoạt động "${title}" thành công!`);
      void fetchActivityList();
    } catch {
      showToast('Có lỗi xảy ra khi xóa hoạt động.');
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const config = getActivityStatusConfig(status);
    const icon =
      status === 'SCHEDULED'
        ? Clock
        : status === 'IN_PROGRESS'
        ? Activity
        : status === 'COMPLETED'
        ? CheckCircle2
        : XCircle;

    return {
      cls: config.cls,
      label: config.label,
      icon,
    };
  };

  const categories = [
    'ALL',
    'Wellness & Sức Khỏe',
    'Dining & Dạ Tiệc',
    'Culinary & Ẩm Thực',
    'Entertainment & Âm Nhạc',
    'Sports & Thể Thao',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Quản Lý Hoạt Động & Tour Trên Bờ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Điều phối lịch trình • Theo dõi sức chứa • Phân biệt miễn phí & trả phí ({totalCount} hoạt động)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void fetchActivityList()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Tạo Hoạt Động Mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Select Tour */}
          <div>
            <label htmlFor="filter-tour-select" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tour Du Thuyền
            </label>
            <select
              id="filter-tour-select"
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {INITIAL_TOURS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Keyword */}
          <div className="lg:col-span-2">
            <label htmlFor="filter-keyword-input" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tìm kiếm theo Tên hoặc Địa điểm
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="filter-keyword-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="VD: Yoga, Grand Ballroom, Nấu ăn..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          {/* Select Day */}
          <div>
            <label htmlFor="filter-day-select" className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Lọc Theo Ngày Số
            </label>
            <select
              id="filter-day-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="ALL">Tất cả các ngày</option>
              <option value={1}>Ngày 1</option>
              <option value={2}>Ngày 2</option>
              <option value={3}>Ngày 3</option>
              <option value={4}>Ngày 4</option>
            </select>
          </div>
        </div>

        {/* Category Badges Filter */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-cyan-400" /> Thể loại:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'Tất Cả Thể Loại' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Không tìm thấy hoạt động nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tạo Hoạt Động Mới&quot; để thiết lập chương trình.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo Hoạt Động Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((act) => {
            const statusConfig = getStatusBadge(act.status);
            const StatusIcon = statusConfig.icon;
            const occupancy = Math.round((act.currentParticipants / (act.maxCapacity || 1)) * 100);

            return (
              <div
                key={act.id}
                className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-5 transition-all shadow-md hover:shadow-cyan-900/10 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Ngày {act.dayNumber} • {act.category}
                    </span>
                    <button
                      onClick={() => handleOpenStatusModal(act)}
                      title="Bấm để đổi trạng thái"
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all hover:scale-105 ${statusConfig.cls}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label.split(' ')[0]}</span>
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {act.title}
                  </h3>
                  {act.description && (
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  )}

                  {/* Meta Details */}
                  <div className="mt-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{act.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>
                        {act.startTime} - {act.endTime} ({act.activityDate})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        Đã đăng ký: <strong className="text-white">{act.currentParticipants}/{act.maxCapacity}</strong>
                      </span>
                      <span className={`text-[11px] font-semibold ${
                        occupancy >= 100 ? 'text-rose-400' : occupancy >= 80 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {occupancy}% chỗ
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occupancy >= 100
                            ? 'bg-rose-500'
                            : occupancy >= 80
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {act.isIncluded ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        <Tag className="w-3 h-3" /> Đã gồm trong tour
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        <DollarSign className="w-3 h-3" /> {act.price.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(act)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(act.id, act.title)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Xóa hoạt động"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/activities/${act.id}/attendance`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-semibold border border-blue-500/30 transition-all"
                      title="Điểm danh & Quét vé"
                    >
                      <QrCode className="w-3 h-3" /> Điểm danh
                    </Link>
                    <Link
                      to={`/activities/${act.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/30 transition-all hover:gap-1.5"
                    >
                      Chi tiết <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Activity Create / Edit Modal */}
      <ActivityModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        activityToEdit={activityToEdit}
        defaultTourId={selectedTourId}
        onSuccess={() => {
          showToast(
            activityToEdit
              ? 'Cập nhật thông tin hoạt động thành công!'
              : 'Tạo mới hoạt động du thuyền thành công!'
          );
          void fetchActivityList();
        }}
      />

      {/* Activity Status Transition Modal */}
      <ActivityStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        activity={activityToChangeStatus}
        onSuccess={(updated) => {
          showToast(`Chuyển trạng thái sang "${updated.status}" thành công!`);
          void fetchActivityList();
        }}
      />
    </div>
  );
}
export default ActivitiesPage;
