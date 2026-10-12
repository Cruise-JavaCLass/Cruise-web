import { apiClient } from './api';

export type ActivityStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OnboardActivity {
  id: number;
  tourId: number;
  dayNumber: number;
  title: string;
  description?: string;
  category: string;
  location: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentParticipants: number;
  price: number;
  isIncluded: boolean;
  status: ActivityStatus;
  cancellationReason?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateActivityPayload {
  tourId: number;
  dayNumber?: number;
  title: string;
  description?: string;
  category?: string;
  location: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
  price?: number;
  isIncluded?: boolean;
  status?: ActivityStatus;
}

export interface UpdateActivityPayload {
  dayNumber?: number;
  title: string;
  description?: string;
  category?: string;
  location: string;
  activityDate: string;
  startTime: string;
  endTime: string;
  maxCapacity?: number;
  price?: number;
  isIncluded?: boolean;
  status?: ActivityStatus;
}

export interface ConfigureTimeAndLocationPayload {
  location: string;
  activityDate?: string;
  startTime: string;
  endTime: string;
}

export interface UpdateActivityStatusPayload {
  status: ActivityStatus;
  cancellationReason?: string;
}

export interface ActivityStatusBadgeConfig {
  cls: string;
  label: string;
  desc?: string;
}

export const ACTIVITY_STATUS_MAP: Record<ActivityStatus, ActivityStatusBadgeConfig> = {
  SCHEDULED: {
    cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    label: 'Lên lịch (SCHEDULED)',
    desc: 'Hoạt động đã được ấn định thời gian, địa điểm và đang mở tiếp nhận đăng ký.',
  },
  IN_PROGRESS: {
    cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20 animate-pulse',
    label: 'Đang diễn ra (IN_PROGRESS)',
    desc: 'Chương trình đang diễn ra tại điểm tổ chức trên tàu. Đang tiến hành check-in.',
  },
  COMPLETED: {
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    label: 'Hoàn thành (COMPLETED)',
    desc: 'Hoạt động đã kết thúc thành công. Đã chốt danh sách tham gia.',
  },
  CANCELLED: {
    cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    label: 'Đã hủy (CANCELLED)',
    desc: 'Hoạt động đã bị hủy do lý do bất khả kháng (thời tiết hoặc vận hành).',
  },
};

export const getActivityStatusConfig = (status: ActivityStatus): ActivityStatusBadgeConfig => {
  return ACTIVITY_STATUS_MAP[status] || {
    cls: 'bg-slate-700 text-slate-300 border-slate-600',
    label: status,
    desc: '',
  };
};

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const INITIAL_ACTIVITIES: OnboardActivity[] = [
  {
    id: 1,
    tourId: 1,
    dayNumber: 1,
    title: 'Yoga Bình Minh Trên Boong Tàu',
    description: 'Thư giãn cơ thể và đón bình minh trên vịnh cùng huấn luyện viên chuyên nghiệp',
    category: 'Wellness & Sức Khỏe',
    location: 'Tầng 12 - Sundeck Hoàng Gia',
    activityDate: '2026-11-01',
    startTime: '06:00',
    endTime: '07:30',
    maxCapacity: 35,
    currentParticipants: 28,
    price: 0,
    isIncluded: true,
    status: 'SCHEDULED',
    active: true,
  },
  {
    id: 2,
    tourId: 1,
    dayNumber: 1,
    title: 'Gala Dinner & Vũ Điệu Hoàng Gia',
    description: 'Dạ tiệc chào mừng với ẩm thực fine-dining Địa Trung Hải và ban nhạc giao hưởng',
    category: 'Dining & Dạ Tiệc',
    location: 'Tầng 7 - Grand Venetian Ballroom',
    activityDate: '2026-11-01',
    startTime: '19:00',
    endTime: '21:30',
    maxCapacity: 300,
    currentParticipants: 245,
    price: 0,
    isIncluded: true,
    status: 'IN_PROGRESS',
    active: true,
  },
  {
    id: 3,
    tourId: 1,
    dayNumber: 2,
    title: 'Lớp Học Nấu Ăn Ẩm Thực Ý & Rượu Vang',
    description: 'Học cách làm pasta tươi thủ công và thưởng thức 4 dòng vang vùng Tuscany',
    category: 'Culinary & Ẩm Thực',
    location: 'Tầng 8 - Gourmet Culinary Studio',
    activityDate: '2026-11-02',
    startTime: '14:00',
    endTime: '16:00',
    maxCapacity: 25,
    currentParticipants: 25,
    price: 350000,
    isIncluded: false,
    status: 'SCHEDULED',
    active: true,
  },
  {
    id: 4,
    tourId: 1,
    dayNumber: 2,
    title: 'Đêm Nhạc Jazz Dưới Ánh Trăng',
    description: 'Thưởng thức nhạc sống acoustic jazz và cocktail độc quyền bên quầy bar',
    category: 'Entertainment & Âm Nhạc',
    location: 'Tầng 14 - Sky Horizon Lounge',
    activityDate: '2026-11-02',
    startTime: '20:30',
    endTime: '23:00',
    maxCapacity: 80,
    currentParticipants: 62,
    price: 150000,
    isIncluded: false,
    status: 'SCHEDULED',
    active: true,
  },
  {
    id: 5,
    tourId: 1,
    dayNumber: 3,
    title: 'Thử Thách Leo Núi Ngoài Trời',
    description: 'Chinh phục tường leo núi thể thao cao 12 mét hướng tầm nhìn ra đại dương',
    category: 'Sports & Thể Thao',
    location: 'Tầng 15 - SeaSports Deck',
    activityDate: '2026-11-03',
    startTime: '08:30',
    endTime: '10:30',
    maxCapacity: 40,
    currentParticipants: 18,
    price: 0,
    isIncluded: true,
    status: 'COMPLETED',
    active: true,
  },
  {
    id: 6,
    tourId: 1,
    dayNumber: 3,
    title: 'Tiệc Hồ Bơi Chiều Hoàng Hôn',
    description: 'Bị hủy do điều kiện thời tiết gió lốc ngoài khơi để đảm bảo an toàn cho hành khách',
    category: 'Entertainment & Âm Nhạc',
    location: 'Tầng 11 - Oasis Pool & Bar',
    activityDate: '2026-11-03',
    startTime: '16:00',
    endTime: '18:30',
    maxCapacity: 150,
    currentParticipants: 0,
    price: 0,
    isIncluded: true,
    status: 'CANCELLED',
    cancellationReason: 'Thời tiết biển có gió giật cấp 6, đảm bảo an toàn cho du khách',
    active: true,
  },
];

let inMemoryActivities: OnboardActivity[] = [...INITIAL_ACTIVITIES];

export const fetchActivitiesByTour = async (tourId: number): Promise<OnboardActivity[]> => {
  try {
    const res = await apiClient.get<{ success: boolean; data: OnboardActivity[] }>(`/activities/tour/${tourId}`);
    if (res.data?.data) {
      return res.data.data;
    }
  } catch {
    // fallback to local mock
  }
  return inMemoryActivities.filter((a) => a.tourId === tourId && a.active);
};

export const fetchActivitiesPaged = async (
  tourId: number,
  params: {
    dayNumber?: number;
    category?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<OnboardActivity>> => {
  try {
    const res = await apiClient.get<{ success: boolean; data: PageResponse<OnboardActivity> }>(
      `/activities/tour/${tourId}/paged`,
      { params }
    );
    if (res.data?.data) {
      return res.data.data;
    }
  } catch {
    // fallback to local mock
  }

  const query = params.keyword?.toLowerCase().trim();
  const day = params.dayNumber;
  const categoryFilter = params.category && params.category !== 'ALL' ? params.category.toLowerCase() : null;

  const filtered = inMemoryActivities.filter((act) => {
    if (act.tourId !== tourId || !act.active) return false;
    if (day && day > 0 && act.dayNumber !== day) return false;
    if (categoryFilter && !act.category.toLowerCase().includes(categoryFilter)) return false;
    if (query) {
      const haystack = `${act.title} ${act.location} ${act.description ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const page = params.page ?? 0;
  const size = params.size ?? 10;
  return {
    content: filtered.slice(page * size, (page + 1) * size),
    totalElements: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    size,
    number: page,
  };
};

export const fetchActivityById = async (id: number): Promise<OnboardActivity | null> => {
  try {
    const res = await apiClient.get<{ success: boolean; data: OnboardActivity }>(`/activities/${id}`);
    if (res.data?.data) {
      return res.data.data;
    }
  } catch {
    // fallback to local mock
  }
  return inMemoryActivities.find((a) => a.id === id && a.active) || null;
};

export const createActivity = async (payload: CreateActivityPayload): Promise<OnboardActivity> => {
  try {
    const res = await apiClient.post<{ success: boolean; data: OnboardActivity }>('/activities', payload);
    if (res.data?.data) {
      inMemoryActivities.push(res.data.data);
      return res.data.data;
    }
  } catch {
    // fallback to local mock
  }

  const newActivity: OnboardActivity = {
    id: Date.now(),
    tourId: payload.tourId,
    dayNumber: payload.dayNumber || 1,
    title: payload.title,
    description: payload.description,
    category: payload.category || 'General',
    location: payload.location,
    activityDate: payload.activityDate,
    startTime: payload.startTime,
    endTime: payload.endTime,
    maxCapacity: payload.maxCapacity || 50,
    currentParticipants: 0,
    price: payload.price || 0,
    isIncluded: payload.isIncluded !== undefined ? payload.isIncluded : true,
    status: payload.status || 'SCHEDULED',
    active: true,
    createdAt: new Date().toISOString(),
  };

  inMemoryActivities.push(newActivity);
  return newActivity;
};

export const updateActivity = async (id: number, payload: UpdateActivityPayload): Promise<OnboardActivity> => {
  try {
    const res = await apiClient.put<{ success: boolean; data: OnboardActivity }>(`/activities/${id}`, payload);
    if (res.data?.data) {
      inMemoryActivities = inMemoryActivities.map((a) => (a.id === id ? res.data.data : a));
      return res.data.data;
    }
  } catch {
    // fallback to local mock
  }

  const index = inMemoryActivities.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('Activity not found');
  }

  const updated: OnboardActivity = {
    ...inMemoryActivities[index],
    ...payload,
    category: payload.category || inMemoryActivities[index].category,
    price: payload.price !== undefined ? payload.price : inMemoryActivities[index].price,
    isIncluded: payload.isIncluded !== undefined ? payload.isIncluded : inMemoryActivities[index].isIncluded,
    updatedAt: new Date().toISOString(),
  };

  inMemoryActivities[index] = updated;
  return updated;
};

export const updateActivityStatus = async (
  id: number,
  payload: UpdateActivityStatusPayload
): Promise<OnboardActivity> => {
  try {
    const res = await apiClient.patch<{ success: boolean; data: OnboardActivity }>(`/activities/${id}/status`, payload);
    if (res.data?.data) {
      inMemoryActivities = inMemoryActivities.map((a) => (a.id === id ? res.data.data : a));
      return res.data.data;
    }
  } catch {
    // fallback to local mock
  }

  const index = inMemoryActivities.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('Activity not found');
  }

  inMemoryActivities[index].status = payload.status;
  if (payload.cancellationReason) {
    inMemoryActivities[index].cancellationReason = payload.cancellationReason;
  }
  return inMemoryActivities[index];
};

export const deleteActivity = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`/activities/${id}`);
  } catch {
    // fallback to local mock
  }
  inMemoryActivities = inMemoryActivities.map((a) =>
    a.id === id ? { ...a, active: false, status: 'CANCELLED' } : a
  );
};
