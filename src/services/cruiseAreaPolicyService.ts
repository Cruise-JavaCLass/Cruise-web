import { apiClient } from './api';

export interface ShipDeckZone {
  id?: number;
  shipId: number;
  deckNumber: number;
  zoneName: string;
  zoneCode: string;
  maxSafetyCapacity: number;
  zoneType: string;
  hasLifeboatAccess?: boolean;
  isRestricted?: boolean;
}

export interface SystemCancellationPolicy {
  id?: number;
  policyName: string;
  serviceType: string;
  hoursBeforeCutoff: number;
  refundPercentage: number;
  cancellationFee?: number;
  isActive?: boolean;
  description?: string;
}

export const cruiseAreaPolicyService = {
  async getDeckZones(shipId: number): Promise<ShipDeckZone[]> {
    const res = await apiClient.get<{ success: boolean; data: ShipDeckZone[] }>(
      `/admin/cruise-area-policy/ships/${shipId}/deck-zones`
    );
    return res.data.data;
  },

  async createDeckZone(zone: ShipDeckZone): Promise<ShipDeckZone> {
    const res = await apiClient.post<{ success: boolean; data: ShipDeckZone }>(
      '/admin/cruise-area-policy/deck-zones',
      zone
    );
    return res.data.data;
  },

  async getCancellationPolicies(serviceType?: string): Promise<SystemCancellationPolicy[]> {
    const res = await apiClient.get<{ success: boolean; data: SystemCancellationPolicy[] }>(
      '/admin/cruise-area-policy/cancellation-policies',
      { params: serviceType ? { serviceType } : undefined }
    );
    return res.data.data;
  },

  async createCancellationPolicy(policy: SystemCancellationPolicy): Promise<SystemCancellationPolicy> {
    const res = await apiClient.post<{ success: boolean; data: SystemCancellationPolicy }>(
      '/admin/cruise-area-policy/cancellation-policies',
      policy
    );
    return res.data.data;
  },
};
