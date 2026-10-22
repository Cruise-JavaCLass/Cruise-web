import { apiClient } from './api';
import type {
  OperationalReportQuery,
  OperationalReportResponse,
  ReportExportJob,
  CreateExportJobRequest,
} from './reportTypes';

export const operationalReportService = {
  async getRevenueReport(query?: OperationalReportQuery): Promise<OperationalReportResponse> {
    const response = await apiClient.get<{ success: boolean; data: OperationalReportResponse }>(
      '/pos/reports/revenue',
      { params: query }
    );
    return response.data.data;
  },

  async createExportJob(request: CreateExportJobRequest): Promise<ReportExportJob> {
    const response = await apiClient.post<{ success: boolean; data: ReportExportJob }>(
      '/pos/reports/exports',
      request
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
