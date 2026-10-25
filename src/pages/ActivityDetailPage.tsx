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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#171717] space-y-4">
        <div className="w-12 h-12 bg-[#D9FF43] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#171717] animate-spin" />
        </div>
        <p className="text-xs font-mono font-bold uppercase tracking-wider">Đang tải thông tin chi tiết hoạt động...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="neo-card p-12 text-center max-w-lg mx-auto mt-8 bg-white">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#E7E4DC] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-[#DC2626]" />
        </div>
        <h3 className="text-xl font-display font-black text-[#171717] uppercase">Không tìm thấy hoạt động</h3>
        <p className="text-xs font-mono text-[#171717]/70 mt-2 mb-6">
          Hoạt động bạn tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
        </p>
        <Link
          to="/activities"
          className="neo-btn neo-btn-secondary inline-flex items-center gap-2"
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
          className="fixed top-24 right-8 z-50 bg-[#171717] border-2 border-[#D9FF43] text-white px-5 py-3 shadow-[4px_4px_0px_#171717] flex items-center gap-3 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-[#D9FF43] shrink-0" />
          <p className="font-mono font-bold">{toastMessage}</p>
        </aside>
      )}

      {/* Navigation Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#171717]">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#171717]">
          <Link to="/activities" className="hover:text-[#3155E7] transition-colors flex items-center gap-1 uppercase">
            <ArrowLeft className="w-3.5 h-3.5" /> Hoạt động trên tàu
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#171717]/40" />
          <span className="text-[#3155E7] uppercase truncate max-w-xs">{activity.title}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/activities/${activity.id}/attendance`}
            className="neo-btn neo-btn-primary inline-flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <QrCode className="w-3.5 h-3.5" /> Điểm danh & Quét vé
          </Link>
          <Link
            to={`/activities/${activity.id}/roster`}
            className="neo-btn neo-btn-acid inline-flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Users className="w-3.5 h-3.5" /> Danh sách & Waitlist
          </Link>
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="neo-btn neo-btn-secondary py-1.5 px-3 text-xs"
          >
            Đổi trạng thái
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="neo-btn neo-btn-secondary inline-flex items-center gap-1.5 py-1.5 px-3 text-xs"
          >
            <Edit2 className="w-3.5 h-3.5" /> Sửa thông tin
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 bg-white hover:bg-[#DC2626] hover:text-white text-[#DC2626] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Xóa hoạt động"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Banner — Editorial Neo-Brutalist Presentation */}
      <div className="neo-card bg-white p-6 sm:p-8 relative overflow-hidden shadow-[6px_6px_0px_#171717]">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="neo-badge bg-[#171717] text-white">
                Tour #{activity.tourId} • Ngày {activity.dayNumber}
              </span>
              <span className="neo-badge bg-[#E7E4DC] text-[#171717]">
                {activity.category}
              </span>
              <span className="neo-badge bg-[#3155E7] text-white flex items-center gap-1">
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-black text-[#171717] uppercase tracking-tight">
              {activity.title}
            </h1>

            <p className="text-xs sm:text-sm font-sans text-[#171717]/80 leading-relaxed max-w-xl">
              {activity.description || 'Chưa có thông tin mô tả chi tiết cho hoạt động này.'}
            </p>

            {activity.cancellationReason && (
              <div className="p-4 bg-[#F7F5F0] border-2 border-[#DC2626] shadow-[2px_2px_0px_#DC2626] text-[#DC2626] text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-mono font-bold uppercase tracking-wider">Lý do hủy hoạt động:</strong>
                  <span className="font-mono mt-0.5 block">{activity.cancellationReason}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Booking Card — Neo-Brutalist Stat Box */}
          <div className="neo-card bg-[#F7F5F0] p-5 min-w-[280px] shrink-0 space-y-3 shadow-[4px_4px_0px_#171717]">
            <div className="text-[11px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Chính sách phí dịch vụ</div>
            <div className="text-2xl font-display font-black text-[#171717]">
              {activity.isIncluded ? (
                <span className="text-[#171717] bg-[#D9FF43] px-2 py-0.5 border border-[#171717] inline-flex items-center gap-1.5 text-base font-bold">
                  <Tag className="w-4 h-4" /> Đã gồm trong Tour
                </span>
              ) : (
                <span className="text-[#171717] inline-flex items-center gap-1">
                  <DollarSign className="w-6 h-6 text-[#3155E7]" /> {activity.price.toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>

            <div className="pt-3 border-t-2 border-[#171717] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#171717]">
                <span>Tỷ lệ lấp đầy:</span>
                <span className="text-[#3155E7]">{occupancy}%</span>
              </div>
              <div className="w-full bg-white border-2 border-[#171717] h-3 overflow-hidden">
                <div
                  className={`h-full border-r-2 border-[#171717] ${
                    occupancy >= 100
                      ? 'bg-[#DC2626]'
                      : occupancy >= 80
                      ? 'bg-[#D9FF43]'
                      : 'bg-[#3155E7]'
                  }`}
                  style={{ width: `${Math.min(occupancy, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#171717]/70">
                <span>{activity.currentParticipants} khách đã đăng ký</span>
                <span>Tối đa {activity.maxCapacity}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stat Cards — Neo-Brutalist Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="neo-card bg-white p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-[#3155E7]" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Địa điểm tổ chức</p>
            <p className="text-sm font-display font-black text-[#171717] mt-0.5">{activity.location}</p>
          </div>
        </div>

        <div className="neo-card bg-white p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 bg-[#3155E7] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Ngày diễn ra</p>
            <p className="text-sm font-display font-black text-[#171717] mt-0.5">{activity.activityDate}</p>
            <p className="text-[10px] font-mono font-bold text-[#3155E7] mt-0.5">Hải trình ngày #{activity.dayNumber}</p>
          </div>
        </div>

        <div className="neo-card bg-white p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 bg-[#D9FF43] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#171717]" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Khung giờ</p>
            <p className="text-sm font-display font-black text-[#171717] mt-0.5">{activity.startTime} - {activity.endTime}</p>
          </div>
        </div>

        <div className="neo-card bg-white p-4 flex items-start gap-3.5">
          <div className="w-10 h-10 bg-[#171717] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[#D9FF43]" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Sức chứa tối đa</p>
            <p className="text-sm font-display font-black text-[#171717] mt-0.5">{activity.maxCapacity} hành khách</p>
            <p className="text-[10px] font-mono font-bold text-[#3155E7] mt-0.5">Còn {Math.max(activity.maxCapacity - activity.currentParticipants, 0)} chỗ trống</p>
          </div>
        </div>
      </div>

      {/* Guidelines & Operations Policy — Broadsheet Section */}
      <div className="neo-card bg-white p-6 sm:p-8 space-y-5">
        <div className="pb-3 border-b-2 border-[#171717]">
          <h3 className="text-lg font-display font-black text-[#171717] flex items-center gap-2 uppercase tracking-tight">
            <ShieldCheck className="w-5 h-5 text-[#3155E7]" /> Quy định vận hành & Trạng thái hoạt động
          </h3>
          <p className="text-xs font-mono text-[#171717]/75 mt-1 leading-relaxed">
            {statusConfig.desc}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <h4 className="text-xs font-mono font-bold text-[#171717] uppercase mb-1">Check-in tại chỗ</h4>
            <p className="text-xs font-sans text-[#171717]/80 leading-relaxed">
              Nhân viên sử dụng máy tính bảng POS hoặc quét mã QR/thẻ RFID để xác nhận hành khách khi tham gia.
            </p>
          </div>

          <div className="p-4 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <h4 className="text-xs font-mono font-bold text-[#171717] uppercase mb-1">Chính sách hủy chỗ</h4>
            <p className="text-xs font-sans text-[#171717]/80 leading-relaxed">
              Khách có thể hủy đăng ký trước 2 giờ khởi hành để được hoàn lại toàn bộ số dư tài khoản trên tàu.
            </p>
          </div>

          <div className="p-4 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <h4 className="text-xs font-mono font-bold text-[#171717] uppercase mb-1">Cảnh báo trùng lặp</h4>
            <p className="text-xs font-sans text-[#171717]/80 leading-relaxed">
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
