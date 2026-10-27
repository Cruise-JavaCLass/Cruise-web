import { useState, useEffect, useCallback } from 'react';
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
  QrCode,
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

  const loadDetail = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#102A43] space-y-4">
        <div className="w-12 h-12 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl shadow-xs flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#102A43] animate-spin" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#252B32]/70">Đang tải thông tin chi tiết hoạt động...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="bg-white border border-[#E5E0D7] rounded-2xl shadow-xl p-12 text-center max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-serif font-bold text-[#102A43] uppercase">Không tìm thấy hoạt động</h3>
        <p className="text-xs text-[#252B32]/70 mt-2 mb-6">
          Hoạt động bạn tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          to="/activities"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors"
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
      {/* Notification Toast */}
      {toastMessage && (
        <aside
          role="status"
          className="fixed top-24 right-8 z-50 bg-white border border-[#E5E0D7] text-[#252B32] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="font-semibold">{toastMessage}</p>
        </aside>
      )}

      {/* Navigation Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D7]">
        <div className="flex items-center gap-2 text-xs font-medium text-[#252B32]/70">
          <Link to="/activities" className="hover:text-[#102A43] transition-colors flex items-center gap-1 uppercase font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> Hoạt động trên tàu
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#252B32]/40" />
          <span className="text-[#102A43] font-semibold uppercase truncate max-w-xs">{activity.title}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/activities/${activity.id}/attendance`}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl shadow-xs transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" /> Điểm danh & Quét vé
          </Link>
          <Link
            to={`/activities/${activity.id}/roster`}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold bg-[#397C80] hover:bg-[#2e6467] text-white rounded-xl shadow-xs transition-colors"
          >
            <Users className="w-3.5 h-3.5" /> Danh sách & Waitlist
          </Link>
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="py-1.5 px-3 text-xs font-semibold bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl transition-colors"
          >
            Đổi trạng thái
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Sửa thông tin
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 bg-white hover:bg-rose-50 text-rose-600 border border-[#E5E0D7] rounded-xl flex items-center justify-center transition-colors"
            title="Xóa hoạt động"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Banner — Luxury Maritime Presentation */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#102A43] text-white">
                Tour #{activity.tourId} • Ngày {activity.dayNumber}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                {activity.category}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#397C80] text-white">
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#102A43] uppercase tracking-tight">
              {activity.title}
            </h1>

            <p className="text-xs sm:text-sm font-sans text-[#252B32]/80 leading-relaxed max-w-xl">
              {activity.description || 'Chưa có thông tin mô tả chi tiết cho hoạt động này.'}
            </p>

            {activity.cancellationReason && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold uppercase tracking-wider">Lý do hủy hoạt động:</strong>
                  <span className="mt-0.5 block">{activity.cancellationReason}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Booking Card — Luxury Maritime Stat Box */}
          <div className="bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-2xl p-5 min-w-[280px] shrink-0 space-y-3">
            <div className="text-[11px] font-semibold text-[#102A43] uppercase tracking-wider">Chính sách phí dịch vụ</div>
            <div className="text-2xl font-serif font-bold text-[#102A43]">
              {activity.isIncluded ? (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-md inline-flex items-center gap-1.5 text-base font-bold">
                  <Tag className="w-4 h-4" /> Đã gồm trong Tour
                </span>
              ) : (
                <span className="text-[#102A43] inline-flex items-center gap-1">
                  <DollarSign className="w-6 h-6 text-[#397C80]" /> {activity?.price?.toLocaleString('vi-VN') ?? '0'} đ
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-[#E5E0D7] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#102A43]">
                <span>Tỷ lệ lấp đầy:</span>
                <span className="text-[#397C80]">{occupancy}%</span>
              </div>
              <div className="w-full bg-white border border-[#E5E0D7] rounded-full h-3 overflow-hidden">
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
              <div className="flex items-center justify-between text-[11px] text-[#252B32]/70 font-medium">
                <span>{activity.currentParticipants} khách đã đăng ký</span>
                <span>Tối đa {activity.maxCapacity}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stat Cards — Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-[#397C80]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#252B32]/70 uppercase tracking-wider">Địa điểm tổ chức</p>
            <p className="text-sm font-serif font-bold text-[#102A43] mt-0.5">{activity.location}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 bg-[#102A43] text-white rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#252B32]/70 uppercase tracking-wider">Ngày diễn ra</p>
            <p className="text-sm font-serif font-bold text-[#102A43] mt-0.5">{activity.activityDate}</p>
            <p className="text-[10px] font-semibold text-[#397C80] mt-0.5">Hải trình ngày #{activity.dayNumber}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#397C80]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#252B32]/70 uppercase tracking-wider">Khung giờ</p>
            <p className="text-sm font-serif font-bold text-[#102A43] mt-0.5">{activity.startTime} - {activity.endTime}</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <div className="w-10 h-10 bg-[#102A43] text-white rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#C5A572]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-[#252B32]/70 uppercase tracking-wider">Sức chứa tối đa</p>
            <p className="text-sm font-serif font-bold text-[#102A43] mt-0.5">{activity.maxCapacity} hành khách</p>
            <p className="text-[10px] font-semibold text-[#397C80] mt-0.5">Còn {Math.max(activity.maxCapacity - activity.currentParticipants, 0)} chỗ trống</p>
          </div>
        </div>
      </div>

      {/* Guidelines & Operations Policy — Broadsheet Section */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="pb-3 border-b border-[#E5E0D7]">
          <h3 className="text-lg font-serif font-bold text-[#102A43] flex items-center gap-2 uppercase tracking-tight">
            <ShieldCheck className="w-5 h-5 text-[#397C80]" /> Quy định vận hành & Trạng thái hoạt động
          </h3>
          <p className="text-xs font-sans text-[#252B32]/75 mt-1 leading-relaxed">
            {statusConfig.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-xl">
            <h4 className="text-xs font-semibold text-[#102A43] uppercase mb-1">Check-in tại chỗ</h4>
            <p className="text-xs font-sans text-[#252B32]/80 leading-relaxed">
              Nhân viên sử dụng máy tính bảng POS hoặc quét mã QR/thẻ RFID để xác nhận hành khách khi tham gia.
            </p>
          </div>

          <div className="p-4 bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-xl">
            <h4 className="text-xs font-semibold text-[#102A43] uppercase mb-1">Chính sách hủy chỗ</h4>
            <p className="text-xs font-sans text-[#252B32]/80 leading-relaxed">
              Khách có thể hủy đăng ký trước 2 giờ khởi hành để được hoàn lại toàn bộ số dư tài khoản trên tàu.
            </p>
          </div>

          <div className="p-4 bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-xl">
            <h4 className="text-xs font-semibold text-[#102A43] uppercase mb-1">Cảnh báo trùng lặp</h4>
            <p className="text-xs font-sans text-[#252B32]/80 leading-relaxed">
              Hệ thống tự động phát hiện và ngăn chặn xung đột nếu có hoạt động khác đặt trùng thời gian và địa điểm.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Edit & Status Modals */}
      <ActivityModal
        key={`edit-detail-modal-${activity.id}`}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        activityToEdit={activity}
        defaultTourId={activity.tourId}
        onSuccess={(updatedRecord) => {
          setActivity(updatedRecord);
          showToast(`Đã lưu thay đổi cho "${updatedRecord.title}"!`);
        }}
      />

      <ActivityStatusModal
        key={`status-detail-modal-${activity.id}`}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        activity={activity}
        onSuccess={(updatedRecord) => {
          setActivity(updatedRecord);
          showToast(`Hoạt động đã cập nhật sang trạng thái: ${updatedRecord.status}`);
        }}
      />
    </div>
  );
}
export default ActivityDetailPage;
