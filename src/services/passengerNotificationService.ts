import { apiClient } from './api';

export type NotificationCategory = 'CRITICAL' | 'OPERATIONAL' | 'REMINDER' | 'PROMOTIONAL';

export interface PassengerNotificationDto {
  id: number;
  passengerId: number;
  title: string;
  message: string;
  category: NotificationCategory;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: string;
}

export interface NotificationSummaryDto {
  totalUnread: number;
  criticalUnread: number;
  unreadByCategory: Record<string, number>;
}

export interface ActivityFeedbackRequest {
  passengerId: number;
  rating: number; // 1-5
  organizationRating?: number;
  guideRating?: number;
  valueRating?: number;
  comments?: string;
  idempotencyKey?: string;
}

export interface ActivityFeedbackResponse {
  id: number;
  activityId: number;
  passengerId: number;
  rating: number;
  organizationRating?: number;
  guideRating?: number;
  valueRating?: number;
  comments?: string;
  escalated: boolean;
  escalationReason?: string;
  createdAt: string;
}

export interface ActivityCsatSummaryDto {
  activityId: number;
  averageRating: number;
  totalReviews: number;
  escalatedCount: number;
  ratingDistribution: Record<number, number>;
}

export const passengerNotificationService = {
  getNotifications: async (passengerId: number, category?: NotificationCategory): Promise<PassengerNotificationDto[]> => {
    const params = category ? { category } : {};
    const response = await apiClient.get<{ data: PassengerNotificationDto[] }>(
      `/api/passengers/${passengerId}/notifications`,
      { params }
    );
    return response.data?.data || [];
  },

  getNotificationSummary: async (passengerId: number): Promise<NotificationSummaryDto> => {
    const response = await apiClient.get<{ data: NotificationSummaryDto }>(
      `/api/passengers/${passengerId}/notifications/summary`
    );
    return response.data?.data || { totalUnread: 0, criticalUnread: 0, unreadByCategory: {} };
  },

  markAsRead: async (passengerId: number, notificationId: number): Promise<PassengerNotificationDto> => {
    const response = await apiClient.post<{ data: PassengerNotificationDto }>(
      `/api/passengers/${passengerId}/notifications/${notificationId}/read`
    );
    if (!response.data?.data) {
      throw new Error('Không nhận được dữ liệu phản hồi khi đánh dấu đã đọc');
    }
    return response.data.data;
  },

  markAllAsRead: async (passengerId: number): Promise<void> => {
    await apiClient.post(`/api/passengers/${passengerId}/notifications/read-all`);
  },

  submitActivityFeedback: async (
    activityId: number,
    feedback: ActivityFeedbackRequest
  ): Promise<ActivityFeedbackResponse> => {
    const response = await apiClient.post<{ data: ActivityFeedbackResponse }>(
      `/api/activities/${activityId}/feedback`,
      feedback
    );
    if (!response.data?.data) {
      throw new Error('Không nhận được dữ liệu phản hồi khi gửi đánh giá');
    }
    return response.data.data;
  },

  getActivityFeedbacks: async (activityId: number): Promise<ActivityFeedbackResponse[]> => {
    const response = await apiClient.get<{ data: ActivityFeedbackResponse[] }>(
      `/api/activities/${activityId}/feedback`
    );
    return response.data?.data || [];
  },

  getActivityCsatSummary: async (activityId: number): Promise<ActivityCsatSummaryDto> => {
    const response = await apiClient.get<{ data: ActivityCsatSummaryDto }>(
      `/api/activities/${activityId}/feedback/summary`
    );
    if (!response.data?.data) {
      throw new Error('Không nhận được dữ liệu thống kê CSAT của hoạt động');
    }
    return response.data.data;
  },
};
