import { apiClient } from './api';
import type {
  OperationalReportQuery,
  OperationalReportResponse,
  ReportExportJob,
  CreateExportJobRequest,
} from './reportTypes';

function toIsoBoundary(value?: string, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}${endOfDay ? 'T23:59:59.999Z' : 'T00:00:00Z'}`;
  }
  return trimmed;
}

function normalizeQuery(query?: OperationalReportQuery): OperationalReportQuery | undefined {
  if (!query) return undefined;
  return {
    ...query,
    startDate: toIsoBoundary(query.startDate, false),
    endDate: toIsoBoundary(query.endDate, true),
  };
}

export const operationalReportService = {
  async getRevenueReport(query?: OperationalReportQuery): Promise<OperationalReportResponse> {
    const response = await apiClient.get<{ success: boolean; data: OperationalReportResponse }>(
      '/pos/reports/revenue',
      { params: normalizeQuery(query) }
    );
    return response.data.data;
  },

  async createExportJob(request: CreateExportJobRequest): Promise<ReportExportJob> {
    const normalizedRequest: CreateExportJobRequest = {
      ...request,
      query: normalizeQuery(request.query) ?? {},
    };
    const response = await apiClient.post<{ success: boolean; data: ReportExportJob }>(
      '/pos/reports/exports',
      normalizedRequest
    );
    return response.data.data;
  },

  async getExportJobs(): Promise<ReportExportJob[]> {
    const response = await apiClient.get<{ success: boolean; data: { content: ReportExportJob[] } }>(
      '/pos/reports/exports'
    );
    return response.data.data?.content || [];
  },
};
