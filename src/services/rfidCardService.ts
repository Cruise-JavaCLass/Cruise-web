import { apiClient } from './api';

export type RfidCardStatus =
  | 'AVAILABLE'
  | 'ISSUED'
  | 'LOST_REPORTED'
  | 'BLACKLISTED'
  | 'DAMAGED'
  | 'RETIRED';

export interface RfidCardInventoryDto {
  id: number;
  cardUid: string;
  cardType: string;
  batchNumber: string;
  status: RfidCardStatus;
  assignedPassengerId?: number;
  assignedPassengerName?: string;
  assignedCabinNumber?: string;
  issuedAt?: string;
  blacklistedAt?: string;
  blacklistReason?: string;
  blacklistedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface RfidInventoryDashboardDto {
  totalCards: number;
  availableCards: number;
  issuedCards: number;
  lostOrBlacklistedCards: number;
  damagedCards: number;
  recentCards: RfidCardInventoryDto[];
  activeBlacklistUids: string[];
}

export interface BulkIngestPayload {
  batchNumber: string;
  cardType?: string;
  cardUids: string[];
  notes?: string;
}

export interface BulkIngestResponse {
  batchNumber: string;
  totalSubmitted: number;
  successfullyIngested: number;
  duplicateSkipped: number;
  skippedUids: string[];
}

export interface BlacklistPayload {
  cardUid: string;
  reason: string;
  reportedBy?: string;
  replacementCardUid?: string;
}

export interface BlacklistResponse {
  cardUid: string;
  status: RfidCardStatus;
  blacklistedAt: string;
  reason: string;
  posBlacklistBroadcasted: boolean;
  affectedPassengerId?: number;
  replacementCardUid?: string;
  message: string;
}

export const rfidCardService = {
  async getDashboard(): Promise<RfidInventoryDashboardDto> {
    const res = await apiClient.get<{ success: boolean; data: RfidInventoryDashboardDto }>(
      '/api/operations/rfid-cards/dashboard'
    );
    return res.data.data;
  },

  async ingestBatch(payload: BulkIngestPayload): Promise<BulkIngestResponse> {
    const res = await apiClient.post<{ success: boolean; data: BulkIngestResponse }>(
      '/api/operations/rfid-cards/batch-ingest',
      payload
    );
    return res.data.data;
  },

  async blacklistCard(payload: BlacklistPayload): Promise<BlacklistResponse> {
    const res = await apiClient.post<{ success: boolean; data: BlacklistResponse }>(
      '/api/operations/rfid-cards/blacklist',
      payload
    );
    return res.data.data;
  },

  async getActiveBlacklistUids(): Promise<string[]> {
    const res = await apiClient.get<{ success: boolean; data: string[] }>(
      '/api/operations/rfid-cards/blacklist-uids'
    );
    return res.data.data;
  },
};
