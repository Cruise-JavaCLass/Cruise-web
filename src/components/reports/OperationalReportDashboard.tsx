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
      <div className="neo-card bg-white p-6 shadow-[6px_6px_0px_#171717] space-y-4">
        {isLoading && (
          <div className="text-xs text-[#3155E7] font-mono font-bold uppercase animate-pulse">
            Đang tải dữ liệu báo cáo...
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#171717] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="neo-badge bg-[#3155E7] text-white">REVENUE INTELLIGENCE</span>
              <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• MULTI-DIMENSIONAL AUDIT</span>
            </div>
            <h2 className="text-xl font-display font-black text-[#171717] uppercase tracking-tight">Báo Cáo Doanh Thu & Vận Hành POS</h2>
            <p className="text-xs font-mono text-[#171717]/70 mt-1">Phân tích đa chiều theo điểm bán, phương thức thanh toán</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Định dạng xuất file"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
              className="neo-input text-xs font-mono font-bold bg-[#F7F5F0] py-2 px-3"
            >
              <option value="CSV">CSV</option>
              <option value="EXCEL">EXCEL</option>
              <option value="PDF">PDF</option>
            </select>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport(selectedFormat)}
              className="neo-btn neo-btn-acid py-2 px-4 text-xs font-mono font-bold disabled:opacity-50"
            >
              📥 {isExporting ? 'Đang tạo...' : `Xuất Báo Cáo (${selectedFormat})`}
            </button>
            {onOpenExportDrawer && (
              <button
                type="button"
                onClick={() => onOpenExportDrawer(query)}
                className="neo-btn neo-btn-secondary py-2 px-3 text-xs font-mono font-bold"
              >
                📂 Khay Tải
              </button>
            )}
          </div>
        </div>

        {exportMessage && (
          <div className="p-3 bg-[#D9FF43] border-2 border-[#171717] text-xs font-mono font-bold text-[#171717] shadow-[2px_2px_0px_#171717]">
            {exportMessage}
          </div>
        )}

        {/* Filter Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label htmlFor="report-filter-dimension" className="block font-mono font-bold text-[#171717] uppercase mb-1.5">
              Chiều phân tích
            </label>
            <select
              id="report-filter-dimension"
              value={query.dimension}
              onChange={(e) => setQuery({ ...query, dimension: e.target.value as ReportDimension })}
              className="neo-input w-full text-xs font-mono font-bold bg-[#F7F5F0] p-2"
            >
              <option value="OUTLET">Theo Điểm Bán (Outlet / Station)</option>
              <option value="PAYMENT_METHOD">Theo Phương Thức Thanh Toán</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-filter-payment" className="block font-mono font-bold text-[#171717] uppercase mb-1.5">
              Phương thức thanh toán
            </label>
            <select
              id="report-filter-payment"
              value={query.paymentMethod || ''}
              onChange={(e) => setQuery({ ...query, paymentMethod: e.target.value || undefined })}
              className="neo-input w-full text-xs font-mono font-bold bg-[#F7F5F0] p-2"
            >
              <option value="">Tất cả phương thức</option>
              <option value="CABIN_FOLIO">Tài khoản Cabin Folio</option>
              <option value="CREDIT_CARD">Thẻ Tín Dụng</option>
              <option value="CASH">Tiền Mặt</option>
              <option value="VIETQR">Chuyển Khoản VietQR</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-filter-start-date" className="block font-mono font-bold text-[#171717] uppercase mb-1.5">
              Từ ngày
            </label>
            <input
              id="report-filter-start-date"
              type="date"
              value={query.startDate || ''}
              onChange={(e) => setQuery({ ...query, startDate: e.target.value || undefined })}
              className="neo-input w-full text-xs font-mono font-bold bg-[#F7F5F0] p-2"
            />
          </div>

          <div>
            <label htmlFor="report-filter-end-date" className="block font-mono font-bold text-[#171717] uppercase mb-1.5">
              Đến ngày
            </label>
            <input
              id="report-filter-end-date"
              type="date"
              value={query.endDate || ''}
              onChange={(e) => setQuery({ ...query, endDate: e.target.value || undefined })}
              className="neo-input w-full text-xs font-mono font-bold bg-[#F7F5F0] p-2"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end pt-2">
            <button
              type="button"
              onClick={() => void fetchReport()}
              className="neo-btn neo-btn-primary py-2 px-6 text-xs font-mono font-bold"
            >
              Áp Dụng Bộ Lọc
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#DC2626] border-2 border-[#171717] text-white text-xs font-mono font-bold shadow-[4px_4px_0px_#171717]">
          {errorMessage}
        </div>
      )}

      {/* KPI Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="neo-card bg-white p-4">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Tổng doanh thu gộp</span>
            <div className="text-2xl font-display font-black text-[#171717] mt-1">
              ${report.totalGrossRevenue.toFixed(2)}
            </div>
          </div>

          <div className="neo-card bg-white p-4">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Doanh thu thuần (Net)</span>
            <div className="text-2xl font-display font-black text-[#3155E7] mt-1">
              ${report.totalNetRevenue.toFixed(2)}
            </div>
          </div>

          <div className="neo-card bg-white p-4">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Tổng số giao dịch</span>
            <div className="text-2xl font-display font-black text-[#171717] mt-1">
              {report.totalTransactionCount}
            </div>
          </div>

          <div className="neo-card bg-white p-4">
            <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">Giá trị đơn trung bình</span>
            <div className="text-2xl font-display font-black text-[#3155E7] mt-1">
              ${report.averageTicketSize.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {report && (
        <div className="neo-card bg-white overflow-hidden shadow-[6px_6px_0px_#171717]">
          <div className="border-b-2 border-[#171717] bg-[#E7E4DC] px-6 py-3.5 text-xs font-display font-black uppercase tracking-wider text-[#171717]">
            Chi tiết phân rã số liệu
          </div>
          <table className="min-w-full text-left text-xs font-mono">
            <thead className="bg-white text-[10px] font-bold uppercase text-[#171717] border-b-2 border-[#171717]">
              <tr>
                <th className="px-6 py-3">Phân loại</th>
                <th className="px-6 py-3">Số lượt giao dịch</th>
                <th className="px-6 py-3">Doanh thu gộp</th>
                <th className="px-6 py-3">Doanh thu thuần</th>
                <th className="px-6 py-3 text-right">Tỷ trọng (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#171717] bg-white text-[#171717]">
              {report.breakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs font-bold text-[#171717]/60">
                    Không có giao dịch nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                report.breakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F5F0] transition-colors">
                    <td className="px-6 py-3 font-bold text-[#171717]">{row.label}</td>
                    <td className="px-6 py-3 font-semibold text-[#171717]/80">{row.transactionCount}</td>
                    <td className="px-6 py-3 font-black text-[#171717]">
                      ${row.grossRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 font-black text-[#3155E7]">
                      ${row.netRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-black text-[#171717]">
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
