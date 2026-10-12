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

  let filtered = inMemoryActivities.filter((a) => a.tourId === tourId && a.active);

  if (params.dayNumber !== undefined && params.dayNumber !== null && params.dayNumber > 0) {
    filtered = filtered.filter((a) => a.dayNumber === params.dayNumber);
  }

  if (params.category && params.category !== 'ALL') {
    filtered = filtered.filter((a) =>
      a.category.toLowerCase().includes(params.category!.toLowerCase())
    );
  }

  if (params.keyword && params.keyword.trim() !== '') {
    const q = params.keyword.toLowerCase().trim();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
    );
  }

  const page = params.page || 0;
  const size = params.size || 10;
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const pagedContent = filtered.slice(page * size, (page + 1) * size);

  return {
    content: pagedContent,
    totalElements,
    totalPages,
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
