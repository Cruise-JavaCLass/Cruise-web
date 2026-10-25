import { apiClient as api } from './api';
import type {
  SubmitPassengerReviewRequest,
  PassengerServiceReviewResponse,
  FeedbackAnalyticsDto,
  TriageReviewRequest,
  FeedbackStatus,
  FeedbackCategory,
} from './feedbackTypes';

export const passengerReviewService = {
  async submitReview(request: SubmitPassengerReviewRequest): Promise<PassengerServiceReviewResponse> {
    const response = await api.post<{ success: boolean; data: PassengerServiceReviewResponse }>(
      '/feedback/reviews',
      request
    );
    return response.data.data;
  },

  async getReviews(params?: {
    status?: FeedbackStatus;
    category?: FeedbackCategory;
    isAlert?: boolean;
    page?: number;
    size?: number;
  }): Promise<{ content: PassengerServiceReviewResponse[]; totalElements: number }> {
    const response = await api.get<{
      success: boolean;
      data: { content: PassengerServiceReviewResponse[]; totalElements: number };
    }>('/feedback/reviews', { params });
    return response.data.data;
  },

  async getAnalytics(): Promise<FeedbackAnalyticsDto> {
    const response = await api.get<{ success: boolean; data: FeedbackAnalyticsDto }>(
      '/feedback/reviews/analytics'
    );
    return response.data.data;
  },

  async triageReview(reviewId: number, request: TriageReviewRequest): Promise<PassengerServiceReviewResponse> {
    const response = await api.patch<{ success: boolean; data: PassengerServiceReviewResponse }>(
      `/feedback/reviews/${reviewId}/triage`,
      request
    );
    return response.data.data;
  },
};
