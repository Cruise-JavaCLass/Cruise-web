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
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        {isLoading && (
          <div className="text-xs text-indigo-600 font-medium animate-pulse">
            Đang tải dữ liệu báo cáo...
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Báo Cáo Doanh Thu & Vận Hành POS</h2>
            <p className="text-xs text-gray-500">Phân tích đa chiều theo điểm bán, phương thức thanh toán</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Định dạng xuất file"
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white font-medium text-gray-700"
            >
              <option value="CSV">CSV</option>
              <option value="EXCEL">EXCEL</option>
              <option value="PDF">PDF</option>
            </select>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport(selectedFormat)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              📥 {isExporting ? 'Đang tạo...' : `Xuất Báo Cáo (${selectedFormat})`}
            </button>
            {onOpenExportDrawer && (
              <button
                type="button"
                onClick={() => onOpenExportDrawer(query)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                📂 Khay Tải
              </button>
            )}
          </div>
        </div>

        {exportMessage && (
          <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            {exportMessage}
          </div>
        )}

        {/* Filter Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label htmlFor="report-filter-dimension" className="block font-semibold text-gray-600 mb-1">
              Chiều phân tích
            </label>
            <select
              id="report-filter-dimension"
              value={query.dimension}
              onChange={(e) => setQuery({ ...query, dimension: e.target.value as ReportDimension })}
              className="w-full rounded-xl border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="OUTLET">Theo Điểm Bán (Outlet / Station)</option>
              <option value="PAYMENT_METHOD">Theo Phương Thức Thanh Toán</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-filter-payment" className="block font-semibold text-gray-600 mb-1">
              Phương thức thanh toán
            </label>
            <select
              id="report-filter-payment"
              value={query.paymentMethod || ''}
              onChange={(e) => setQuery({ ...query, paymentMethod: e.target.value || undefined })}
              className="w-full rounded-xl border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Tất cả phương thức</option>
              <option value="CABIN_FOLIO">Tài khoản Cabin Folio</option>
              <option value="CREDIT_CARD">Thẻ Tín Dụng</option>
              <option value="CASH">Tiền Mặt</option>
              <option value="VIETQR">Chuyển Khoản VietQR</option>
            </select>
          </div>

          <div>
            <label htmlFor="report-filter-start-date" className="block font-semibold text-gray-600 mb-1">
              Từ ngày
            </label>
            <input
              id="report-filter-start-date"
              type="date"
              value={query.startDate || ''}
              onChange={(e) => setQuery({ ...query, startDate: e.target.value || undefined })}
              className="w-full rounded-xl border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="report-filter-end-date" className="block font-semibold text-gray-600 mb-1">
              Đến ngày
            </label>
            <input
              id="report-filter-end-date"
              type="date"
              value={query.endDate || ''}
              onChange={(e) => setQuery({ ...query, endDate: e.target.value || undefined })}
              className="w-full rounded-xl border border-gray-300 p-2 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4 flex justify-end">
            <button
              type="button"
              onClick={() => void fetchReport()}
              className="rounded-xl bg-gray-900 px-6 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition"
            >
              Áp Dụng Bộ Lọc
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700 border border-rose-200">
          {errorMessage}
        </div>
      )}

      {/* KPI Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-gray-500">Tổng doanh thu gộp</span>
            <div className="text-xl font-bold text-gray-900 mt-1">
              ${report.totalGrossRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-gray-500">Doanh thu thuần (Net)</span>
            <div className="text-xl font-bold text-emerald-600 mt-1">
              ${report.totalNetRevenue.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-gray-500">Tổng số giao dịch</span>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {report.totalTransactionCount}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <span className="text-xs font-semibold text-gray-500">Giá trị đơn trung bình</span>
            <div className="text-xl font-bold text-indigo-600 mt-1">
              ${report.averageTicketSize.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {report && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-600">
            Chi tiết phân rã số liệu
          </div>
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-3">Phân loại</th>
                <th className="px-6 py-3">Số lượt giao dịch</th>
                <th className="px-6 py-3">Doanh thu gộp</th>
                <th className="px-6 py-3">Doanh thu thuần</th>
                <th className="px-6 py-3 text-right">Tỷ trọng (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {report.breakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                    Không có giao dịch nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                report.breakdown.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-semibold text-gray-900">{row.label}</td>
                    <td className="px-6 py-3 text-gray-600">{row.transactionCount}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      ${row.grossRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 font-semibold text-emerald-600">
                      ${row.netRevenue.toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-indigo-600">
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
