import React, { useState, useEffect } from 'react';
import type { ShiftSummaryResponse } from '../../services/posService';
import { posService } from '../../services/posService';
import { FileText, Printer, X, Lock, Loader2, AlertCircle } from 'lucide-react';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: number;
}

export const ShiftSummaryModal: React.FC<ShiftSummaryModalProps> = ({ isOpen, onClose, shiftId }) => {
  const [summary, setSummary] = useState<ShiftSummaryResponse | null>(null);
  const [reportType, setReportType] = useState<'X_REPORT' | 'Z_REPORT'>('X_REPORT');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [managerId, setManagerId] = useState('MANAGER-LE');
  const [endingCash, setEndingCash] = useState<number>(500);

  useEffect(() => {
    if (isOpen && shiftId) {
      void loadSummary();
    }
  }, [isOpen, shiftId, reportType]);

  const loadSummary = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await posService.getShiftSummary(shiftId, reportType);
      setSummary(data);
      if (data.endingCash != null) {
        setEndingCash(data.endingCash);
      }
    } catch (err: unknown) {
      setSummary(null);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tải báo cáo ca làm việc!';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseShift = async () => {
    setIsClosingShift(true);
    setCloseError(null);
    try {
      await posService.closeShift(shiftId, managerId, endingCash);
      setReportType('Z_REPORT');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi chốt quyết toán ca làm việc!';
      setCloseError(msg);
    } finally {
      setIsClosingShift(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-2 text-[#C5A572]">
            <FileText className="w-5 h-5 text-[#C5A572]" />
            <h3 className="font-serif font-bold text-[#102A43] text-base">
              Báo Cáo Ca POS ({reportType === 'Z_REPORT' ? 'Z-Report Chốt Ca' : 'X-Report Tạm Tính'})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-[#252B32] overflow-y-auto max-h-[75vh]">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-[#687787] gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#102A43]" />
              <span>Đang tải số liệu ca làm việc...</span>
            </div>
          )}

          {loadError && !isLoading && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loadError}</span>
            </div>
          )}

          {summary && !isLoading && (
            <>
              {/* Shift status & report selector */}
              <div className="flex justify-between items-center bg-[#F7F4ED] p-3 rounded-xl border border-[#E5E0D7]">
                <div>
                  <p className="text-[#102A43] font-bold">
                    Ca #{summary.shiftId} • {summary.stationId}
                  </p>
                  <p className="text-[11px] text-[#687787]">
                    Mở lúc: {summary.openedAt ? new Date(summary.openedAt).toLocaleString('vi-VN') : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setReportType('X_REPORT')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      reportType === 'X_REPORT' ? 'bg-[#102A43] text-white shadow-xs' : 'bg-white border border-[#E5E0D7] text-[#687787] hover:text-[#102A43]'
                    }`}
                  >
                    X-Report
                  </button>
                  <button
                    onClick={() => setReportType('Z_REPORT')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      reportType === 'Z_REPORT' ? 'bg-[#102A43] text-white shadow-xs' : 'bg-white border border-[#E5E0D7] text-[#687787] hover:text-[#102A43]'
                    }`}
                  >
                    Z-Report
                  </button>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#F7F4ED]/50 p-3 rounded-xl border border-[#E5E0D7] text-center">
                  <span className="text-[11px] text-[#687787] block">Tiền Đầu Ca</span>
                  <span className="text-base font-extrabold text-[#102A43] font-mono">
                    ${summary.startingCash?.toFixed(2)}
                  </span>
                </div>
                <div className="bg-[#F7F4ED]/50 p-3 rounded-xl border border-[#E5E0D7] text-center">
                  <span className="text-[11px] text-[#687787] block">Doanh Thu</span>
                  <span className="text-base font-extrabold text-emerald-700 font-mono">
                    ${summary.totalSales?.toFixed(2)}
                  </span>
                </div>
                <div className="bg-[#F7F4ED]/50 p-3 rounded-xl border border-[#E5E0D7] text-center">
                  <span className="text-[11px] text-[#687787] block">Tiền Hủy/Hoàn</span>
                  <span className="text-base font-extrabold text-rose-700 font-mono">
                    -${summary.totalRefunds?.toFixed(2)}
                  </span>
                </div>
                <div className="bg-[#F7F4ED]/50 p-3 rounded-xl border border-[#E5E0D7] text-center">
                  <span className="text-[11px] text-[#687787] block">Doanh Số Ròng</span>
                  <span className="text-base font-extrabold text-[#8C6D37] font-mono">
                    ${summary.netRevenue?.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Breakdown by Payment Method */}
              <div className="bg-[#F7F4ED]/30 p-4 rounded-xl border border-[#E5E0D7] space-y-2">
                <h4 className="font-bold text-[#102A43] text-xs uppercase tracking-wider">
                  Phân Bổ Doanh Thu Theo Phương Thức
                </h4>
                <div className="divide-y divide-[#E5E0D7]">
                  {Object.entries(summary.revenueByPaymentMethod || {}).map(([method, amt]) => (
                    <div key={method} className="py-1.5 flex justify-between items-center text-xs">
                      <span className="text-[#252B32]">{method}</span>
                      <span className="font-bold text-[#102A43] font-mono">${amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown by Category */}
              <div className="bg-[#F7F4ED]/30 p-4 rounded-xl border border-[#E5E0D7] space-y-2">
                <h4 className="font-bold text-[#102A43] text-xs uppercase tracking-wider">
                  Phân Bổ Doanh Thu Theo Danh Mục Mặt Hàng
                </h4>
                <div className="divide-y divide-[#E5E0D7]">
                  {Object.entries(summary.revenueByCategory || {}).map(([category, amt]) => (
                    <div key={category} className="py-1.5 flex justify-between items-center text-xs">
                      <span className="text-[#252B32]">{category}</span>
                      <span className="font-bold text-[#102A43] font-mono">${amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Shift Section if still OPEN */}
              {summary.status === 'OPEN' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                    <Lock className="w-4 h-4 text-[#8C6D37]" /> Niêm Phong & Chốt Ca (Z-Report)
                  </div>
                  <p className="text-[11px] text-[#687787]">
                    Thao tác này sẽ khóa toàn bộ giao dịch trong ca và niêm phong số liệu doanh thu gửi về kế toán tàu.
                  </p>
                  <div className="flex gap-2 pt-1 flex-wrap items-center">
                    <div>
                      <label htmlFor="shift-manager-id" className="text-[10px] text-[#687787] block mb-0.5">Mã Quản lý:</label>
                      <input
                        id="shift-manager-id"
                        type="text"
                        placeholder="Mã Quản lý"
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value.toUpperCase())}
                        className="w-32 px-2.5 py-1.5 bg-white border border-[#E5E0D7] rounded-lg text-[#252B32] font-mono text-xs focus:outline-none focus:border-[#102A43]"
                      />
                    </div>
                    <div>
                      <label htmlFor="shift-ending-cash" className="text-[10px] text-[#687787] block mb-0.5">Tiền mặt kết ca ($):</label>
                      <input
                        id="shift-ending-cash"
                        type="number"
                        placeholder="Tiền mặt kết ca"
                        value={endingCash}
                        onChange={(e) => setEndingCash(Number(e.target.value))}
                        className="w-36 px-2.5 py-1.5 bg-white border border-[#E5E0D7] rounded-lg text-[#252B32] font-mono text-xs focus:outline-none focus:border-[#102A43]"
                      />
                    </div>
                    <button
                      onClick={handleCloseShift}
                      disabled={isClosingShift || !managerId.trim()}
                      className="mt-4 px-4 py-1.5 bg-[#102A43] hover:bg-[#183B5B] disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      {isClosingShift ? 'Đang đóng...' : 'Xác Nhận Đóng Ca'}
                    </button>
                  </div>
                  {closeError && (
                    <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-2 rounded-lg text-rose-800 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{closeError}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F7F4ED]/50 border-t border-[#E5E0D7] flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" /> In Báo Cáo
          </button>
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#102A43] hover:bg-[#183B5B] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
