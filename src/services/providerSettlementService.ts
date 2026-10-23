import { apiClient } from './api';

export type SettlementStatus = 'DRAFT' | 'PENDING_VERIFICATION' | 'APPROVED' | 'PAID' | 'RECONCILED';

export type AdjustmentType =
  | 'EXTRA_SERVICE'
  | 'PENALTY_WEATHER_DELAY'
  | 'PENALTY_VEHICLE_DEFECT'
  | 'PENALTY_GUIDE_NO_SHOW'
  | 'OTHER_COMPENSATION';

export interface SettlementAdjustment {
  id: number;
  adjustmentType: AdjustmentType;
  amount: number;
  invoiceReference?: string;
  explanation: string;
  recordedBy?: string;
  createdAt: string;
}

export interface SettlementDetail {
  id: number;
  providerId: string;
  providerName: string;
  excursionId: number;
  excursionTitle: string;
  voyageId: number;
  portId?: number;
  portName?: string;
  agreedUnitRate: number;
  minGuaranteePax: number;
  registeredPax: number;
  actualPax: number;
  noShowPax: number;
  billablePax: number;
  baseAmount: number;
  adjustedAmount: number;
  totalAmount: number;
  currency: string;
  status: SettlementStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  adjustments: SettlementAdjustment[];
}

export interface ProviderSettlementSummary {
  providerId: string;
  providerName: string;
  voyageId?: number;
  totalExcursions: number;
  totalRegisteredPax: number;
  totalActualPax: number;
  totalNoShowPax: number;
  totalBillablePax: number;
  totalBaseAmount: number;
  totalAdjustedAmount: number;
  grandTotalAmount: number;
  currency: string;
  settlements: SettlementDetail[];
}

export interface InitializeSettlementRequest {
  excursionId: number;
  providerId?: string;
  agreedUnitRate?: number;
  minGuaranteePax?: number;
  notes?: string;
}

export interface CreateAdjustmentRequest {
  adjustmentType: AdjustmentType;
  amount: number;
  invoiceReference?: string;
  explanation: string;
  recordedBy?: string;
}

export interface UpdateStatusRequest {
  targetStatus: SettlementStatus;
  actor?: string;
  note?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const fetchSettlements = async (params?: {
  providerId?: string;
  voyageId?: number;
  status?: SettlementStatus;
  page?: number;
  size?: number;
}): Promise<PageResponse<SettlementDetail>> => {
  const res = await apiClient.get<ApiResponse<PageResponse<SettlementDetail>>>(
    '/v1/tour-providers/settlements',
    { params }
  );
  return res.data.data;
};

export const fetchSettlementById = async (id: number): Promise<SettlementDetail> => {
  const res = await apiClient.get<ApiResponse<SettlementDetail>>(
    `/v1/tour-providers/settlements/${id}`
  );
  return res.data.data;
};

export const initializeSettlement = async (
  request: InitializeSettlementRequest
): Promise<SettlementDetail> => {
  const res = await apiClient.post<ApiResponse<SettlementDetail>>(
    '/v1/tour-providers/settlements',
    request
  );
  return res.data.data;
};

export const addSettlementAdjustment = async (
  settlementId: number,
  request: CreateAdjustmentRequest
): Promise<SettlementDetail> => {
  const res = await apiClient.post<ApiResponse<SettlementDetail>>(
    `/v1/tour-providers/settlements/${settlementId}/adjustments`,
    request
  );
  return res.data.data;
};

export const updateSettlementStatus = async (
  settlementId: number,
  request: UpdateStatusRequest
): Promise<SettlementDetail> => {
  const res = await apiClient.patch<ApiResponse<SettlementDetail>>(
    `/v1/tour-providers/settlements/${settlementId}/status`,
    request
  );
  return res.data.data;
};

export const fetchProviderSummary = async (
  providerId: string,
  voyageId?: number
): Promise<ProviderSettlementSummary> => {
  const res = await apiClient.get<ApiResponse<ProviderSettlementSummary>>(
    `/v1/tour-providers/${encodeURIComponent(providerId)}/settlement-summary`,
    { params: { voyageId } }
  );
  return res.data.data;
};
