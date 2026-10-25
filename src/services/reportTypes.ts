export type ReportDimension = 'OUTLET' | 'CATEGORY' | 'PAYMENT_METHOD' | 'DATE_RANGE';
export type ExportFormat = 'CSV' | 'EXCEL' | 'PDF';
export type ExportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface OperationalReportQuery {
  startDate?: string;
  endDate?: string;
  outletId?: number;
  category?: string;
  paymentMethod?: string;
  dimension?: ReportDimension;
}

export interface DimensionBreakdownDto {
  key: string;
  label: string;
  transactionCount: number;
  grossRevenue: number;
  netRevenue: number;
  revenuePercentage: number;
}

export interface OperationalReportResponse {
  totalGrossRevenue: number;
  totalNetRevenue: number;
  totalDiscountAmount: number;
  totalTaxAmount: number;
  totalTransactionCount: number;
  averageTicketSize: number;
  breakdown: DimensionBreakdownDto[];
  revenueByPaymentMethod: Record<string, number>;
}

export interface ReportExportJob {
  id: number;
  jobId: string;
  format: ExportFormat;
  status: ExportJobStatus;
  reportTitle: string;
  downloadUrl?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateExportJobRequest {
  format: ExportFormat;
  reportTitle?: string;
  query?: OperationalReportQuery;
}
