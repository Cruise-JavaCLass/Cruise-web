import { apiClient } from './api';
import type {
  VoyageFinancialClosure,
  InitiateVoyageClosureRequest,
  FinalizeVoyageClosureRequest,
  DispatchExecutiveSummaryEmailRequest,
  ExecutiveVoyageAnalyticsSummary,
  VoyageFinancialStatus,
} from './voyageAnalyticsTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export const voyageAnalyticsService = {
  async searchVoyages(params?: {
    status?: VoyageFinancialStatus;
    shipId?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<VoyageFinancialClosure>> {
    const res = await apiClient.get<ApiResponse<PageResponse<VoyageFinancialClosure>>>(
      '/admin/voyages',
      { params }
    );
    return res.data.data;
  },

  async getVoyage(voyageNumber: string): Promise<VoyageFinancialClosure> {
    const res = await apiClient.get<ApiResponse<VoyageFinancialClosure>>(
      `/admin/voyages/${voyageNumber}`
    );
    return res.data.data;
  },

  async initiateClosure(request: InitiateVoyageClosureRequest): Promise<VoyageFinancialClosure> {
    const res = await apiClient.post<ApiResponse<VoyageFinancialClosure>>(
      '/admin/voyages/closure',
      request
    );
    return res.data.data;
  },

  async finalizeClosure(
    voyageNumber: string,
    request: FinalizeVoyageClosureRequest
  ): Promise<VoyageFinancialClosure> {
    const res = await apiClient.post<ApiResponse<VoyageFinancialClosure>>(
      `/admin/voyages/${voyageNumber}/finalize`,
      request
    );
    return res.data.data;
  },

  async getExecutiveSummary(): Promise<ExecutiveVoyageAnalyticsSummary> {
    const res = await apiClient.get<ApiResponse<ExecutiveVoyageAnalyticsSummary>>(
      '/admin/voyages/executive/summary'
    );
    return res.data.data;
  },

  getPdfBookletUrl(voyageNumber: string): string {
    const base = apiClient.defaults.baseURL || '/api';
    return `${base}/admin/voyages/${voyageNumber}/booklet.pdf`;
  },

  async dispatchEmail(
    voyageNumber: string,
    request: DispatchExecutiveSummaryEmailRequest
  ): Promise<string> {
    const res = await apiClient.post<ApiResponse<string>>(
      `/admin/voyages/${voyageNumber}/dispatch-email`,
      request
    );
    return res.data.data;
  },
};
