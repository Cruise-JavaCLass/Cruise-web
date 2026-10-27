export type CredentialType = 'QR' | 'CARD' | 'RFID';
export type CredentialStatus = 'ACTIVE' | 'REPORTED_LOST' | 'BLOCKED';

export interface PassengerIdentificationResponse {
  passengerId: number;
  fullName: string;
  cabinNumber: string;
  photoUrl?: string;
  credentialType: CredentialType;
  maskedIdentifier: string;
  credentialStatus: CredentialStatus;
  folioStatus: string;
  creditLimit: number;
  currentBalance: number;
  availableLimit: number;
  individualSpendingLimit?: number;
  spendingAllowed: boolean;
  alcoholRestricted: boolean;
  isMinor: boolean;
}

export interface IdentifyPassengerRequest {
  rawCredential: string;
  stationId?: string;
  cashierId?: string;
}

export interface CredentialManifestCacheResponse {
  generatedAt: string;
  totalActiveCount: number;
  credentials: Array<{
    identifier: string;
    credentialType: CredentialType;
    passengerId: number;
    fullName: string;
    cabinNumber: string;
    photoUrl?: string;
    status: CredentialStatus;
    spendingAllowed: boolean;
    alcoholRestricted: boolean;
    isMinor: boolean;
    individualSpendingLimit?: number;
  }>;
}

export interface ScanResult {
  rawCredential: string;
  type: CredentialType;
  timestamp: number;
}
