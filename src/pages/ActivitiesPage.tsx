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
import { getTours, INITIAL_TOURS, type CruiseTour } from '../services/tourService';
import { ActivityModal } from '../components/activities/ActivityModal';
import { ActivityStatusModal } from '../components/activities/ActivityStatusModal';

export function ActivitiesPage() {
  const [tours, setTours] = useState<CruiseTour[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<number | null>(null);
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

  useEffect(() => {
    void getTours().then((list) => {
      setTours(list);
      if (list.length > 0) {
        setSelectedTourId((prev) => (prev && list.some((t) => t.id === prev) ? prev : list[0].id));
      } else {
        setSelectedTourId(null);
      }
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchActivityList = useCallback(async () => {
    if (!selectedTourId) {
      setActivities([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }
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
        <div className="fixed top-20 right-6 z-50 bg-white border border-[#E5E0D7] text-[#252B32] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header — Luxury Maritime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D7]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/15 tracking-wider">
              ONBOARD DISPATCH
            </span>
            <span className="text-[11px] font-medium text-[#252B32]/70">• VOYAGE PROGRAMMING</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#102A43] flex items-center gap-2.5 tracking-tight">
            <Activity className="w-6 h-6 text-[#102A43]" /> Quản Lý Hoạt Động & Tour Trên Bờ
          </h2>
          <p className="text-xs text-[#252B32]/70 mt-1">
            Điều phối lịch trình • Theo dõi sức chứa • Phân biệt miễn phí & trả phí ({totalCount} hoạt động)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void fetchActivityList()}
            className="w-10 h-10 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl shadow-xs flex items-center justify-center transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo Hoạt Động Mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar — Luxury Maritime Card */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Select Tour */}
          <div>
            <label htmlFor="filter-tour-select" className="block text-[11px] font-semibold text-[#102A43] uppercase tracking-wider mb-1.5">
              Tour Du Thuyền
            </label>
            <select
              id="filter-tour-select"
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(Number(e.target.value))}
              className="w-full text-xs font-semibold bg-[#F7F4ED]/50 hover:bg-white focus:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] px-3 py-2 focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
            >
              {tours.length === 0 ? (
                <option value={1}>Tour #1 (Mặc định)</option>
              ) : (
                tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Search Keyword */}
          <div className="lg:col-span-2">
            <label htmlFor="filter-keyword-input" className="block text-[11px] font-semibold text-[#102A43] uppercase tracking-wider mb-1.5">
              Tìm kiếm theo Tên hoặc Địa điểm
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#252B32]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="filter-keyword-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="VD: Yoga, Grand Ballroom, Nấu ăn..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#F7F4ED]/50 hover:bg-white focus:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] placeholder-[#252B32]/40 focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-all"
              />
            </div>
          </div>

          {/* Select Day */}
          <div>
            <label htmlFor="filter-day-select" className="block text-[11px] font-semibold text-[#102A43] uppercase tracking-wider mb-1.5">
              Lọc Theo Ngày Số
            </label>
            <select
              id="filter-day-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="w-full text-xs font-semibold bg-[#F7F4ED]/50 hover:bg-white focus:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] px-3 py-2 focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
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
        <div className="pt-3 border-t border-[#E5E0D7] flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] text-[#102A43] font-semibold shrink-0 flex items-center gap-1 mr-1 uppercase">
            <Filter className="w-3.5 h-3.5 text-[#397C80]" /> Thể loại:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-[#102A43] text-white shadow-xs'
                  : 'bg-white text-[#252B32] border border-[#E5E0D7] hover:bg-[#F7F4ED]'
              }`}
            >
              {cat === 'ALL' ? 'Tất Cả Thể Loại' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E5E0D7] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#F7F4ED] rounded-2xl flex items-center justify-center">
            <Activity className="w-8 h-8 text-[#102A43]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#102A43]">Không tìm thấy hoạt động nào</h3>
          <p className="text-xs text-[#252B32]/70 max-w-sm mx-auto mt-2">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tạo Hoạt Động Mới&quot; để thiết lập chương trình.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo Hoạt Động Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((act) => {
            const statusConfig = getStatusBadge(act.status);
            const StatusIcon = statusConfig.icon;
            const occupancy = Math.round((act.currentParticipants / (act.maxCapacity || 1)) * 100);

            return (
              <div
                key={act.id}
                className="bg-white border border-[#E5E0D7] rounded-2xl p-5 flex flex-col justify-between group hover:border-[#C5A572] hover:shadow-md transition-all"
              >
                <div>
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7]">
                      Ngày {act.dayNumber} • {act.category}
                    </span>
                    <button
                      onClick={() => handleOpenStatusModal(act)}
                      title="Bấm để đổi trạng thái"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-semibold uppercase rounded-md border border-[#E5E0D7] bg-white text-[#252B32] hover:bg-[#F7F4ED] transition-colors"
                    >
                      <StatusIcon className="w-3 h-3 text-[#397C80]" />
                      <span>{statusConfig.label.split(' ')[0]}</span>
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif font-bold text-base text-[#102A43] group-hover:text-[#397C80] transition-colors line-clamp-1 tracking-tight">
                    {act.title}
                  </h3>
                  {act.description && (
                    <p className="text-xs text-[#252B32]/70 mt-1.5 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  )}

                  {/* Meta Details */}
                  <div className="mt-4 space-y-2 text-xs text-[#252B32]/70">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#397C80] shrink-0" />
                      <span className="truncate font-semibold text-[#252B32]">{act.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#252B32]/50 shrink-0" />
                      <span>
                        {act.startTime} - {act.endTime} ({act.activityDate})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#252B32]/50" />
                        Đã đăng ký: <strong className="text-[#252B32] font-semibold tabular-nums">{act.currentParticipants}/{act.maxCapacity}</strong>
                      </span>
                      <span className={`text-[11px] font-bold tabular-nums ${
                        occupancy >= 100 ? 'text-rose-600' : occupancy >= 80 ? 'text-amber-600' : 'text-[#397C80]'
                      }`}>
                        {occupancy}% chỗ
                      </span>
                    </div>

                    {/* Progress Bar — Luxury Maritime */}
                    <div className="w-full bg-[#F7F4ED] rounded-full h-2 overflow-hidden border border-[#E5E0D7]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          occupancy >= 100
                            ? 'bg-rose-500'
                            : occupancy >= 80
                            ? 'bg-amber-500'
                            : 'bg-[#397C80]'
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Actions */}
                <div className="mt-5 pt-3.5 border-t border-[#E5E0D7] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {act.isIncluded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        <Tag className="w-3 h-3" /> Đã gồm trong tour
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#252B32] bg-[#F7F4ED] px-2 py-0.5 rounded-md border border-[#E5E0D7] tabular-nums">
                        <DollarSign className="w-3 h-3 text-[#397C80]" /> {act.price.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(act)}
                      className="px-2.5 py-1 text-xs font-medium text-[#252B32] bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(act.id, act.title)}
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa hoạt động"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/activities/${act.id}/attendance`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] text-xs font-medium rounded-lg border border-[#E5E0D7] transition-colors"
                      title="Điểm danh & Quét vé"
                    >
                      <QrCode className="w-3 h-3" /> Điểm danh
                    </Link>
                    <Link
                      to={`/activities/${act.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
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
