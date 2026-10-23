import { apiClient } from './api';

export interface CabinMemberDto {
  id?: number;
  cabinNumber: string;
  passengerId: number;
  guestName: string;
  age?: number;
  isMinor: boolean;
  isAuthorizedSigner: boolean;
  individualCreditLimit?: number;
  individualBalance?: number;
  availableLimit?: number;
}

export interface CabinSplitShareRequest {
  passengerId: number;
  guestName?: string;
  amount: number;
  signatureBase64?: string;
}

export interface CabinSplitBillingRequest {
  cabinNumber: string;
  stationId: string;
  cashierId: string;
  shiftId?: number;
  transactionUuid?: string;
  notes?: string;
  splitShares: CabinSplitShareRequest[];
  items?: {
    itemCode: string;
    itemName: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface SplitShareResult {
  passengerId: number;
  guestName: string;
  amount: number;
  transactionId?: number;
  transactionUuid: string;
  signatureArchived: boolean;
  remainingMemberLimit?: number;
}

export interface CabinSplitBillingResponse {
  cabinNumber: string;
  totalAmount: number;
  splitCount: number;
  splits: SplitShareResult[];
}

export interface CabinCreditLimitCheckRequest {
  amount: number;
  passengerId?: number;
}

export interface CabinCreditLimitCheckResponse {
  cabinNumber: string;
  passengerId?: number;
  allowed: boolean;
  locked: boolean;
  overLimit: boolean;
  lockReason?: string;
  requestedAmount: number;
  cabinCreditLimit: number;
  cabinCurrentBalance: number;
  cabinAvailableLimit: number;
  memberCreditLimit?: number;
  memberCurrentBalance?: number;
  memberAvailableLimit?: number;
}

export interface ArchiveSignatureRequest {
  transactionUuid: string;
  transactionId?: number;
  cabinNumber: string;
  passengerId?: number;
  signerName: string;
  signatureImageBase64: string;
  capturedBy?: string;
  amount?: number;
}

export interface SignatureResponse {
  id: number;
  transactionUuid: string;
  transactionId?: number;
  cabinNumber: string;
  passengerId?: number;
  signerName: string;
  signatureImageBase64: string;
  sha256Checksum: string;
  capturedBy?: string;
  amount?: number;
  createdAt: string;
}

export const cabinBillingService = {
  async getCabinMembers(cabinNumber: string): Promise<CabinMemberDto[]> {
    const res = await apiClient.get<{ success: boolean; data: CabinMemberDto[] }>(
      `/api/pos/cabin-billing/${cabinNumber}/members`
    );
    return res.data.data;
  },

  async checkCreditLimit(
    cabinNumber: string,
    request: CabinCreditLimitCheckRequest
  ): Promise<CabinCreditLimitCheckResponse> {
    const res = await apiClient.post<{ success: boolean; data: CabinCreditLimitCheckResponse }>(
      `/api/pos/cabin-billing/${cabinNumber}/check-limit`,
      request
    );
    return res.data.data;
  },

  async splitBilling(request: CabinSplitBillingRequest): Promise<CabinSplitBillingResponse> {
    const res = await apiClient.post<{ success: boolean; data: CabinSplitBillingResponse }>(
      '/api/pos/cabin-billing/split',
      request
    );
    return res.data.data;
  },

  async archiveSignature(request: ArchiveSignatureRequest): Promise<SignatureResponse> {
    const res = await apiClient.post<{ success: boolean; data: SignatureResponse }>(
      '/api/pos/cabin-billing/signatures',
      request
    );
    return res.data.data;
  },

  async getSignature(transactionUuid: string): Promise<SignatureResponse> {
    const res = await apiClient.get<{ success: boolean; data: SignatureResponse }>(
      `/api/pos/cabin-billing/signatures/${transactionUuid}`
    );
    return res.data.data;
  },
};
