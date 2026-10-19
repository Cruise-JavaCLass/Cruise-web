import { apiClient } from './api';

export type DisputeReason =
  | 'UNRECOGNIZED_CHARGE'
  | 'DUPLICATE_BILLING'
  | 'INCORRECT_AMOUNT'
  | 'SERVICE_NOT_DELIVERED';

export type DisputeStatus =
  | 'SUBMITTED'
  | 'UNDER_INVESTIGATION'
  | 'APPROVED_ADJUSTED'
  | 'REJECTED';

export type DiscrepancyType =
  | 'MATCHED'
  | 'UNMATCHED_POS'
  | 'UNMATCHED_FOLIO'
  | 'AMOUNT_MISMATCH'
  | 'DUPLICATE_SUSPECT';

export type DiscrepancyStatus =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'RESOLVED'
  | 'WRITTEN_OFF';

export type BatchStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface DisputeHistoryItem {
  id: number;
  disputeId: number;
  previousStatus?: DisputeStatus;
  newStatus: DisputeStatus;
  actionBy: string;
  notes?: string;
  timestamp: string;
}

export interface DisputeCase {
  id: number;
  disputeNumber: string;
  transactionId: string;
  folioId: string;
  cabinNumber: string;
  passengerId?: string;
  passengerName?: string;
  reason: DisputeReason;
  disputeAmount: number;
  refundAmount?: number;
  passengerNote: string;
  evidenceUrl?: string;
  status: DisputeStatus;
  reviewerId?: string;
  reviewerNote?: string;
  adjustmentTransactionId?: string;
  createdAt: string;
  resolvedAt?: string;
  histories?: DisputeHistoryItem[];
}

export interface CreateDisputePayload {
  transactionId: string;
  folioId: string;
  cabinNumber: string;
  passengerId?: string;
  passengerName?: string;
  reason: DisputeReason;
  disputeAmount: number;
  passengerNote: string;
  evidenceUrl?: string;
}

export interface ResolveDisputePayload {
  decisionStatus: DisputeStatus;
  approvedRefundAmount?: number;
  reviewerId?: string;
  reviewerNote?: string;
}

export interface ReconciliationBatch {
  id: number;
  batchNumber: string;
  terminalId?: string;
  serviceArea?: string;
  startedAt: string;
  completedAt?: string;
  totalTransactions: number;
  matchedCount: number;
  discrepancyCount: number;
  totalReconciledAmount: number;
  totalVarianceAmount: number;
  status: BatchStatus;
  triggeredBy?: string;
  notes?: string;
}

export interface DiscrepancyRecord {
  id: number;
  batchId: number;
  transactionId?: string;
  folioId?: string;
  cabinNumber?: string;
  passengerName?: string;
  serviceArea?: string;
  discrepancyType: DiscrepancyType;
  posAmount?: number;
  folioAmount?: number;
  variance: number;
  status: DiscrepancyStatus;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  transactionTimestamp?: string;
}

export interface ResolveDiscrepancyPayload {
  status: DiscrepancyStatus;
  resolutionNotes: string;
  resolvedBy?: string;
}

export interface ReconciliationSummaryMetrics {
  totalReconciledAmount: number;
  totalDisputedAmount: number;
  totalVarianceAmount: number;
  totalTransactionsCount: number;
  openDisputesCount: number;
  resolvedDisputesCount: number;
  pendingDiscrepanciesCount: number;
  discrepancyRatePercent: number;
  criticalAlertActive: boolean;
  alertMessage: string;
  generatedAt: string;
}

export interface GuestFolioItem {
  id: string;
  transactionId: string;
  folioId: string;
  cabinNumber: string;
  passengerName: string;
  description: string;
  serviceArea: string;
  amount: number;
  isReversal: boolean;
  linkedDisputeId?: number;
  postedAt: string;
  dispute?: DisputeCase;
}

export const reconciliationService = {
  // Disputes
  async createDispute(payload: CreateDisputePayload): Promise<DisputeCase> {
    const res = await apiClient.post<{ success: boolean; data: DisputeCase }>('/pos/disputes', payload);
    return res.data.data;
  },

  async getDisputes(status?: DisputeStatus, cabinNumber?: string): Promise<DisputeCase[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (cabinNumber) params.cabinNumber = cabinNumber;
    const res = await apiClient.get<{ success: boolean; data: { content: DisputeCase[] } }>('/pos/disputes', { params });
    return res.data?.data?.content || [];
  },

  async resolveDispute(id: number, payload: ResolveDisputePayload): Promise<DisputeCase> {
    const res = await apiClient.post<{ success: boolean; data: DisputeCase }>(`/pos/disputes/${id}/resolve`, payload);
    return res.data.data;
  },

  // Reconciliation Batches & Discrepancies
  async runReconciliation(): Promise<ReconciliationBatch> {
    const res = await apiClient.post<{ success: boolean; data: ReconciliationBatch }>('/pos/reconciliation/run', {});
    return res.data.data;
  },

  async getDiscrepancies(): Promise<DiscrepancyRecord[]> {
    const res = await apiClient.get<{ success: boolean; data: { content: DiscrepancyRecord[] } }>('/pos/reconciliation/discrepancies');
    return res.data?.data?.content || [];
  },

  async resolveDiscrepancy(id: number, payload: ResolveDiscrepancyPayload): Promise<DiscrepancyRecord> {
    const res = await apiClient.patch<{ success: boolean; data: DiscrepancyRecord }>(`/pos/reconciliation/discrepancies/${id}/resolve`, payload);
    return res.data.data;
  },

  async getSummaryMetrics(): Promise<ReconciliationSummaryMetrics> {
    const res = await apiClient.get<{ success: boolean; data: ReconciliationSummaryMetrics }>('/pos/reconciliation/metrics/summary');
    return res.data.data;
  },
};
