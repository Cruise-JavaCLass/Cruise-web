import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Clock,
  ArrowLeft,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import {
  activityRegistrationService,
  type WaitlistQueueItem,
  type PagedRosterResponse
} from '../services/activityRegistrationService';
import {
  fetchActivityById,
  type OnboardActivity
} from '../services/activityService';

export const ActivityRosterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const activityId = Number(id) || 1;

  const [activity, setActivity] = useState<OnboardActivity | null>(null);
  const [rosterData, setRosterData] = useState<PagedRosterResponse>({
    content: [],
    totalElements: 0,
    totalPages: 1,
    size: 15,
    number: 0
  });
  const [waitlistQueue, setWaitlistQueue] = useState<WaitlistQueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'waitlist'>('roster');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [promotingWaitlistId, setPromotingWaitlistId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [act, rosterRes, waitlistRes] = await Promise.all([
        fetchActivityById(activityId).catch(() => null),
        activityRegistrationService.getRosterPaged(activityId, {
          keyword: keyword.trim() || undefined,
          status: statusFilter || undefined,
          page: currentPage,
          size: 15
        }),
        activityRegistrationService.getWaitlistQueue(activityId).catch(() => [])
      ]);

      if (act) setActivity(act);
      setRosterData(rosterRes);
      setWaitlistQueue(waitlistRes);
    } catch (err) {
      console.error('Lỗi tải danh sách đăng ký:', err);
      showToast('Có lỗi xảy ra khi tải dữ liệu bảng kê đăng ký');
    } finally {
      setIsLoading(false);
    }
  }, [activityId, keyword, statusFilter, currentPage]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleExportCsv = async () => {
    try {
      const blob = await activityRegistrationService.exportRosterCsv(activityId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-${activityId}-roster.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Tải xuống file CSV thành công!');
    } catch {
      showToast('Không thể xuất file CSV vào lúc này');
    }
  };

  const handlePromoteWaitlist = async (waitlistId: number) => {
    try {
      setPromotingWaitlistId(waitlistId);
      await activityRegistrationService.promoteWaitlist(activityId, waitlistId);
      showToast('Đôn suất thành công! Hành khách đã được chuyển sang danh sách chính thức.');
      void loadData();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      showToast(errorObj?.response?.data?.message || 'Có lỗi khi đôn suất hành khách.');
    } finally {
      setPromotingWaitlistId(null);
    }
  };

  // KPI calculations
  const totalConfirmed = activity?.currentParticipants ?? rosterData.content.filter(r => r.status === 'CONFIRMED').length;
  const maxCap = activity?.maxCapacity || 50;
  const remaining = Math.max(0, maxCap - totalConfirmed);
  const occupancyPct = Math.min(100, Math.round((totalConfirmed / maxCap) * 100));
  const estimatedRevenue = totalConfirmed * (activity?.price || 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div role="status" className="fixed top-6 right-6 z-50 rounded-xl bg-white border border-[#E5E0D7] px-5 py-3 text-sm font-semibold text-[#252B32] shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={activity ? `/activities/${activity.id}` : '/activities'}
            className="p-2.5 rounded-xl bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] text-[#102A43] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#102A43]">
              <Users className="w-3.5 h-3.5 text-[#397C80]" />
              <span>ĐIỀU PHỐI SỰ KIỆN • REGISTRATION ROSTER & WAITLIST</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43]">
              {activity ? activity.title : `Hoạt Động #${activityId}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="p-2.5 rounded-xl bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] text-[#102A43] transition-colors shadow-xs"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất File CSV
          </button>
        </div>
      </div>

      {/* High Occupancy Alert Banner */}
      {occupancyPct >= 90 && (
        <div role="alert" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Cảnh báo lấp đầy cao:</strong> Hoạt động đã đạt <strong>{occupancyPct}%</strong> sức chứa ({totalConfirmed}/{maxCap} chỗ).
              Hàng đợi Waitlist đang sẵn sàng tiếp nhận hành khách bổ sung khi có người hủy.
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-[11px] font-bold text-amber-800 border border-amber-200">
            {waitlistQueue.length} khách trong hàng đợi
          </span>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng đăng ký xác nhận */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#252B32]/70">
            <span>Đã Đăng Ký (Confirmed)</span>
            <UserCheck className="w-4 h-4 text-[#397C80]" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-[#102A43]">
            {totalConfirmed} <span className="text-xs font-normal text-[#252B32]/50">/ {maxCap}</span>
          </div>
          <div className="w-full bg-[#F7F4ED] rounded-full h-1.5 overflow-hidden border border-[#E5E0D7]">
            <div className="bg-[#397C80] h-1.5 rounded-full" style={{ width: `${occupancyPct}%` }} />
          </div>
        </div>

        {/* KPI 2: Còn trống */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#252B32]/70">
            <span>Suất Khả Dụng</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-emerald-700">
            {remaining} <span className="text-xs font-normal text-[#252B32]/50">chỗ trống</span>
          </div>
          <p className="text-[11px] text-[#252B32]/60">Tỷ lệ lấp đầy: {occupancyPct}%</p>
        </div>

        {/* KPI 3: Hàng đợi Waitlist */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#252B32]/70">
            <span>Danh Sách Chờ (Waitlist)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-amber-700">
            {waitlistQueue.length} <span className="text-xs font-normal text-[#252B32]/50">hành khách</span>
          </div>
          <p className="text-[11px] text-[#252B32]/60">Tự động đôn suất theo thứ tự FIFO</p>
        </div>

        {/* KPI 4: Doanh thu tạm tính */}
        <div className="p-5 rounded-2xl bg-white border border-[#E5E0D7] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#252B32]/70">
            <span>Doanh Thu Tạm Tính</span>
            <CreditCard className="w-4 h-4 text-[#102A43]" />
          </div>
          <div className="text-2xl font-serif font-extrabold text-[#102A43]">
            {estimatedRevenue > 0 ? `${estimatedRevenue.toLocaleString('vi-VN')}` : '0'}{' '}
            <span className="text-xs font-normal text-[#252B32]/50">VND</span>
          </div>
          <p className="text-[11px] text-[#252B32]/60">Đơn giá: {activity?.price ? `${activity.price.toLocaleString('vi-VN')} VND` : 'Miễn phí'}</p>
        </div>
      </div>

      {/* Tabs Selection: Roster vs Waitlist */}
      <div className="flex items-center justify-between border-b border-[#E5E0D7]">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'roster'
                ? 'border-[#102A43] text-[#102A43]'
                : 'border-transparent text-[#252B32]/60 hover:text-[#102A43]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Sách Đăng Ký ({rosterData.totalElements})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('waitlist')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'waitlist'
                ? 'border-[#397C80] text-[#397C80]'
                : 'border-transparent text-[#252B32]/60 hover:text-[#102A43]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hàng Đợi Waitlist ({waitlistQueue.length})</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        {activeTab === 'roster' && (
          <div className="flex items-center gap-3 pb-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#252B32]/40" />
              <input
                type="text"
                placeholder="Tìm tên khách, số cabin..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#E5E0D7] bg-white text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] w-52"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-[#E5E0D7] bg-white text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="WAITLISTED">Hàng đợi Waitlist</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Roster Table */}
      {activeTab === 'roster' && (
        <div className="rounded-2xl border border-[#E5E0D7] bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] text-[#102A43] border-b border-[#E5E0D7]">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Mã ĐK</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Hành Khách</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Số Cabin</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Gói Tour</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Trạng Thái</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Số Tiền</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Giao Dịch Folio</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Thời Gian ĐK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D7] text-[#252B32]">
                {rosterData.content.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#252B32]/50">
                      Không tìm thấy bản ghi đăng ký nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  rosterData.content.map((item) => (
                    <tr key={item.registrationId} className="hover:bg-[#F7F4ED]/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#252B32]/70">#{item.registrationId}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#102A43]">{item.passengerName}</td>
                      <td className="px-5 py-3.5 font-mono text-[#397C80] font-bold">{item.cabinNumber}</td>
                      <td className="px-5 py-3.5 text-[#252B32]/70">{item.tourPackage || 'Tiêu Chuẩn'}</td>
                      <td className="px-5 py-3.5">
                        {item.status === 'CONFIRMED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        )}
                        {item.status === 'WAITLISTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Waitlisted
                          </span>
                        )}
                        {item.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[#252B32]">
                        {item.chargedAmount > 0 ? `${item.chargedAmount.toLocaleString('vi-VN')} VND` : '0 VND'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#252B32]/60">{item.transactionId || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-[#252B32]/60 font-mono text-[11px]">
                        {new Date(item.registeredAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {rosterData.totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E0D7] flex items-center justify-between">
              <span className="text-xs text-[#252B32]/70">
                Hiển thị trang {rosterData.number + 1} / {rosterData.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-[#E5E0D7] disabled:opacity-40 text-[#102A43]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= rosterData.totalPages - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-1.5 rounded-lg border border-[#E5E0D7] disabled:opacity-40 text-[#102A43]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Waitlist Queue Table */}
      {activeTab === 'waitlist' && (
        <div className="rounded-2xl border border-[#E5E0D7] bg-white shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-50/50 border-b border-[#E5E0D7] flex items-center justify-between">
            <span className="text-xs text-amber-800 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Thứ tự ưu tiên được sắp xếp theo thời gian tham gia hàng đợi (First-In, First-Out).
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F4ED] text-[#102A43] border-b border-[#E5E0D7]">
                <tr>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Vị Trí (Priority)</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Hành Khách</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Số Cabin</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider">Thời Gian Xếp Hàng</th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D7] text-[#252B32]">
                {waitlistQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#252B32]/50">
                      Hiện tại không có hành khách nào trong danh sách chờ.
                    </td>
                  </tr>
                ) : (
                  waitlistQueue.map((item) => (
                    <tr key={item.registrationId} className="hover:bg-[#F7F4ED]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs font-mono">
                          {item.position}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#102A43]">{item.passengerName}</td>
                      <td className="px-5 py-3.5 font-mono text-[#397C80] font-bold">{item.cabinNumber}</td>
                      <td className="px-5 py-3.5 text-[#252B32]/60 font-mono text-[11px]">
                        {new Date(item.registeredAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={promotingWaitlistId === item.registrationId}
                          onClick={() => handlePromoteWaitlist(item.registrationId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white font-bold text-[11px] shadow-xs transition-colors disabled:opacity-50"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          {promotingWaitlistId === item.registrationId ? 'Đang đôn...' : 'Đôn Suất Ngay'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityRosterPage;
