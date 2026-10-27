import { apiClient } from './api';

export type SolasEmergencyType =
  | 'GENERAL_EMERGENCY'
  | 'ABANDON_SHIP'
  | 'FIRE_ALARM'
  | 'MAN_OVERBOARD'
  | 'DRILL_PRACTICE';

export type MusterStatus =
  | 'STANDBY'
  | 'ACTIVE_MUSTER'
  | 'DRILL_IN_PROGRESS'
  | 'ALL_CLEAR'
  | 'STAND_DOWN';

export interface SolasMusterIncident {
  id?: number;
  incidentCode: string;
  emergencyType: SolasEmergencyType;
  status: MusterStatus;
  triggeredBy: string;
  announcementText: string;
  acousticSignalCode?: string;
  totalSoulsOnBoard: number;
  musteredSoulsCount: number;
  musterCompletionRate?: number;
  triggeredAt: string;
  allClearAt?: string;
  headCountByStation?: Record<string, number>;
}

export interface SolasMusterCheckinRequest {
  incidentId: number;
  passengerId: number;
  musterStationCode: string;
  lifejacketVerified?: boolean;
  checkedInBy?: string;
}

export const solasMusterService = {
  async getActiveMuster(): Promise<SolasMusterIncident | null> {
    const res = await apiClient.get<{ success: boolean; data: SolasMusterIncident | null }>(
      '/api/operations/solas-muster/active'
    );
    return res.data.data;
  },

  async triggerEmergencyMuster(req: {
    emergencyType: SolasEmergencyType;
    triggeredBy: string;
    announcementText: string;
  }): Promise<SolasMusterIncident> {
    const res = await apiClient.post<{ success: boolean; data: SolasMusterIncident }>(
      '/api/operations/solas-muster/trigger',
      req
    );
    return res.data.data;
  },

  async checkinPassenger(req: SolasMusterCheckinRequest): Promise<SolasMusterIncident> {
    const res = await apiClient.post<{ success: boolean; data: SolasMusterIncident }>(
      '/api/operations/solas-muster/checkin',
      req
    );
    return res.data.data;
  },

  async setAllClear(incidentId: number): Promise<SolasMusterIncident> {
    const res = await apiClient.post<{ success: boolean; data: SolasMusterIncident }>(
      `/api/operations/solas-muster/${incidentId}/all-clear`
    );
    return res.data.data;
  },
};
