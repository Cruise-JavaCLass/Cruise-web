import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OperationalReportDashboard } from './OperationalReportDashboard';
import { ExportJobTrackerDrawer } from './ExportJobTrackerDrawer';
import { operationalReportService } from '../../services/operationalReportService';
import type { OperationalReportResponse, ReportExportJob } from '../../services/reportTypes';

vi.mock('../../services/operationalReportService', () => ({
  operationalReportService: {
    getRevenueReport: vi.fn(),
    createExportJob: vi.fn(),
    getExportJobs: vi.fn(),
  },
}));

const mockReportData: OperationalReportResponse = {
  totalGrossRevenue: 15450.5,
  totalNetRevenue: 14200.0,
  totalDiscountAmount: 1250.5,
  totalTaxAmount: 0.0,
  totalTransactionCount: 42,
  averageTicketSize: 367.87,
  breakdown: [
    {
      key: 'OUTLET-BAR-01',
      label: 'Main Pool Bar',
      transactionCount: 25,
      grossRevenue: 9500.0,
      netRevenue: 8900.0,
      revenuePercentage: 62.68,
    },
    {
      key: 'OUTLET-SPA-01',
      label: 'Lotus Wellness Spa',
      transactionCount: 17,
      grossRevenue: 5950.5,
      netRevenue: 5300.0,
      revenuePercentage: 37.32,
    },
  ],
  revenueByPaymentMethod: {
    CABIN_FOLIO: 12000.0,
    CREDIT_CARD: 2200.0,
  },
};

const mockJobs: ReportExportJob[] = [
  {
    id: 1,
    jobId: 'job-uuid-1111',
    format: 'CSV',
    status: 'COMPLETED',
    reportTitle: 'Daily Revenue CSV',
    downloadUrl: '/api/pos/reports/exports/job-uuid-1111/download',
    fileSizeBytes: 2048,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    jobId: 'job-uuid-2222',
    format: 'PDF',
    status: 'PROCESSING',
    reportTitle: 'Financial Summary PDF',
    createdAt: new Date().toISOString(),
  },
];

describe('Operational Reporting & Export UI (KAN-276, KAN-460, KAN-461)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders report dashboard and KPI summary when API succeeds', async () => {
    vi.mocked(operationalReportService.getRevenueReport).mockResolvedValueOnce(mockReportData);

    render(<OperationalReportDashboard />);

    expect(screen.getByText('Báo Cáo Doanh Thu & Vận Hành POS')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('$15450.50')).toBeInTheDocument();
      expect(screen.getByText('$14200.00')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Main Pool Bar')).toBeInTheDocument();
      expect(screen.getByText('Lotus Wellness Spa')).toBeInTheDocument();
    });
  });

  it('calls onOpenExportDrawer callback when user clicks export button', async () => {
    vi.mocked(operationalReportService.getRevenueReport).mockResolvedValueOnce(mockReportData);
    const mockOnOpen = vi.fn();
    const user = userEvent.setup();

    render(<OperationalReportDashboard onOpenExportDrawer={mockOnOpen} />);

    const exportBtn = screen.getByRole('button', { name: /Xuất Báo Cáo/i });
    await user.click(exportBtn);

    expect(mockOnOpen).toHaveBeenCalledTimes(1);
    expect(mockOnOpen).toHaveBeenCalledWith(expect.objectContaining({ dimension: 'OUTLET' }));
  });

  it('renders export drawer with job statuses and download action', async () => {
    vi.mocked(operationalReportService.getExportJobs).mockResolvedValueOnce(mockJobs);
    window.open = vi.fn();

    render(<ExportJobTrackerDrawer isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Export Downloads')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Daily Revenue CSV')).toBeInTheDocument();
      expect(screen.getByText('Financial Summary PDF')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const downloadBtn = screen.getByRole('button', { name: /Download File/i });
    await user.click(downloadBtn);

    expect(window.open).toHaveBeenCalledWith(
      '/api/pos/reports/exports/job-uuid-1111/download',
      '_blank'
    );
  });
});
