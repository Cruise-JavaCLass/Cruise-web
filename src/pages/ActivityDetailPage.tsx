import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  type OnboardActivity,
  type ActivityStatus,
  fetchActivityById,
  deleteActivity,
  getActivityStatusConfig,
} from '../services/activityService';
import { ActivityModal } from '../components/activities/ActivityModal';
import { ActivityStatusModal } from '../components/activities/ActivityStatusModal';

export function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<OnboardActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchActivityById(Number(id));
      setActivity(data);
    } catch {
      showToast('Không thể tải thông tin hoạt động.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!activity) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hoạt động "${activity.title}"?`)) {
      return;
    }
    try {
      await deleteActivity(activity.id);
      navigate('/activities');
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
      desc: config.desc || '',
      icon,
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm">Đang tải thông tin chi tiết hoạt động...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto mt-8">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Không tìm thấy hoạt động</h3>
        <p className="text-xs text-slate-400 mt-1 mb-5">
          Hoạt động bạn tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          to="/activities"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Danh sách Hoạt động
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusBadge(activity.status);
  const StatusIcon = statusConfig.icon;
  const occupancy = Math.round((activity.currentParticipants / (activity.maxCapacity || 1)) * 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/activities" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Hoạt động trên tàu
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-white font-medium truncate max-w-xs">{activity.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold border border-cyan-500/30 transition-colors"
          >
            Đổi trạng thái
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Sửa thông tin
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors border border-rose-500/20"
            title="Xóa hoạt động"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Tour #{activity.tourId} • Ngày {activity.dayNumber}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {activity.category}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.cls}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activity.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              {activity.description || 'Chưa có thông tin mô tả chi tiết cho hoạt động này.'}
            </p>

            {activity.cancellationReason && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Lý do hủy hoạt động:</strong>
                  <span>{activity.cancellationReason}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Booking Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 min-w-[260px] shrink-0 space-y-3">
            <div className="text-xs text-slate-400">Chính sách phí dịch vụ</div>
            <div className="text-xl font-black text-white">
              {activity.isIncluded ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Tag className="w-5 h-5" /> Đã gồm trong Tour
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <DollarSign className="w-5 h-5" /> {activity.price.toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tỷ lệ lấp đầy:</span>
                <span className="font-bold text-white">{occupancy}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    occupancy >= 100
                      ? 'bg-rose-500'
                      : occupancy >= 80
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  }`}
                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{activity.currentParticipants} khách đã đăng ký</span>
                <span>Tối đa {activity.maxCapacity}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Địa điểm tổ chức</p>
            <p className="text-sm font-bold text-white mt-0.5">{activity.location}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ngày diễn ra</p>
            <p className="text-sm font-bold text-white mt-0.5">{activity.activityDate}</p>
            <p className="text-[11px] text-slate-500">Hải trình ngày #{activity.dayNumber}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Khung giờ</p>
            <p className="text-sm font-bold text-white mt-0.5">{activity.startTime} - {activity.endTime}</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sức chứa tối đa</p>
            <p className="text-sm font-bold text-white mt-0.5">{activity.maxCapacity} hành khách</p>
            <p className="text-[11px] text-emerald-400">Còn {Math.max(activity.maxCapacity - activity.currentParticipants, 0)} chỗ trống</p>
          </div>
        </div>
      </div>

      {/* Guidelines & Operations Policy */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> Quy định vận hành & Trạng thái hoạt động
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {statusConfig.desc}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold text-white mb-1">Check-in tại chỗ</h4>
            <p className="text-[11px] text-slate-400">
              Nhân viên sử dụng máy tính bảng POS hoặc quét mã QR/thẻ RFID để xác nhận hành khách khi tham gia.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold text-white mb-1">Chính sách hủy chỗ</h4>
            <p className="text-[11px] text-slate-400">
              Khách có thể hủy đăng ký trước 2 giờ khởi hành để được hoàn lại toàn bộ số dư tài khoản trên tàu.
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold text-white mb-1">Cảnh báo trùng lặp</h4>
            <p className="text-[11px] text-slate-400">
              Hệ thống tự động phát hiện và ngăn chặn xung đột nếu có hoạt động khác đặt trùng thời gian và địa điểm.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ActivityModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        activityToEdit={activity}
        defaultTourId={activity.tourId}
        onSuccess={(updated) => {
          setActivity(updated);
          showToast('Cập nhật thông tin hoạt động thành công!');
        }}
      />

      <ActivityStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        activity={activity}
        onSuccess={(updated) => {
          setActivity(updated);
          showToast(`Chuyển trạng thái sang "${updated.status}" thành công!`);
        }}
      />
    </div>
  );
}
export default ActivityDetailPage;
