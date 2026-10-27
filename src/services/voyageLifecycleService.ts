import { apiClient } from './api';
import type {
  VoyageLifecycleState,
  CreateVoyageStateRequest,
  TransitionVoyagePhaseRequest,
  SyncPortTimezoneRequest,
  TimezoneShiftScheduleResponse,
} from './voyageLifecycleTypes';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const voyageLifecycleService = {
  async getActiveVoyages(): Promise<VoyageLifecycleState[]> {
    const res = await apiClient.get<ApiResponse<VoyageLifecycleState[]>>(
      '/admin/voyage-lifecycle'
    );
    return res.data.data;
  },

  async getVoyageState(voyageNumber: string): Promise<VoyageLifecycleState> {
    const res = await apiClient.get<ApiResponse<VoyageLifecycleState>>(
      `/admin/voyage-lifecycle/${encodeURIComponent(voyageNumber)}`
    );
    return res.data.data;
  },

  async createVoyageState(request: CreateVoyageStateRequest): Promise<VoyageLifecycleState> {
    const res = await apiClient.post<ApiResponse<VoyageLifecycleState>>(
      '/admin/voyage-lifecycle',
      request
    );
    return res.data.data;
  },

  async transitionPhase(
    voyageNumber: string,
    request: TransitionVoyagePhaseRequest
  ): Promise<VoyageLifecycleState> {
    const res = await apiClient.post<ApiResponse<VoyageLifecycleState>>(
      `/admin/voyage-lifecycle/${encodeURIComponent(voyageNumber)}/transition`,
      request
    );
    return res.data.data;
  },

  async syncPortTimezone(
    voyageNumber: string,
    request: SyncPortTimezoneRequest
  ): Promise<VoyageLifecycleState> {
    const res = await apiClient.post<ApiResponse<VoyageLifecycleState>>(
      `/admin/voyage-lifecycle/${encodeURIComponent(voyageNumber)}/sync-timezone`,
      request
    );
    return res.data.data;
  },

  async getTimezoneSchedule(voyageNumber: string): Promise<TimezoneShiftScheduleResponse> {
    const res = await apiClient.get<ApiResponse<TimezoneShiftScheduleResponse>>(
      `/admin/voyage-lifecycle/${encodeURIComponent(voyageNumber)}/timezone-schedule`
    );
    return res.data.data;
  },
};
