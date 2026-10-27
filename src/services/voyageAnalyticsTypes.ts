export type VoyageFinancialStatus =
  | 'ACTIVE'
  | 'CLOSURE_IN_PROGRESS'
  | 'FINANCIALLY_CLOSED'
  | 'AUDITED';

export interface VoyageFinancialClosure {
  id: number;
  voyageNumber: string;
  shipId: string;
  itineraryName: string;
  voyageStartDate: string;
  voyageEndDate: string;
  voyageDurationDays: number;
  totalPassengerCapacity: number;
  actualPassengerAttendance: number;
  passengerCruiseDays: number;
  budgetedGrossRevenue: number;
  actualGrossRevenue: number;
  actualNetRevenue: number;
  totalDiscountsAndObc: number;
  revenueBeverageBars: number;
  revenueSpecialtyDining: number;
  revenueShoreExcursions: number;
  revenueSpaWellness: number;
  revenueRetailBoutiques: number;
  occupancyPercentage: number;
  revenuePerPassengerCruiseDay: number;
  budgetVariancePercentage: number;
  profitabilityIndex: number;
  status: VoyageFinancialStatus;
  closedBy?: string;
  closedAt?: string;
  closureAuditNotes?: string;
  createdAt: string;
}

export interface InitiateVoyageClosureRequest {
  voyageNumber: string;
  shipId: string;
  itineraryName: string;
  voyageStartDate: string;
  voyageEndDate: string;
  totalPassengerCapacity: number;
  actualPassengerAttendance: number;
  budgetedGrossRevenue: number;
  revenueBeverageBars?: number;
  revenueSpecialtyDining?: number;
  revenueShoreExcursions?: number;
  revenueSpaWellness?: number;
  revenueRetailBoutiques?: number;
  totalDiscountsAndObc?: number;
  closureAuditNotes?: string;
}

export interface FinalizeVoyageClosureRequest {
  closureAuditNotes: string;
}

export interface DispatchExecutiveSummaryEmailRequest {
  recipientEmail: string;
  executiveNote?: string;
  ccEmails?: string[];
}

export interface ExecutiveVoyageAnalyticsSummary {
  latestVoyage: VoyageFinancialClosure | null;
  fleetAverageRevPCD: number;
  fleetAverageOccupancy: number;
  fleetTotalGrossRevenue: number;
  historicalTrend: VoyageFinancialClosure[];
}
