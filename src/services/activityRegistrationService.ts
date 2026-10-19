import { apiClient } from './api';

export interface ActivityRegistrationResponse {
  registrationId: number;
  activityId: number;
  activityTitle: string;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | string;
  chargedAmount: number;
  transactionId?: string;
  registeredAt: string;
  waitlistPosition?: number;
}

export interface ActivityCancellationResponse {
  registrationId: number;
  status: string;
  refundAmount: number;
  waitlistPromotedPassengerId?: number;
  cancellationReason?: string;
  cancelledAt: string;
}

export interface ActivityRosterItem {
  registrationId: number;
  activityId: number;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  tourPackage?: string;
  status: string;
  chargedAmount: number;
  transactionId?: string;
  registeredAt: string;
}

export interface WaitlistQueueItem {
  position: number;
  registrationId: number;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  registeredAt: string;
  status: string;
}

export interface PassengerRegistrationItem {
  registrationId: number;
  activityId: number;
  activityTitle: string;
  category: string;
  location: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  status: string;
  chargedAmount: number;
  refundAmount?: number;
  transactionId?: string;
  registeredAt: string;
  waitlistPosition?: number;
  cancellationCutOffMinutes?: number;
}

export interface PagedRosterResponse {
  content: ActivityRosterItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const activityRegistrationService = {
  /**
   * Đăng ký tham gia hoạt động (KAN-216)
   */
  async registerActivity(
    activityId: number,
    data: { passengerId: number; cabinNumber?: string; notes?: string }
  ): Promise<ActivityRegistrationResponse> {
    const res = await apiClient.post<{ success: boolean; data: ActivityRegistrationResponse }>(
      `/api/activities/${activityId}/registrations`,
      data
    );
    return res.data.data;
  },

  /**
   * Hủy đăng ký hoạt động với chính sách Cut-off và hoàn tiền Folio (KAN-369)
   */
  async cancelRegistration(
    activityId: number,
    registrationId: number,
    params?: { passengerId?: number; reason?: string }
  ): Promise<ActivityCancellationResponse> {
    const query = new URLSearchParams();
    if (params?.passengerId) query.append('passengerId', params.passengerId.toString());
    if (params?.reason) query.append('reason', params.reason);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.delete<{ success: boolean; data: ActivityCancellationResponse }>(
      `/api/activities/${activityId}/registrations/${registrationId}${queryString}`
    );
    return res.data.data;
  },

  /**
   * Nhân viên đôn suất thủ công từ Waitlist lên Confirmed (KAN-369)
   */
  async promoteWaitlist(activityId: number, waitlistId: number): Promise<ActivityRegistrationResponse> {
    const res = await apiClient.post<{ success: boolean; data: ActivityRegistrationResponse }>(
      `/api/activities/${activityId}/waitlist/${waitlistId}/promote`
    );
    return res.data.data;
  },

  /**
   * Lấy danh sách đăng ký phân trang (Roster) theo hoạt động (KAN-370)
   */
  async getRosterPaged(
    activityId: number,
    params: {
      keyword?: string;
      status?: string;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: string;
    } = {}
  ): Promise<PagedRosterResponse> {
    const query = new URLSearchParams();
    if (params.keyword) query.append('keyword', params.keyword);
    if (params.status) query.append('status', params.status);
    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.size !== undefined) query.append('size', params.size.toString());
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortDir) query.append('sortDir', params.sortDir);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiClient.get<{ success: boolean; data: PagedRosterResponse }>(
      `/api/activities/${activityId}/registrations/roster${queryString}`
    );
    return res.data.data;
  },

  /**
   * Lấy danh sách hàng đợi Waitlist theo thứ tự ưu tiên (KAN-370)
   */
  async getWaitlistQueue(activityId: number): Promise<WaitlistQueueItem[]> {
    const res = await apiClient.get<{ success: boolean; data: WaitlistQueueItem[] }>(
      `/api/activities/${activityId}/waitlist`
    );
    return res.data.data;
  },

  /**
   * Lấy danh sách hoạt động đã đăng ký của hành khách (KAN-370)
   */
  async getMyRegistrations(activityId: number, passengerId: number): Promise<PassengerRegistrationItem[]> {
    const res = await apiClient.get<{ success: boolean; data: PassengerRegistrationItem[] }>(
      `/api/activities/${activityId}/registrations/my?passengerId=${passengerId}`
    );
    return res.data.data;
  },

  /**
   * Xuất danh sách đăng ký dạng CSV (KAN-370)
   */
  async exportRosterCsv(activityId: number): Promise<Blob> {
    const res = await apiClient.get(`/api/activities/${activityId}/registrations/export/csv`, {
      responseType: 'blob'
    });
    return res.data;
  }
};
