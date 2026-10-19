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
        <div role="status" className="fixed top-6 right-6 z-50 rounded-2xl bg-slate-900 border border-slate-700 px-5 py-3 text-sm font-semibold text-white shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={activity ? `/activities/${activity.id}` : '/activities'}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400">
              <Users className="w-3.5 h-3.5" />
              <span>ĐIỀU PHỐI SỰ KIỆN • REGISTRATION ROSTER & WAITLIST</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {activity ? activity.title : `Hoạt Động #${activityId}`}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất File CSV
          </button>
        </div>
      </div>

      {/* High Occupancy Alert Banner */}
      {occupancyPct >= 90 && (
        <div role="alert" className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <strong className="font-bold">Cảnh báo lấp đầy cao:</strong> Hoạt động đã đạt <strong>{occupancyPct}%</strong> sức chứa ({totalConfirmed}/{maxCap} chỗ).
              Hàng đợi Waitlist đang sẵn sàng tiếp nhận hành khách bổ sung khi có người hủy.
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-[11px] font-bold">
            {waitlistQueue.length} khách trong hàng đợi
          </span>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng đăng ký xác nhận */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Đã Đăng Ký (Confirmed)</span>
            <UserCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalConfirmed} <span className="text-xs font-normal text-slate-400">/ {maxCap}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${occupancyPct}%` }} />
          </div>
        </div>

        {/* KPI 2: Còn trống */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Suất Khả Dụng</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {remaining} <span className="text-xs font-normal text-slate-400">chỗ trống</span>
          </div>
          <p className="text-[11px] text-slate-400">Tỷ lệ lấp đầy: {occupancyPct}%</p>
        </div>

        {/* KPI 3: Hàng đợi Waitlist */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Danh Sách Chờ (Waitlist)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {waitlistQueue.length} <span className="text-xs font-normal text-slate-400">hành khách</span>
          </div>
          <p className="text-[11px] text-slate-400">Tự động đôn suất theo thứ tự FIFO</p>
        </div>

        {/* KPI 4: Doanh thu tạm tính */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Doanh Thu Tạm Tính</span>
            <CreditCard className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {estimatedRevenue > 0 ? `${estimatedRevenue.toLocaleString('vi-VN')}` : '0'}{' '}
            <span className="text-xs font-normal text-slate-400">VND</span>
          </div>
          <p className="text-[11px] text-slate-400">Đơn giá: {activity?.price ? `${activity.price.toLocaleString('vi-VN')} VND` : 'Miễn phí'}</p>
        </div>
      </div>

      {/* Tabs Selection: Roster vs Waitlist */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'roster'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
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
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
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
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên khách, số cabin..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(0);
                }}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 w-52"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Mã ĐK</th>
                  <th className="px-5 py-3.5 font-bold">Hành Khách</th>
                  <th className="px-5 py-3.5 font-bold">Số Cabin</th>
                  <th className="px-5 py-3.5 font-bold">Gói Tour</th>
                  <th className="px-5 py-3.5 font-bold">Trạng Thái</th>
                  <th className="px-5 py-3.5 font-bold">Số Tiền</th>
                  <th className="px-5 py-3.5 font-bold">Giao Dịch Folio</th>
                  <th className="px-5 py-3.5 font-bold">Thời Gian ĐK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {rosterData.content.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Không tìm thấy bản ghi đăng ký nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  rosterData.content.map((item) => (
                    <tr key={item.registrationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-500">#{item.registrationId}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">{item.passengerName}</td>
                      <td className="px-5 py-3.5 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{item.cabinNumber}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{item.tourPackage || 'Tiêu Chuẩn'}</td>
                      <td className="px-5 py-3.5">
                        {item.status === 'CONFIRMED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        )}
                        {item.status === 'WAITLISTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" /> Waitlisted
                          </span>
                        )}
                        {item.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-3 h-3" /> Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {item.chargedAmount > 0 ? `${item.chargedAmount.toLocaleString('vi-VN')} VND` : '0 VND'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{item.transactionId || 'N/A'}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
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
            <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Hiển thị trang {rosterData.number + 1} / {rosterData.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= rosterData.totalPages - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
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
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-500/5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Thứ tự ưu tiên được sắp xếp theo thời gian tham gia hàng đợi (First-In, First-Out).
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Vị Trí (Priority)</th>
                  <th className="px-5 py-3.5 font-bold">Hành Khách</th>
                  <th className="px-5 py-3.5 font-bold">Số Cabin</th>
                  <th className="px-5 py-3.5 font-bold">Thời Gian Xếp Hàng</th>
                  <th className="px-5 py-3.5 font-bold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {waitlistQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Hiện tại không có hành khách nào trong danh sách chờ.
                    </td>
                  </tr>
                ) : (
                  waitlistQueue.map((item) => (
                    <tr key={item.registrationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-xs font-mono">
                          {item.position}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">{item.passengerName}</td>
                      <td className="px-5 py-3.5 font-mono text-cyan-600 dark:text-cyan-400 font-bold">{item.cabinNumber}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(item.registeredAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={promotingWaitlistId === item.registrationId}
                          onClick={() => handlePromoteWaitlist(item.registrationId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] shadow-sm transition-all disabled:opacity-50"
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
