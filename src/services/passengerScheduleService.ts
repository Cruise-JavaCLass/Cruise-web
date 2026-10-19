import { apiClient } from './api';

export type ScheduleItemType = 'ACTIVITY' | 'EXCURSION';
export type ScheduleItemStatus = 'REGISTERED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
export type ScheduleScope = 'my' | 'cabin';

export interface PersonalScheduleItem {
  eventId: number;
  itemType: ScheduleItemType;
  title: string;
  category: string;
  dayNumber: number;
  activityDate: string;
  startTime: string;
  endTime: string;
  assemblyTime?: string;
  departureTime?: string;
  assemblyWarning?: string;
  location: string;
  deck?: string;
  status: ScheduleItemStatus;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  ticketCode?: string;
  price: number;
  isIncluded: boolean;
  hasConflict: boolean;
  conflictReason?: string;
  conflictWithIds: number[];
}

export interface ScheduleConflict {
  firstEventId: number;
  firstEventTitle: string;
  firstEventType: string;
  firstStartTime: string;
  firstEndTime: string;
  secondEventId: number;
  secondEventTitle: string;
  secondEventType: string;
  secondStartTime: string;
  secondEndTime: string;
  overlapMinutes: number;
  description: string;
}

export interface PersonalScheduleResponse {
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  dayNumber?: number;
  scope: ScheduleScope;
  totalItems: number;
  totalConflicts: number;
  items: PersonalScheduleItem[];
  conflicts: ScheduleConflict[];
}

interface CacheWrapper<T> {
  data: T;
  cachedAt: string;
}

const CACHE_PREFIX = 'cruise_schedule_cache_';

export const passengerScheduleService = {
  /**
   * Lấy dòng thời gian lịch trình cá nhân / cabin theo ngày của hành khách (KAN-349 / KAN-350)
   */
  getPersonalSchedule: async (
    passengerId: number,
    day?: number,
    scope: ScheduleScope = 'my'
  ): Promise<PersonalScheduleResponse> => {
    const params = new URLSearchParams();
    if (day !== undefined && day !== null) {
      params.append('day', day.toString());
    }
    params.append('scope', scope);

    try {
      const response = await apiClient.get<{ data: PersonalScheduleResponse }>(
        `/passengers/${passengerId}/personal-schedule?${params.toString()}`
      );
      const data = response.data.data;
      passengerScheduleService.saveToCache(passengerId, day, scope, data);
      return data;
    } catch (error) {
      console.warn('API /api/passengers/:id/personal-schedule không khả dụng, kiểm tra cache offline...', error);
      const cached = passengerScheduleService.loadFromCache(passengerId, day, scope);
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  },

  /**
   * Lấy danh sách xung đột lịch trình cá nhân (KAN-350)
   */
  getScheduleConflicts: async (passengerId: number, day?: number): Promise<ScheduleConflict[]> => {
    const params = new URLSearchParams();
    if (day !== undefined && day !== null) {
      params.append('day', day.toString());
    }

    try {
      const response = await apiClient.get<{ data: ScheduleConflict[] }>(
        `/passengers/${passengerId}/personal-schedule/conflicts?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.warn('API conflicts không khả dụng, sử dụng tính toán cục bộ...', error);
      return [];
    }
  },

  /**
   * Lưu dữ liệu lịch trình vào LocalStorage phục vụ ngoại tuyến (KAN-353)
   */
  saveToCache: (
    passengerId: number,
    day: number | undefined,
    scope: string,
    data: PersonalScheduleResponse
  ): void => {
    try {
      const key = `${CACHE_PREFIX}${passengerId}_${day ?? 'all'}_${scope}`;
      const wrapper: CacheWrapper<PersonalScheduleResponse> = {
        data,
        cachedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      localStorage.setItem(key, JSON.stringify(wrapper));
    } catch (err) {
      console.warn('Không thể ghi cache LocalStorage:', err);
    }
  },

  /**
   * Đọc dữ liệu từ cache LocalStorage (KAN-353)
   */
  loadFromCache: (
    passengerId: number,
    day: number | undefined,
    scope: string
  ): CacheWrapper<PersonalScheduleResponse> | null => {
    try {
      const key = `${CACHE_PREFIX}${passengerId}_${day ?? 'all'}_${scope}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as CacheWrapper<PersonalScheduleResponse>;
      }
    } catch (err) {
      console.warn('Không thể đọc cache LocalStorage:', err);
    }
    return null;
  },
};
