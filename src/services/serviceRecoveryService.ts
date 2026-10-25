import { apiClient } from './api';
import type {
  ServiceRecoveryCase,
  ServiceRecoveryObcVoucher,
  CreateRecoveryCaseRequest,
  EscalateCaseRequest,
  ResolveCaseRequest,
  IssueObcVoucherRequest,
  ClaimObcVoucherResponse,
  ServiceRecoveryCaseStatus,
  ServiceRecoverySeverity,
} from './serviceRecoveryTypes';

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

export const serviceRecoveryService = {
  async searchCases(params?: {
    status?: ServiceRecoveryCaseStatus;
    severity?: ServiceRecoverySeverity;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ServiceRecoveryCase>> {
    const res = await apiClient.get<ApiResponse<PageResponse<ServiceRecoveryCase>>>(
      '/service-recovery/cases',
      { params }
    );
    return res.data.data;
  },

  async getCase(caseId: number): Promise<ServiceRecoveryCase> {
    const res = await apiClient.get<ApiResponse<ServiceRecoveryCase>>(
      `/service-recovery/cases/${caseId}`
    );
    return res.data.data;
  },

  async createCase(request: CreateRecoveryCaseRequest): Promise<ServiceRecoveryCase> {
    const res = await apiClient.post<ApiResponse<ServiceRecoveryCase>>(
      '/service-recovery/cases',
      request
    );
    return res.data.data;
  },

  async escalateCase(caseId: number, request: EscalateCaseRequest): Promise<ServiceRecoveryCase> {
    const res = await apiClient.post<ApiResponse<ServiceRecoveryCase>>(
      `/service-recovery/cases/${caseId}/escalate`,
      request
    );
    return res.data.data;
  },

  async resolveCase(caseId: number, request: ResolveCaseRequest): Promise<ServiceRecoveryCase> {
    const res = await apiClient.post<ApiResponse<ServiceRecoveryCase>>(
      `/service-recovery/cases/${caseId}/resolve`,
      request
    );
    return res.data.data;
  },

  async issueVoucher(caseId: number, request: IssueObcVoucherRequest): Promise<ServiceRecoveryObcVoucher> {
    const res = await apiClient.post<ApiResponse<ServiceRecoveryObcVoucher>>(
      `/service-recovery/cases/${caseId}/vouchers`,
      request
    );
    return res.data.data;
  },

  async getVouchersForCase(caseId: number): Promise<ServiceRecoveryObcVoucher[]> {
    const res = await apiClient.get<ApiResponse<ServiceRecoveryObcVoucher[]>>(
      `/service-recovery/cases/${caseId}/vouchers`
    );
    return res.data.data;
  },

  async claimVoucher(voucherCode: string): Promise<ClaimObcVoucherResponse> {
    const res = await apiClient.post<ApiResponse<ClaimObcVoucherResponse>>(
      `/service-recovery/vouchers/${voucherCode}/claim`
    );
    return res.data.data;
  },

  async getPassengerVouchers(passengerId: number): Promise<ServiceRecoveryObcVoucher[]> {
    const res = await apiClient.get<ApiResponse<ServiceRecoveryObcVoucher[]>>(
      `/service-recovery/passenger/${passengerId}/vouchers`
    );
    return res.data.data;
  },
};
