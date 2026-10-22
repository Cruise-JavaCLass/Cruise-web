import api from './api';
import type {
  OperationalReportQuery,
  OperationalReportResponse,
  ReportExportJob,
  CreateExportJobRequest,
} from './reportTypes';

export const operationalReportService = {
  async getRevenueReport(query?: OperationalReportQuery): Promise<OperationalReportResponse> {
    const response = await api.get<{ success: boolean; data: OperationalReportResponse }>(
      '/api/pos/reports/revenue',
      { params: query }
    );
    return response.data.data;
  },

  async createExportJob(request: CreateExportJobRequest): Promise<ReportExportJob> {
    const response = await api.post<{ success: boolean; data: ReportExportJob }>(
      '/api/pos/reports/exports',
      request
    );
    return response.data.data;
  },

  async getExportJobs(): Promise<{ content: ReportExportJob[] }> {
    const response = await api.get<{ success: boolean; data: { content: ReportExportJob[] } }>(
      '/api/pos/reports/exports'
    );
    return response.data.data;
  },
};
