import { apiClient } from './api';

export interface ExcursionReviewRequest {
  passengerId: number;
  ratingOverall: number;
  ratingGuide?: number;
  ratingBus?: number;
  ratingValue?: number;
  comments?: string;
}

export interface ExcursionReview {
  id: number;
  excursionId: number;
  passengerId: number;
  ratingOverall: number;
  ratingGuide?: number;
  ratingBus?: number;
  ratingValue?: number;
  comments?: string;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
}

export interface BusDetail {
  vehicleId: number;
  vehicleCode: string;
  licensePlate: string;
  vehicleType: string;
  driverName: string;
  capacity: number;
  assignedPassengers: number;
  occupancyRate: number;
  status: string;
}

export interface ExcursionFleetOccupancy {
  excursionId: number;
  excursionTitle: string;
  portId: number;
  portName: string;
  localProvider: string;
  totalBuses: number;
  totalCapacity: number;
  totalAssignedPassengers: number;
  occupancyRate: number;
  buses: BusDetail[];
}

export interface PortFleetSummary {
  portId: number;
  portName: string;
  busCount: number;
  totalCapacity: number;
  assignedPassengers: number;
  occupancyRate: number;
}

export interface ProviderFleetSummary {
  providerName: string;
  busCount: number;
  totalCapacity: number;
  assignedPassengers: number;
  occupancyRate: number;
}

export interface FleetOccupancyAnalyticsResponse {
  totalFleetCount: number;
  totalFleetCapacity: number;
  totalPassengersSeated: number;
  overallFleetOccupancyRate: number;
  portSummaries: PortFleetSummary[];
  providerSummaries: ProviderFleetSummary[];
  excursions: ExcursionFleetOccupancy[];
}

export interface ProviderScorecard {
  providerName: string;
  totalExcursions: number;
  totalReviews: number;
  averageRating: number;
  averageGuideRating: number;
  averageBusRating: number;
  averageValueRating: number;
  flaggedCount: number;
  performanceTier: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'HIGH_RISK' | 'UNRATED';
}

export interface GuideRating {
  guideId: number;
  guideName: string;
  guideCode: string;
  role: string;
  averageRating: number;
  totalAssignedExcursions: number;
}

export interface ExcursionOpsKpi {
  totalExcursions: number;
  totalReviews: number;
  averageOverallRating: number;
  averageGuideRating: number;
  averageBusRating: number;
  averageValueRating: number;
  totalFlaggedReviews: number;
  providerScorecards: ProviderScorecard[];
  guideRatings: GuideRating[];
}

export const getFleetOccupancyAnalytics = async (
  portId?: number,
  provider?: string
): Promise<FleetOccupancyAnalyticsResponse> => {
  const params: Record<string, string | number> = {};
  if (portId) params.portId = portId;
  if (provider) params.provider = provider;

  const res = await apiClient.get<{ success: boolean; data: FleetOccupancyAnalyticsResponse }>(
    '/excursions/analytics/fleet-occupancy',
    { params }
  );
  return res.data.data;
};

export const getExcursionOpsKpi = async (): Promise<ExcursionOpsKpi> => {
  const res = await apiClient.get<{ success: boolean; data: ExcursionOpsKpi }>(
    '/excursions/analytics/kpi'
  );
  return res.data.data;
};

export const getExcursionReviews = async (
  excursionId: number,
  page = 0,
  size = 20
): Promise<{ content: ExcursionReview[]; totalElements: number }> => {
  const res = await apiClient.get<{
    success: boolean;
    data: { content: ExcursionReview[]; totalElements: number };
  }>(`/excursions/${excursionId}/reviews`, {
    params: { page, size },
  });
  return res.data.data;
};

export const getFlaggedReviews = async (): Promise<ExcursionReview[]> => {
  const res = await apiClient.get<{ success: boolean; data: ExcursionReview[] }>(
    '/excursions/reviews/flagged'
  );
  return res.data.data;
};

export const submitExcursionReview = async (
  excursionId: number,
  payload: ExcursionReviewRequest,
  idempotencyKey?: string
): Promise<ExcursionReview> => {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const res = await apiClient.post<{ success: boolean; data: ExcursionReview }>(
    `/excursions/${excursionId}/reviews`,
    payload,
    { headers }
  );
  return res.data.data;
};
