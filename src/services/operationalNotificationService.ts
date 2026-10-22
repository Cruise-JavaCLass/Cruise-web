import { apiClient } from './api';

export type NotificationCategory = 'CRITICAL' | 'ACTIVITY' | 'SYSTEM' | 'PROMOTION' | 'DINING' | 'SAFETY';
export type NotificationScope = 'ALL' | 'CREW_ONLY' | 'PASSENGER_ONLY' | 'DECK' | 'ZONE';

export interface OperationalBroadcastRequest {
  title: string;
  message: string;
  category: NotificationCategory;
  scope: NotificationScope;
  targetDeck?: number;
  targetZone?: string;
  actionUrl?: string;
  playAlertSound?: boolean;
  requireAcknowledgment?: boolean;
  metadata?: Record<string, any>;
}

export interface OperationalNotificationEvent {
  broadcastId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  scope: NotificationScope;
  targetDeck?: number;
  targetZone?: string;
  actionUrl?: string;
  playAlertSound?: boolean;
  requireAcknowledgment?: boolean;
  broadcastAt: string;
  recipientCount: number;
  metadata?: Record<string, any>;
}

export const operationalNotificationService = {
  async broadcastAlert(req: OperationalBroadcastRequest): Promise<OperationalNotificationEvent> {
    const res = await apiClient.post<{ success: boolean; data: OperationalNotificationEvent }>(
      '/api/operations/notifications/broadcast',
      req
    );
    return res.data.data;
  },

  createAlertEventSource(): EventSource {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return new EventSource(`${baseUrl}/api/operations/notifications/stream`);
  },
};
