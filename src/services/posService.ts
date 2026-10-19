import { apiClient } from './api';

export type PaymentMethod = 'CABIN_FOLIO' | 'CREDIT_CARD' | 'CASH';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'VOIDED' | 'PARTIALLY_REFUNDED' | 'FULLY_REFUNDED';
export type TransactionType = 'CHARGE' | 'VOID' | 'REFUND';
export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface PosTransactionItem {
  id?: number;
  itemCode: string;
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PosTransaction {
  id: number;
  transactionUuid: string;
  idempotencyKey?: string;
  shiftId?: number;
  stationId: string;
  cashierId: string;
  passengerId?: number;
  cabinNumber?: string;
  guestName?: string;
  paymentMethod: PaymentMethod;
  type: TransactionType;
  status: TransactionStatus;
  subtotal: number;
  tax: number;
  gratuity: number;
  discount: number;
  totalAmount: number;
  refundedAmount: number;
  remainingRefundableAmount: number;
  currency: string;
  settled: boolean;
  originalTransactionId?: number;
  voidReason?: string;
  notes?: string;
  createdAt: string;
  items: PosTransactionItem[];
}

export interface CreateTransactionRequest {
  transactionUuid?: string;
  shiftId?: number;
  stationId: string;
  cashierId: string;
  passengerId?: number;
  cabinNumber?: string;
  guestName?: string;
  paymentMethod: PaymentMethod;
  tax?: number;
  gratuity?: number;
  discount?: number;
  notes?: string;
  items: {
    itemCode: string;
    itemName: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface VoidTransactionRequest {
  voidReason: string;
  performedBy: string;
  managerPin?: string;
}

export interface RefundTransactionRequest {
  refundAmount: number;
  refundReason: string;
  performedBy: string;
  managerPin: string;
  managerId?: string;
}

export interface ShiftSummaryResponse {
  shiftId: number;
  stationId: string;
  cashierId: string;
  status: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  reportType: 'X_REPORT' | 'Z_REPORT';
  startingCash: number;
  endingCash?: number;
  totalSales: number;
  totalRefunds: number;
  netRevenue: number;
  transactionCount: number;
  revenueByPaymentMethod: Record<string, number>;
  revenueByCategory: Record<string, number>;
}

export interface FolioAccountResponse {
  id: number;
  cabinNumber: string;
  primaryGuestName: string;
  passengerId?: number;
  creditLimit: number;
  currentBalance: number;
  availableLimit: number;
  status: 'ACTIVE' | 'LOCKED';
}

export interface BatchSyncRequest {
  deviceId: string;
  clientSyncTimestamp?: string;
  transactions: CreateTransactionRequest[];
}

export interface BatchSyncResponse {
  deviceId: string;
  totalReceived: number;
  successfullyProcessed: number;
  duplicateCount: number;
  failedCount: number;
  processedUuids: string[];
  failedReasons: string[];
}

export const posService = {
  createTransaction: async (request: CreateTransactionRequest, idempotencyKey?: string): Promise<PosTransaction> => {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
    const res = await apiClient.post<{ success: boolean; data: PosTransaction }>('/pos/transactions', request, { headers });
    return res.data.data;
  },

  voidTransaction: async (id: number, request: VoidTransactionRequest): Promise<PosTransaction> => {
    const res = await apiClient.post<{ success: boolean; data: PosTransaction }>(`/pos/transactions/${id}/void`, request);
    return res.data.data;
  },

  refundTransaction: async (id: number, request: RefundTransactionRequest): Promise<PosTransaction> => {
    const res = await apiClient.post<{ success: boolean; data: PosTransaction }>(`/pos/transactions/${id}/refund`, request);
    return res.data.data;
  },

  getTransactionById: async (id: number): Promise<PosTransaction> => {
    const res = await apiClient.get<{ success: boolean; data: PosTransaction }>(`/pos/transactions/${id}`);
    return res.data.data;
  },

  getTransactions: async (params?: {
    stationId?: string;
    cashierId?: string;
    status?: TransactionStatus;
    paymentMethod?: PaymentMethod;
    cabinNumber?: string;
    page?: number;
    size?: number;
  }): Promise<{ content: PosTransaction[]; totalElements: number; totalPages: number }> => {
    const res = await apiClient.get<{ success: boolean; data: { content: PosTransaction[]; totalElements: number; totalPages: number } }>('/pos/transactions', { params });
    return res.data.data;
  },

  getFolio: async (cabinNumber: string): Promise<FolioAccountResponse> => {
    const res = await apiClient.get<{ success: boolean; data: FolioAccountResponse }>(`/pos/folios/${cabinNumber}`);
    return res.data.data;
  },

  getShiftSummary: async (shiftId: number, reportType: 'X_REPORT' | 'Z_REPORT' = 'X_REPORT'): Promise<ShiftSummaryResponse> => {
    const res = await apiClient.get<{ success: boolean; data: ShiftSummaryResponse }>('/pos/reports/shift-summary', {
      params: { shiftId, reportType }
    });
    return res.data.data;
  },

  closeShift: async (shiftId: number, managerId: string, endingCash?: number) => {
    const res = await apiClient.post<{ success: boolean; data: unknown }>(`/pos/shifts/${shiftId}/close`, { managerId, endingCash });
    return res.data.data;
  },

  syncOfflineBatch: async (batch: BatchSyncRequest): Promise<BatchSyncResponse> => {
    const res = await apiClient.post<{ success: boolean; data: BatchSyncResponse }>('/pos/transactions/batch-sync', batch);
    return res.data.data;
  }
};
