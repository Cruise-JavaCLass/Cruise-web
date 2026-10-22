export type ServiceRecoveryCaseStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'ESCALATED'
  | 'COMPENSATION_OFFERED'
  | 'RESOLVED'
  | 'CLOSED';

export type ServiceRecoveryRootCause =
  | 'STATEROOM_CABIN_NOISE'
  | 'STATEROOM_PLUMBING_HVAC'
  | 'DINING_FOOD_QUALITY'
  | 'DINING_SERVICE_DELAY'
  | 'EXCURSION_DELAY_CANCELLATION'
  | 'ENTERTAINMENT_BOOKING_ISSUE'
  | 'POS_BILLING_DISPUTE'
  | 'LUGGAGE_MISPLACEMENT'
  | 'OTHER_GUEST_DISSATISFACTION';

export type ServiceRecoverySeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL_DIRECTOR_ESCALATION';

export type ObcVoucherStatus =
  | 'ISSUED'
  | 'ACCEPTED'
  | 'CLAIMED_TO_FOLIO'
  | 'DECLINED'
  | 'EXPIRED';

export interface ServiceRecoveryCase {
  id: number;
  caseNumber: string;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  rootCause: ServiceRecoveryRootCause;
  severity: ServiceRecoverySeverity;
  status: ServiceRecoveryCaseStatus;
  complaintSummary: string;
  complaintDetails?: string;
  assignedHandler?: string;
  slaDueAt?: string;
  escalatedAt?: string;
  escalationReason?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ServiceRecoveryObcVoucher {
  id: number;
  voucherCode: string;
  caseId: number;
  caseNumber: string;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  creditAmount: number;
  status: ObcVoucherStatus;
  apologyTitle: string;
  apologyLetterBody: string;
  authorizedBy: string;
  issuedAt: string;
  expiresAt: string;
  claimedAt?: string;
  folioTransactionId?: string;
  createdAt: string;
}

export interface CreateRecoveryCaseRequest {
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  rootCause: ServiceRecoveryRootCause;
  severity: ServiceRecoverySeverity;
  complaintSummary: string;
  complaintDetails?: string;
  assignedHandler?: string;
}

export interface EscalateCaseRequest {
  escalationReason: string;
}

export interface ResolveCaseRequest {
  resolutionNotes: string;
}

export interface IssueObcVoucherRequest {
  creditAmount: number;
  apologyTitle: string;
  apologyLetterBody: string;
  validityHours?: number;
}

export interface ClaimObcVoucherResponse {
  voucher: ServiceRecoveryObcVoucher;
  folioTransactionId: string;
  creditedAmount: number;
  cabinNumber: string;
  updatedAvailableLimit: number;
  processedAt: string;
  message: string;
}
