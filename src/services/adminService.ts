import { apiClient } from './api';
import type {
  PosTerminal,
  ProvisionTerminalRequest,
  ProvisionTerminalResponse,
  RotateKeyRequest,
  RevokeTerminalRequest,
  RenewCertificateRequest,
  CertificateRenewalResponse,
  RemoteWipeRequest,
  SystemAuditLog,
  SystemAuditLogQuery,
} from './adminTypes';

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

export const adminDeviceService = {
  async listTerminals(page = 0, size = 20): Promise<PageResponse<PosTerminal>> {
    const res = await apiClient.get<ApiResponse<PageResponse<PosTerminal>>>(
      '/admin/pos/terminals',
      { params: { page, size } }
    );
    return res.data.data;
  },

  async getTerminal(deviceId: string): Promise<PosTerminal> {
    const res = await apiClient.get<ApiResponse<PosTerminal>>(
      `/admin/pos/terminals/${deviceId}`
    );
    return res.data.data;
  },

  async provisionTerminal(payload: ProvisionTerminalRequest): Promise<ProvisionTerminalResponse> {
    const res = await apiClient.post<ApiResponse<ProvisionTerminalResponse>>(
      '/admin/pos/terminals/provision',
      payload
    );
    return res.data.data;
  },

  async rotateApiKey(deviceId: string, payload?: RotateKeyRequest): Promise<ProvisionTerminalResponse> {
    const res = await apiClient.post<ApiResponse<ProvisionTerminalResponse>>(
      `/admin/pos/terminals/${deviceId}/rotate-key`,
      payload
    );
    return res.data.data;
  },

  async revokeTerminal(deviceId: string, payload?: RevokeTerminalRequest): Promise<PosTerminal> {
    const res = await apiClient.post<ApiResponse<PosTerminal>>(
      `/admin/pos/terminals/${deviceId}/revoke`,
      payload
    );
    return res.data.data;
  },

  async renewCertificate(deviceId: string, payload?: RenewCertificateRequest): Promise<CertificateRenewalResponse> {
    const res = await apiClient.post<ApiResponse<CertificateRenewalResponse>>(
      `/admin/pos/terminals/${deviceId}/renew-certificate`,
      payload
    );
    return res.data.data;
  },

  async issueRemoteWipe(deviceId: string, payload: RemoteWipeRequest): Promise<PosTerminal> {
    const res = await apiClient.post<ApiResponse<PosTerminal>>(
      `/admin/pos/terminals/${deviceId}/remote-wipe`,
      payload
    );
    return res.data.data;
  },
};

export const adminAuditService = {
  async queryLogs(query?: SystemAuditLogQuery): Promise<PageResponse<SystemAuditLog>> {
    const res = await apiClient.get<ApiResponse<PageResponse<SystemAuditLog>>>(
      '/admin/audit/logs',
      { params: query }
    );
    return res.data.data;
  },

  getExportCsvUrl(query?: SystemAuditLogQuery): string {
    const base = apiClient.defaults.baseURL || '/api';
    const params = new URLSearchParams();
    if (query?.category) params.append('category', query.category);
    if (query?.action) params.append('action', query.action);
    if (query?.actor) params.append('actor', query.actor);
    if (query?.targetId) params.append('targetId', query.targetId);
    return `${base}/admin/audit/export/csv?${params.toString()}`;
  },
};
