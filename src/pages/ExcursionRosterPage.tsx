import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchExcursionRoster,
  fetchExcursionWaitlist,
  exportExcursionRosterCsv,
  sendScheduleChangeAlert,
  type ExcursionRosterSummary,
  type ExcursionPassengerRosterItem,
  type ExcursionWaitlistEntry,
} from '../services/excursionService';
import { WaitlistModal, MedicalWaiverModal } from '../components/excursions/WaitlistAndWaiverModals';

export const ExcursionRosterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const excursionId = id ? parseInt(id, 10) : 1;

  const [rosterData, setRosterData] = useState<ExcursionRosterSummary | null>(null);
  const [waitlist, setWaitlist] = useState<ExcursionWaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [specialOnly, setSpecialOnly] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const requestIdRef = useRef<number>(0);

  // Modals state
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [waiverTarget, setWaiverTarget] = useState<ExcursionPassengerRosterItem | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isAlertUrgent, setIsAlertUrgent] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      const rosterPromise = fetchExcursionRoster(excursionId, {
        search: searchQuery || undefined,
        bookingStatus: statusFilter !== 'ALL' ? statusFilter : undefined,
        specialAssistance: specialOnly ? true : undefined,
        page,
        size: 20,
      });

      const waitlistPromise = fetchExcursionWaitlist(excursionId);

      const [rosterResult, waitlistResult] = await Promise.allSettled([
        rosterPromise,
        waitlistPromise,
      ]);

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (rosterResult.status === 'fulfilled') {
        setRosterData(rosterResult.value);
      } else {
        setRosterData(null);
        setNotificationMsg({
          type: 'error',
          text: rosterResult.reason instanceof Error ? rosterResult.reason.message : 'Lỗi khi tải danh sách đăng ký tour bờ',
        });
      }

      if (waitlistResult.status === 'fulfilled') {
        setWaitlist(waitlistResult.value);
        setWaitlistError(null);
      } else {
        setWaitlist([]);
        setWaitlistError(waitlistResult.reason instanceof Error ? waitlistResult.reason.message : 'Danh sách chờ tạm thời không khả dụng');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [excursionId, searchQuery, statusFilter, specialOnly, page]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, specialOnly]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleExportCsv = async () => {
    try {
      const blob = await exportExcursionRosterCsv(excursionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `excursion-${excursionId}-roster.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setNotificationMsg({ type: 'success', text: 'Xuất danh sách CSV thành công!' });
    } catch {
      setNotificationMsg({ type: 'error', text: 'Có lỗi khi xuất file CSV' });
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;

    setIsSendingAlert(true);
    try {
      const res = await sendScheduleChangeAlert(excursionId, {
        title: alertTitle.trim(),
        message: alertMessage.trim(),
        isUrgent: isAlertUrgent,
      });
      setNotificationMsg({
        type: 'success',
        text: `Đã phát cảnh báo thành công tới ${res.recipientsCount} hành khách!`,
      });
      setIsAlertModalOpen(false);
      setAlertTitle('');
      setAlertMessage('');
    } catch {
      setNotificationMsg({ type: 'error', text: 'Có lỗi khi phát thông báo cảnh báo' });
    } finally {
      setIsSendingAlert(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#252B32] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E5E0D7]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#687787] mb-1">
              <button onClick={() => navigate('/excursions')} className="hover:text-[#102A43] transition cursor-pointer">
                Tours Trên Bờ
              </button>
              <span>/</span>
              <span className="text-[#252B32] font-medium">Điều Hành Danh Sách Roster</span>
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#102A43] flex items-center gap-2.5">
              <span>📋</span> Trung Tâm Điều Hành Roster & Manifest Tour
            </h1>
            <p className="text-xs text-[#687787] mt-1">
              {rosterData?.excursionTitle || 'Hạ Long Bay Exploration'} (ID #{excursionId})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsWaitlistOpen(true)}
              className="px-3.5 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#C5A572]/50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>⏳</span> Danh Sách Chờ {waitlistError ? '(Không khả dụng)' : `(${waitlist.length})`}
            </button>
            <button
              onClick={() => setIsAlertModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>📢</span> Phát Cảnh Báo Lịch Trình
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>📥</span> Xuất CSV Roster
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {notificationMsg && (
          <div
            className={`p-3.5 rounded-xl border text-sm flex items-center justify-between shadow-xs ${
              notificationMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{notificationMsg.text}</span>
            <button
              onClick={() => setNotificationMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E0D7] p-4 rounded-xl shadow-xs">
            <div className="text-xs text-[#687787] font-medium">Đã Xác Nhận (Confirmed)</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
              {rosterData?.confirmedCount || 0}
              <span className="text-xs text-[#687787] font-normal"> / {rosterData?.maxCapacity || 50} chỗ</span>
            </div>
          </div>
          <div className="bg-white border border-[#E5E0D7] p-4 rounded-xl shadow-xs">
            <div className="text-xs text-[#687787] font-medium">Danh Sách Chờ (Waitlist)</div>
            {waitlistError ? (
              <div className="text-sm font-semibold text-rose-600 mt-2">Không khả dụng</div>
            ) : (
              <div className="text-2xl font-bold text-amber-700 mt-1 tabular-nums">{waitlist.length}</div>
            )}
          </div>
          <div className="bg-white border border-[#E5E0D7] p-4 rounded-xl shadow-xs">
            <div className="text-xs text-[#687787] font-medium">Đã Check-In</div>
            <div className="text-2xl font-bold text-[#102A43] mt-1 tabular-nums">{rosterData?.checkedInCount || 0}</div>
          </div>
          <div className="bg-white border border-[#E5E0D7] p-4 rounded-xl shadow-xs">
            <div className="text-xs text-[#687787] font-medium">Nhu Cầu Đặc Biệt (Assistance)</div>
            <div className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{rosterData?.specialAssistanceCount || 0}</div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white border border-[#E5E0D7] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên khách, số phòng cabin hoặc mã vé..."
              className="w-full bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg px-4 py-2 text-xs text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/15 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg px-3 py-2 text-xs text-[#252B32] font-semibold focus:outline-none focus:border-[#102A43]"
            >
              <option value="ALL">Mọi Trạng Thái</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="WAITLISTED">Waitlisted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-[#252B32] select-none bg-[#F7F4ED]/60 px-3 py-2 rounded-lg border border-[#E5E0D7]">
              <input
                type="checkbox"
                checked={specialOnly}
                onChange={(e) => setSpecialOnly(e.target.checked)}
                className="rounded border-[#E5E0D7] text-[#102A43] focus:ring-0"
              />
              <span>♿ Nhu cầu đặc biệt</span>
            </label>
          </div>
        </div>

        {/* Table Roster */}
        <div className="bg-white border border-[#E5E0D7] rounded-xl overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="py-16 text-center text-[#687787] text-sm animate-pulse">
              Đang tải danh sách điều phối...
            </div>
          ) : !rosterData || rosterData.items.length === 0 ? (
            <div className="py-16 text-center text-[#687787]">
              <p className="text-base font-semibold text-[#102A43] font-serif">Không tìm thấy hành khách nào phù hợp</p>
              <p className="text-xs text-[#687787] mt-1">Hãy thử xóa bộ lọc tìm kiếm hoặc nới lỏng điều kiện lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E0D7] bg-[#F7F4ED] text-[#687787] uppercase font-semibold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Mã Vé & Hành Khách</th>
                    <th className="py-3 px-4">Cabin</th>
                    <th className="py-3 px-4">Phương Tiện / Nhóm</th>
                    <th className="py-3 px-4">Trạng Thái Đặt Chỗ</th>
                    <th className="py-3 px-4">Điểm Danh Tour</th>
                    <th className="py-3 px-4">Nhu Cầu Đặc Biệt</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D7] text-[#252B32]">
                  {rosterData.items.map((passenger) => (
                    <tr key={passenger.id} className="hover:bg-[#F7F4ED]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#102A43]">{passenger.passengerName}</div>
                        <div className="text-[11px] text-[#397C80] font-mono mt-0.5">{passenger.ticketCode}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-mono font-semibold bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7]">
                          {passenger.cabinNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#252B32]">{passenger.busNumber || 'Chưa xếp xe'}</div>
                        <div className="text-[11px] text-[#687787]">{passenger.groupName || 'Nhóm chung'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                            passenger.bookingStatus === 'CONFIRMED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : passenger.bookingStatus === 'WAITLISTED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {passenger.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[#252B32] font-medium">
                          {passenger.status === 'CHECKED_IN' ? '✅ Đã Check-in' : passenger.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {passenger.needsSpecialAssistance ? (
                          <span className="text-amber-800 font-semibold flex items-center gap-1">
                            ♿ {passenger.specialRequirements}
                          </span>
                        ) : (
                          <span className="text-[#687787]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setWaiverTarget(passenger)}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-[#E5E0D7] rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          Miễn Phạt Y Tế
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rosterData && rosterData.totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]/60">
              <span className="text-xs text-[#687787]">
                Trang <strong className="text-[#102A43]">{page + 1}</strong> / <strong className="text-[#102A43]">{rosterData.totalPages}</strong> ({rosterData.totalElements} hành khách)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] disabled:opacity-40 disabled:cursor-not-allowed text-xs text-[#252B32] font-medium rounded-lg transition cursor-pointer"
                >
                  Trang Trước
                </button>
                <button
                  type="button"
                  disabled={page >= rosterData.totalPages - 1}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="px-3 py-1.5 bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] disabled:opacity-40 disabled:cursor-not-allowed text-xs text-[#252B32] font-medium rounded-lg transition cursor-pointer"
                >
                  Trang Kế
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Waitlist Modal */}
        <WaitlistModal
          isOpen={isWaitlistOpen}
          onClose={() => setIsWaitlistOpen(false)}
          excursionId={excursionId}
          excursionTitle={rosterData?.excursionTitle || ''}
          waitlist={waitlist}
          onPromoted={() => void loadData()}
        />

        {/* Medical Waiver Modal */}
        <MedicalWaiverModal
          isOpen={Boolean(waiverTarget)}
          onClose={() => setWaiverTarget(null)}
          booking={waiverTarget}
          onCancelled={() => void loadData()}
        />

        {/* Alert Broadcast Modal */}
        {isAlertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
            <div className="bg-white border border-[#E5E0D7] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden text-[#252B32]">
              <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex justify-between items-center">
                <h3 className="text-base font-serif font-bold text-[#102A43] flex items-center gap-2">
                  <span>📢</span> Phát Cảnh Báo Lịch Trình Tour Bờ
                </h3>
                <button onClick={() => setIsAlertModalOpen(false)} className="text-[#687787] hover:text-[#102A43] cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleBroadcastAlert} className="p-6 space-y-4">
                <div>
                  <label htmlFor="alert-title-input" className="block text-xs font-semibold text-[#687787] uppercase mb-1">Tiêu Đề Thông Báo</label>
                  <input
                    id="alert-title-input"
                    type="text"
                    required
                    value={alertTitle}
                    onChange={(e) => setAlertTitle(e.target.value)}
                    placeholder="Ví dụ: Đổi cửa tập trung hoặc cập nhật thời gian đón..."
                    className="w-full bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg px-3 py-2 text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/15"
                  />
                </div>

                <div>
                  <label htmlFor="alert-msg-input" className="block text-xs font-semibold text-[#687787] uppercase mb-1">Nội Dung Chi Tiết</label>
                  <textarea
                    id="alert-msg-input"
                    rows={3}
                    required
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="Nội dung sẽ hiển thị ngay trong Notification Center của toàn bộ khách đăng ký..."
                    className="w-full bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg p-3 text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/15"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#252B32] select-none">
                  <input
                    type="checkbox"
                    checked={isAlertUrgent}
                    onChange={(e) => setIsAlertUrgent(e.target.checked)}
                    className="rounded border-[#E5E0D7] text-rose-600 focus:ring-0"
                  />
                  <span>Đánh dấu là thông báo Khẩn Cấp (Critical Category)</span>
                </label>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAlertModalOpen(false)}
                    className="px-3.5 py-1.5 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingAlert}
                    className="px-4 py-1.5 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingAlert ? 'Đang gửi...' : 'Phát Thông Báo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcursionRosterPage;
