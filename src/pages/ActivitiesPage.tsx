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
        <div className="fixed top-20 right-6 z-50 bg-[#171717] border-2 border-[#D9FF43] text-white px-5 py-3 shadow-[4px_4px_0px_#171717] flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#D9FF43] shrink-0" />
          <span className="font-mono font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header — Editorial Neo-Brutalist Broadside */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#171717]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#3155E7] text-white">ONBOARD DISPATCH</span>
            <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• VOYAGE PROGRAMMING</span>
          </div>
          <h2 className="text-2xl font-display font-black text-[#171717] flex items-center gap-2 uppercase tracking-tight">
            <Activity className="w-6 h-6 text-[#3155E7]" /> Quản Lý Hoạt Động & Tour Trên Bờ
          </h2>
          <p className="text-xs font-mono text-[#171717]/70 mt-1">
            Điều phối lịch trình • Theo dõi sức chứa • Phân biệt miễn phí & trả phí ({totalCount} hoạt động)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => void fetchActivityList()}
            className="w-10 h-10 bg-white hover:bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="neo-btn neo-btn-acid flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tạo Hoạt Động Mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar — Architectural Neo-Card */}
      <div className="neo-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Select Tour */}
          <div>
            <label htmlFor="filter-tour-select" className="block text-[11px] font-mono font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Tour Du Thuyền
            </label>
            <select
              id="filter-tour-select"
              value={selectedTourId}
              onChange={(e) => setSelectedTourId(Number(e.target.value))}
              className="neo-input w-full text-xs font-bold bg-white"
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
            <label htmlFor="filter-keyword-input" className="block text-[11px] font-mono font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Tìm kiếm theo Tên hoặc Địa điểm
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#171717]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="filter-keyword-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="VD: Yoga, Grand Ballroom, Nấu ăn..."
                className="neo-input w-full pl-9 text-xs font-medium placeholder-[#171717]/40 bg-white"
              />
            </div>
          </div>

          {/* Select Day */}
          <div>
            <label htmlFor="filter-day-select" className="block text-[11px] font-mono font-bold text-[#171717] uppercase tracking-wider mb-1.5">
              Lọc Theo Ngày Số
            </label>
            <select
              id="filter-day-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="neo-input w-full text-xs font-bold bg-white"
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
        <div className="pt-3 border-t-2 border-[#171717] flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] text-[#171717] font-mono font-bold shrink-0 flex items-center gap-1 mr-1 uppercase">
            <Filter className="w-3.5 h-3.5 text-[#3155E7]" /> Thể loại:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-mono font-bold border-2 border-[#171717] transition-all whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5 ${
                selectedCategory === cat
                  ? 'bg-[#3155E7] text-white shadow-[2px_2px_0px_#171717]'
                  : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
              }`}
            >
              {cat === 'ALL' ? 'Tất Cả Thể Loại' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Grid */}
      {activities.length === 0 ? (
        <div className="neo-card p-12 text-center bg-white">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#E7E4DC] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center">
            <Activity className="w-8 h-8 text-[#171717]" />
          </div>
          <h3 className="text-lg font-display font-black text-[#171717] uppercase">Không tìm thấy hoạt động nào</h3>
          <p className="text-xs font-mono text-[#171717]/70 max-w-sm mx-auto mt-2">
            Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tạo Hoạt Động Mới&quot; để thiết lập chương trình.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-6 neo-btn neo-btn-acid inline-flex items-center gap-2"
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
                className="neo-card bg-white p-5 flex flex-col justify-between group hover:border-[#3155E7] transition-colors"
              >
                <div>
                  {/* Card Header badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="neo-badge bg-[#E7E4DC] text-[#171717] text-[10px]">
                      Ngày {act.dayNumber} • {act.category}
                    </span>
                    <button
                      onClick={() => handleOpenStatusModal(act)}
                      title="Bấm để đổi trạng thái"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase border-2 border-[#171717] bg-white text-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#D9FF43] transition-all"
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusConfig.label.split(' ')[0]}</span>
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display font-black text-base text-[#171717] group-hover:text-[#3155E7] transition-colors line-clamp-1 uppercase tracking-tight">
                    {act.title}
                  </h3>
                  {act.description && (
                    <p className="text-xs font-sans text-[#171717]/75 mt-1.5 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  )}

                  {/* Meta Details */}
                  <div className="mt-4 space-y-2 text-xs font-mono text-[#171717]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#3155E7] shrink-0" />
                      <span className="truncate font-semibold">{act.location}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#171717]/70 shrink-0" />
                      <span>
                        {act.startTime} - {act.endTime} ({act.activityDate})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#171717]" />
                        Đã đăng ký: <strong className="text-[#171717]">{act.currentParticipants}/{act.maxCapacity}</strong>
                      </span>
                      <span className={`text-[11px] font-black font-mono ${
                        occupancy >= 100 ? 'text-[#DC2626]' : occupancy >= 80 ? 'text-amber-600' : 'text-[#3155E7]'
                      }`}>
                        {occupancy}% chỗ
                      </span>
                    </div>

                    {/* Progress Bar — Neo-Brutalist */}
                    <div className="w-full bg-[#E7E4DC] border-2 border-[#171717] h-3 overflow-hidden">
                      <div
                        className={`h-full border-r-2 border-[#171717] transition-all duration-500 ${
                          occupancy >= 100
                            ? 'bg-[#DC2626]'
                            : occupancy >= 80
                            ? 'bg-[#D9FF43]'
                            : 'bg-[#3155E7]'
                        }`}
                        style={{ width: `${Math.min(occupancy, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Actions */}
                <div className="mt-5 pt-3.5 border-t-2 border-[#171717] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {act.isIncluded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#171717] bg-[#D9FF43] px-2 py-0.5 border border-[#171717]">
                        <Tag className="w-3 h-3" /> Đã gồm trong tour
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-white bg-[#171717] px-2 py-0.5 border border-[#171717]">
                        <DollarSign className="w-3 h-3 text-[#D9FF43]" /> {act.price.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(act)}
                      className="px-2.5 py-1 text-xs font-mono font-bold text-[#171717] bg-white hover:bg-[#E7E4DC] border-2 border-[#171717] shadow-[1px_1px_0px_#171717] transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(act.id, act.title)}
                      className="p-1 text-[#DC2626] hover:bg-[#DC2626]/10 border-2 border-transparent hover:border-[#DC2626] transition-colors"
                      title="Xóa hoạt động"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Link
                      to={`/activities/${act.id}/attendance`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#3155E7] text-white text-xs font-mono font-bold border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#3155E7]/90 transition-all active:translate-x-0.5 active:translate-y-0.5"
                      title="Điểm danh & Quét vé"
                    >
                      <QrCode className="w-3 h-3" /> Điểm danh
                    </Link>
                    <Link
                      to={`/activities/${act.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#D9FF43] text-[#171717] text-xs font-mono font-bold border-2 border-[#171717] shadow-[2px_2px_0px_#171717] hover:bg-[#D9FF43]/90 transition-all active:translate-x-0.5 active:translate-y-0.5"
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
