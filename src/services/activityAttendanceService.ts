import { apiClient } from './api';

export type ActivityAttendanceStatus = 'REGISTERED' | 'CHECKED_IN' | 'CANCELLED';
export type ActivityCheckInMethod = 'QR_CODE' | 'RFID' | 'MANUAL' | 'WALK_IN';

export interface ActivityPassResponse {
  token: string;
  expiresAt: string;
  activityId: number;
  activityTitle: string;
  category: string;
  venue: string;
  location: string;
  deck: string;
  startTime: string;
  endTime: string;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  rfidTag?: string;
}

export interface ActivityCheckInRequest {
  qrToken?: string;
  rfidTag?: string;
  passengerId?: number;
  cabinNumber?: string;
  staffId?: string;
  staffName?: string;
  deviceId?: string;
  note?: string;
}

export interface ActivityCheckInResponse {
  attendanceId: number;
  activityId: number;
  activityTitle: string;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  status: string;
  checkInTime: string;
  staffId?: string;
  staffName?: string;
  method: string;
  message: string;
}

export interface WalkInCheckInRequest {
  passengerId?: number;
  rfidTag?: string;
  cabinNumber?: string;
  passengerName?: string;
  staffId?: string;
  deviceId?: string;
  feePaid?: number;
  paymentMethod?: string;
  note?: string;
}

export interface WalkInCheckInResponse {
  attendanceId: number;
  activityId: number;
  activityTitle: string;
  passengerId?: number;
  passengerName: string;
  cabinNumber?: string;
  chargedAmount: number;
  transactionId: string;
  status: string;
  checkInTime: string;
  isWalkIn: boolean;
  message: string;
}

export interface ActivityAttendanceSummaryResponse {
  activityId: number;
  activityTitle: string;
  totalRegistered: number;
  checkedInCount: number;
  pendingCount: number;
  walkInCount: number;
  maxCapacity: number;
  remainingCapacity: number;
  attendanceRatePercentage: number;
  venue: string;
  startTime: string;
  endTime: string;
}

export interface ActivityRosterPassengerResponse {
  attendanceId: number;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  rfidTag?: string;
  status: ActivityAttendanceStatus;
  checkedInAt?: string;
  checkedInByStaffId?: string;
  checkInMethod?: ActivityCheckInMethod;
  isWalkIn: boolean;
  deviceId?: string;
  note?: string;
}

export interface OfflineCheckInItem {
  qrToken?: string;
  rfidTag?: string;
  passengerId?: number;
  cabinNumber?: string;
  staffId?: string;
  deviceId?: string;
  scannedAt: string;
}

export interface OfflineCheckInBatchRequest {
  deviceId: string;
  batchTimestamp: string;
  records: OfflineCheckInItem[];
}

export interface OfflineCheckInBatchResponse {
  activityId: number;
  processedCount: number;
  duplicateCount: number;
  failedCount: number;
  message: string;
}

export interface PagedRosterResponse {
  content: ActivityRosterPassengerResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Helper giải nén phong bì phản hồi chuẩn ApiResponse<T>, ném lỗi kiểu rõ ràng nếu dữ liệu rỗng
 */
function unwrapResponse<T>(response: { data?: { data?: T } }): T {
  if (response?.data?.data === undefined || response?.data?.data === null) {
    throw new Error('Dữ liệu phản hồi từ máy chủ không hợp lệ hoặc bị rỗng');
  }
  return response.data.data;
}

export const activityAttendanceService = {
  /**
   * Sinh mã QR Pass động bảo mật có TTL 60s cho hành khách (KAN-222)
   */
  getActivityPass: async (activityId: number, passengerId: number): Promise<ActivityPassResponse> => {
    const response = await apiClient.get<{ data: ActivityPassResponse }>(
      `/activities/${activityId}/passengers/${passengerId}/qr-pass`
    );
    return unwrapResponse(response);
  },

  /**
   * Soát vé và điểm danh hoạt động đa kênh (QR, RFID, Thủ công - KAN-222)
   */
  checkIn: async (activityId: number, payload: ActivityCheckInRequest): Promise<ActivityCheckInResponse> => {
    const response = await apiClient.post<{ data: ActivityCheckInResponse }>(
      `/activities/${activityId}/check-in`,
      payload
    );
    return unwrapResponse(response);
  },

  /**
   * Đăng ký và điểm danh khách vãng lai (Walk-in) tại cửa (KAN-320)
   */
  walkInCheckIn: async (activityId: number, payload: WalkInCheckInRequest): Promise<WalkInCheckInResponse> => {
    const response = await apiClient.post<{ data: WalkInCheckInResponse }>(
      `/activities/${activityId}/check-in/walk-in`,
      payload
    );
    return unwrapResponse(response);
  },

  /**
   * Lấy số liệu thống kê điểm danh hoạt động thời gian thực (KAN-321)
   */
  getAttendanceSummary: async (activityId: number): Promise<ActivityAttendanceSummaryResponse> => {
    const response = await apiClient.get<{ data: ActivityAttendanceSummaryResponse }>(
      `/activities/${activityId}/attendance/summary`
    );
    return unwrapResponse(response);
  },

  /**
   * Lấy danh sách điểm danh hành khách (Roster) có bộ lọc và phân trang (KAN-321)
   */
  getActivityRoster: async (
    activityId: number,
    params?: {
      status?: ActivityAttendanceStatus;
      keyword?: string;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }
  ): Promise<PagedRosterResponse> => {
    const response = await apiClient.get<{ data: PagedRosterResponse }>(
      `/activities/${activityId}/attendance/roster`,
      { params }
    );
    return unwrapResponse(response);
  },

  /**
   * Đồng bộ hàng loạt lượt soát vé ngoại tuyến từ máy quét POS (KAN-321)
   */
  syncOfflineBatch: async (
    activityId: number,
    payload: OfflineCheckInBatchRequest
  ): Promise<OfflineCheckInBatchResponse> => {
    const response = await apiClient.post<{ data: OfflineCheckInBatchResponse }>(
      `/activities/${activityId}/check-in/offline-sync`,
      payload
    );
    return unwrapResponse(response);
  },
};
