import { apiClient } from './api';

export interface OperationsKpiSummary {
  totalPassengers: number;
  checkedInPassengers: number;
  embarkationRate: number;
  totalActivitiesScheduled: number;
  totalActivitiesActive: number;
  totalActivityRegistrations: number;
  totalShoreExcursions: number;
  departingExcursionsToday: number;
  totalExcursionBookings: number;
  averageActivityRating: number;
  totalFeedbackSubmitted: number;
  generatedAt: string;
  activitiesByCategory: Record<string, number>;
}

export interface ActivityAttendanceRadarItem {
  activityId: number;
  title: string;
  location: string;
  scheduledTime: string;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
  occupancyRate: number;
}

export interface ExcursionDepartureRadarItem {
  excursionId: number;
  title: string;
  portName: string;
  departureTime: string;
  status: string;
  maxParticipants: number;
  bookedCount: number;
  presentCount: number;
  isDepartingSoon: boolean;
}

export interface OperationsLiveRadar {
  timestamp: string;
  activityRadar: ActivityAttendanceRadarItem[];
  excursionRadar: ExcursionDepartureRadarItem[];
}

export const operationsDashboardService = {
  async getOperationsKpis(): Promise<OperationsKpiSummary> {
    const res = await apiClient.get<{ success: boolean; data: OperationsKpiSummary }>(
      '/api/operations/dashboard/kpis'
    );
    return res.data.data;
  },

  async getLiveOperationsRadar(): Promise<OperationsLiveRadar> {
    const res = await apiClient.get<{ success: boolean; data: OperationsLiveRadar }>(
      '/api/operations/dashboard/live-radar'
    );
    return res.data.data;
  },
};
