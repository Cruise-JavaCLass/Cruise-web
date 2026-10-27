import React, { useState, useEffect, useCallback, useRef } from 'react';
import type {
  OperationalReportQuery,
  OperationalReportResponse,
  ReportDimension,
  ExportFormat,
} from '../../services/reportTypes';
import { operationalReportService } from '../../services/operationalReportService';

interface OperationalReportDashboardProps {
  onOpenExportDrawer?: (query: OperationalReportQuery) => void;
}

export const OperationalReportDashboard: React.FC<OperationalReportDashboardProps> = ({
  onOpenExportDrawer,
}) => {
  const [query, setQuery] = useState<OperationalReportQuery>({
    dimension: 'OUTLET',
  });
  const [report, setReport] = useState<OperationalReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('CSV');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const fetchGenerationRef = useRef(0);

  const fetchReport = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    setReport(null);
    try {
      const data = await operationalReportService.getRevenueReport(query);
      if (generation !== fetchGenerationRef.current) return;
      setReport(data);
    } catch (err: unknown) {
      if (generation !== fetchGenerationRef.current) return;
      const msg = err instanceof Error ? err.message : 'Không thể tải báo cáo doanh thu';
      setErrorMessage(msg);
    } finally {
      if (generation === fetchGenerationRef.current) {
        setIsLoading(false);
      }
    }
  }, [query]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsExporting(true);
      setErrorMessage(null);
      setExportMessage(null);
      await operationalReportService.createExportJob({
        format,
        reportTitle: `Revenue Report (${query.dimension || 'OUTLET'})`,
        query,
      });
      setExportMessage(`Đã khởi tạo tác vụ xuất báo cáo ${format} thành công.`);
      if (onOpenExportDrawer) {
        onOpenExportDrawer(query);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi khởi tạo tác vụ xuất báo cáo';
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Query Filter Bar */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 shadow-xs space-y-4">
        {isLoading && (
          <div className="text-xs text-[#102A43] font-medium uppercase tracking-wider animate-pulse">
            Đang tải dữ liệu báo cáo...
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E0D7] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/40 tracking-wider">
                REVENUE INTELLIGENCE
              </span>
              <span className="text-[11px] font-medium text-[#687787]">• MULTI-DIMENSIONAL AUDIT</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#102A43]">Báo Cáo Doanh Thu & Vận Hành POS</h2>
            <p className="text-xs text-[#687787] mt-1">Phân tích đa chiều theo điểm bán, phương thức thanh toán</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Định dạng xuất file"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
              className="text-xs font-semibold bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg py-2 px-3 text-[#252B32] focus:outline-none focus:border-[#102A43]"
            >
              <option value="CSV">CSV</option>
              <option value="EXCEL">EXCEL</option>
              <option value="PDF">PDF</option>
            </select>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport(selectedFormat)}
              className="py-2 px-4 text-xs font-semibold bg-[#102A43] hover:bg-[#183B5B] text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              📥 {isExporting ? 'Đang tạo...' : `Xuất Báo Cáo (${selectedFormat})`}
            </button>
            {onOpenExportDrawer && (
              <button
                type="button"
                onClick={() => onOpenExportDrawer(query)}
                className="py-2 px-3 text-xs font-semibold bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                📂 Khay Tải
              </button>
            )}
          </div>
        </div>

        {exportMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 rounded-xl shadow-xs">
            {exportMessage}
          </div>
        )}

        {/* Filter Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label htmlFor="report-filter-dimension" className="block font-semibold text-[#252B32] uppercase mb-1.5 text-[11px]">
              Chiều phân tích
            </label>
            <select
              id="report-filter-dimension"
              value={query.dimension}
              onChange={(e) => setQuery({ ...query, dimension: e.target.value as ReportDimension })}
              className="w-full text-xs font-semibold bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg p-2.5 text-[#252B32] focus:outline-none focus:border-[#102A43]"
            >
              <option value="OUTLET">Theo Điểm Bán (Outlet / Station)</option>
              <option value="PAYMENT_METHOD">Theo Phương Thức Thanh Toán</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-filter-payment" className="block font-semibold text-[#252B32] uppercase mb-1.5 text-[11px]">
              Phương thức thanh toán
            </label>
            <select
              id="report-filter-payment"
              value={query.paymentMethod || ''}
              onChange={(e) => setQuery({ ...query, paymentMethod: e.target.value || undefined })}
              className="w-full text-xs font-semibold bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg p-2.5 text-[#252B32] focus:outline-none focus:border-[#102A43]"
            >
              <option value="">Tất cả phương thức</option>
              <option value="CABIN_FOLIO">Tài khoản Cabin Folio</option>
              <option value="CREDIT_CARD">Thẻ Tín Dụng</option>
              <option value="CASH">Tiền Mặt</option>
              <option value="VIETQR">Chuyển Khoản VietQR</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-filter-start-date" className="block font-semibold text-[#252B32] uppercase mb-1.5 text-[11px]">
              Từ ngày
            </label>
            <input
              id="report-filter-start-date"
              type="date"
              value={query.startDate || ''}
              onChange={(e) => setQuery({ ...query, startDate: e.target.value || undefined })}
              className="w-full text-xs font-semibold bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg p-2.5 text-[#252B32] focus:outline-none focus:border-[#102A43]"
            />
          </div>

          <div>
            <label htmlFor="report-filter-end-date" className="block font-semibold text-[#252B32] uppercase mb-1.5 text-[11px]">
              Đến ngày
            </label>
            <input
              id="report-filter-end-date"
              type="date"
              value={query.endDate || ''}
              onChange={(e) => setQuery({ ...query, endDate: e.target.value || undefined })}
              className="w-full text-xs font-semibold bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg p-2.5 text-[#252B32] focus:outline-none focus:border-[#102A43]"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end pt-2">
            <button
              type="button"
              onClick={() => void fetchReport()}
              className="py-2 px-6 text-xs font-semibold bg-[#102A43] hover:bg-[#183B5B] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Áp Dụng Bộ Lọc
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-xl shadow-xs">
          {errorMessage}
        </div>
      )}

      {/* KPI Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Tổng doanh thu gộp</span>
            <div className="text-2xl font-serif font-bold text-[#102A43] mt-1">
              ${report.totalGrossRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Doanh thu thuần (Net)</span>
            <div className="text-2xl font-serif font-bold text-[#102A43] mt-1">
              ${report.totalNetRevenue.toFixed(2)}
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Tổng số giao dịch</span>
            <div className="text-2xl font-serif font-bold text-[#102A43] mt-1">
              {report.totalTransactionCount}
            </div>
          </div>

          <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
            <span className="text-[10px] font-semibold text-[#687787] uppercase tracking-wider">Giá trị đơn trung bình</span>
            <div className="text-2xl font-serif font-bold text-[#102A43] mt-1">
              ${report.averageTicketSize.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {report && (
        <div className="bg-white border border-[#E5E0D7] rounded-xl overflow-hidden shadow-xs">
          <div className="border-b border-[#E5E0D7] bg-[#F7F4ED] px-6 py-3.5 text-xs font-serif font-bold text-[#102A43]">
            Chi tiết phân rã số liệu
          </div>
          <table className="min-w-full text-left text-xs">
            <thead className="bg-[#F7F4ED] text-[10px] font-semibold uppercase text-[#687787] border-b border-[#E5E0D7]">
              <tr>
                <th className="px-6 py-3">Phân loại</th>
                <th className="px-6 py-3">Số lượt giao dịch</th>
                <th className="px-6 py-3">Doanh thu gộp</th>
                <th className="px-6 py-3">Doanh thu thuần</th>
                <th className="px-6 py-3 text-right">Tỷ trọng (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D7] bg-white text-[#252B32]">
              {report.breakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs font-medium text-[#687787]">
                    Không có giao dịch nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                report.breakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-[#102A43]">{row.label}</td>
                    <td className="px-6 py-3 text-[#687787] font-medium">{row.transactionCount}</td>
                    <td className="px-6 py-3 font-bold text-[#252B32]">
                      ${row.grossRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 font-bold text-[#102A43]">
                      ${row.netRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-[#252B32]">
                      {row.revenuePercentage}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default OperationalReportDashboard;
