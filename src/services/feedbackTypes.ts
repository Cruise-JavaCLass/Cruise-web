export type FeedbackCategory =
  | 'CABIN_SERVICE'
  | 'DINING_EXPERIENCE'
  | 'SHORE_EXCURSION'
  | 'ENTERTAINMENT_ACTIVITY'
  | 'GUEST_RELATIONS'
  | 'GENERAL_ONBOARD';

export type FeedbackStatus = 'NEW' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';

export interface SubmitPassengerReviewRequest {
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  category: FeedbackCategory;
  rating: number;
  comments?: string;
  serviceOutlet?: string;
}

export interface PassengerServiceReviewResponse {
  id: number;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  category: FeedbackCategory;
  rating: number;
  sentiment: string;
  comments?: string;
  serviceOutlet?: string;
  status: FeedbackStatus;
  isLowRatingAlert: boolean;
  escalationReason?: string;
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface FeedbackAnalyticsDto {
  totalReviews: number;
  averageRating: number;
  lowRatingAlertCount: number;
  escalatedCount: number;
  resolvedCount: number;
  ratingDistribution: Record<number, number>;
  categoryAverages: Record<string, number>;
}

export interface TriageReviewRequest {
  status: FeedbackStatus;
  adminNotes?: string;
  resolvedBy?: string;
}
