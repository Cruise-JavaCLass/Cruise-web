export type PackageType =
  | 'BEVERAGE_DELUXE'
  | 'SPECIALTY_DINING'
  | 'SPA_WELLNESS'
  | 'SHORE_EXCURSION'
  | 'INTERNET_STREAMING';

export type EntitlementStatus = 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'CANCELLED';

export interface GuestPackageEntitlement {
  id: number;
  passengerId: number;
  cabinNumber: string;
  packageName: string;
  packageType: PackageType;
  eligibleCategory?: string;
  totalQuota: number;
  usedQuota: number;
  maxItemPriceCap?: number;
  priorityLevel: number;
  status: EntitlementStatus;
  validFrom?: string;
  validTo?: string;
}

export interface EvaluateCartItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

export interface EntitlementEvaluateRequest {
  passengerId: number;
  cabinNumber?: string;
  items: EvaluateCartItem[];
}

export interface ItemEntitlementResult {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  coveredAmount: number;
  outOfPocketAmount: number;
  fullyCovered: boolean;
  appliedPackageName?: string;
  appliedEntitlementId?: number;
  quotaDeducted?: number;
}

export interface EntitlementEvaluateResponse {
  passengerId: number;
  cabinNumber?: string;
  originalTotal: number;
  packageDiscountTotal: number;
  netPayableTotal: number;
  items: ItemEntitlementResult[];
}

export interface EntitlementDeductRequest {
  passengerId: number;
  transactionId?: string;
  items: Array<{
    entitlementId: number;
    productName: string;
    units: number;
    amountCovered?: number;
  }>;
}

export interface EntitlementRollbackRequest {
  passengerId: number;
  transactionId?: string;
  items: Array<{
    entitlementId: number;
    units: number;
    reason: string;
  }>;
}
