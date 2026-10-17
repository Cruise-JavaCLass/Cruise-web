import { isAxiosError } from 'axios';
import { apiClient } from './api';

export type ExcursionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DELAYED';
export type ExcursionDifficulty = 'EASY' | 'MODERATE' | 'CHALLENGING';
export type ExcursionCategory =
  | 'CULTURAL'
  | 'ADVENTURE'
  | 'CULINARY'
  | 'SIGHTSEEING'
  | 'WATER_SPORTS'
  | 'NATURE';

export interface ExcursionPassenger {
  id: number;
  passengerName: string;
  cabinNumber: string;
  ticketCode: string;
  busNumber: string;
  groupName: string;
  emergencyPhone: string;
  status: 'REGISTERED' | 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE';
  specialRequirements?: string;
}

export interface ShoreExcursion {
  id: number;
  tourId: number;
  tourName?: string;
  portId: number;
  portName: string;
  portCity: string;
  title: string;
  code: string;
  description: string;
  category: ExcursionCategory;
  difficulty: ExcursionDifficulty;
  operatorName: string;
  operatorContact: string;
  guideName: string;
  guidePhone: string;
  busNumber: string;
  excursionDate: string;
  meetingTime: string;
  departureTime: string;
  returnToShipTime: string;
  allAboardTime: string;
  maxCapacity: number;
  bookedCount: number;
  price: number;
  currency: string;
  isIncluded: boolean;
  status: ExcursionStatus;
  delayReason?: string;
  cancellationReason?: string;
  imageUrl?: string;
  active: boolean;
  passengers?: ExcursionPassenger[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExcursionFormData {
  tourId: number | '';
  portId: number | '';
  title: string;
  code: string;
  description: string;
  category: ExcursionCategory;
  difficulty: ExcursionDifficulty;
  operatorName: string;
  operatorContact: string;
  guideName: string;
  guidePhone: string;
  busNumber: string;
  excursionDate: string;
  meetingTime: string;
  departureTime: string;
  returnToShipTime: string;
  allAboardTime: string;
  maxCapacity: number | '';
  price: number | '';
  currency: string;
  isIncluded: boolean;
  status: ExcursionStatus;
  imageUrl?: string;
}

export interface ExcursionFormErrors {
  [key: string]: string | undefined;
}

export interface ExcursionStatusBadgeConfig {
  cls: string;
  label: string;
  desc: string;
}

export const EXCURSION_STATUS_MAP: Record<ExcursionStatus, ExcursionStatusBadgeConfig> = {
  SCHEDULED: {
    cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    label: 'Lên lịch (SCHEDULED)',
    desc: 'Tour trên bờ đã chốt kế hoạch, điểm tập trung và đang tiếp nhận đặt chỗ.',
  },
  IN_PROGRESS: {
    cls: 'bg-blue-500/10 text-blue-300 border-blue-500/20 animate-pulse',
    label: 'Đang khởi hành (IN_PROGRESS)',
    desc: 'Đoàn khách đang tham gia tour trên bờ tại điểm đến địa phương.',
  },
  DELAYED: {
    cls: 'bg-amber-500/10 text-amber-300 border-amber-500/30 font-semibold',
    label: 'Bị trễ giờ (DELAYED)',
    desc: 'Tour bị chậm so với lịch trình dự kiến. Bộ phận điều phối cần theo dõi sát giờ All-Aboard.',
  },
  COMPLETED: {
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    label: 'Hoàn thành (COMPLETED)',
    desc: 'Tất cả hành khách đã quay trở lại tàu an toàn trước giờ xuất bến.',
  },
  CANCELLED: {
    cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    label: 'Đã hủy (CANCELLED)',
    desc: 'Tour đã bị hủy do lý do thời tiết xấu, cảng đến thay đổi hoặc kỹ thuật.',
  },
};

export const EXCURSION_CATEGORY_LABELS: Record<ExcursionCategory, string> = {
  CULTURAL: 'Văn hóa & Di sản',
  ADVENTURE: 'Khám phá & Phiêu lưu',
  CULINARY: 'Ẩm thực Địa phương',
  SIGHTSEEING: 'Tham quan Thưởng ngoạn',
  WATER_SPORTS: 'Thể thao Biển & Lặn',
  NATURE: 'Sinh thái & Thiên nhiên',
};

export const EXCURSION_DIFFICULTY_LABELS: Record<ExcursionDifficulty, { label: string; color: string }> = {
  EASY: { label: 'Nhẹ nhàng', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  MODERATE: { label: 'Trung bình', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  CHALLENGING: { label: 'Thử thách', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

export const EXCURSION_STATUS_TRANSITIONS: Record<ExcursionStatus, ExcursionStatus[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'DELAYED'],
  IN_PROGRESS: ['COMPLETED', 'DELAYED', 'CANCELLED'],
  DELAYED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['SCHEDULED'],
};

export function canTransitionExcursionStatus(current: ExcursionStatus, target: ExcursionStatus): boolean {
  if (current === target) return true;
  return EXCURSION_STATUS_TRANSITIONS[current]?.includes(target) ?? false;
}

export const INITIAL_EXCURSION_PASSENGERS: ExcursionPassenger[] = [
  {
    id: 1,
    passengerName: 'Nguyễn Văn An',
    cabinNumber: 'Suite-801',
    ticketCode: 'EXC-TKT-101',
    busNumber: 'XE-01 (45 Chỗ)',
    groupName: 'Đoàn A - Khám phá',
    emergencyPhone: '+84 912 345 678',
    status: 'RETURNED_SAFE',
    specialRequirements: 'Ăn chay',
  },
  {
    id: 2,
    passengerName: 'Trần Thị Thu Mai',
    cabinNumber: 'Balcony-504',
    ticketCode: 'EXC-TKT-102',
    busNumber: 'XE-01 (45 Chỗ)',
    groupName: 'Đoàn A - Khám phá',
    emergencyPhone: '+84 988 765 432',
    status: 'ON_TOUR',
  },
  {
    id: 3,
    passengerName: 'Lê Hoàng Long',
    cabinNumber: 'Ocean-312',
    ticketCode: 'EXC-TKT-103',
    busNumber: 'XE-02 (29 Chỗ)',
    groupName: 'Đoàn B - Ẩm thực',
    emergencyPhone: '+84 903 112 233',
    status: 'CHECKED_IN',
  },
  {
    id: 4,
    passengerName: 'Phạm Hồng Hạnh',
    cabinNumber: 'Interior-208',
    ticketCode: 'EXC-TKT-104',
    busNumber: 'XE-02 (29 Chỗ)',
    groupName: 'Đoàn B - Ẩm thực',
    emergencyPhone: '+84 971 889 900',
    status: 'REGISTERED',
  },
];

export const INITIAL_EXCURSIONS: ShoreExcursion[] = [
  {
    id: 1,
    tourId: 1,
    tourName: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
    portId: 1,
    portName: 'Cảng Quốc Tế Tuần Châu',
    portCity: 'Hạ Long',
    title: 'Khám phá Hang Sửng Sốt & Đảo Ti Tốp',
    code: 'EXC-HL-01',
    description: 'Thuyền trung chuyển đưa du khách tham quan hang động karst kỳ vĩ nhất vịnh và tắm biển leo núi ngắm toàn cảnh Vịnh Hạ Long.',
    category: 'SIGHTSEEING',
    difficulty: 'MODERATE',
    operatorName: 'Halong Heritage Travel Co.',
    operatorContact: '+84 203 384 6688',
    guideName: 'Hoàng Hải Đăng',
    guidePhone: '+84 912 888 999',
    busNumber: 'Tàu trung chuyển TENDER-01',
    excursionDate: '2026-10-15',
    meetingTime: '08:30',
    departureTime: '09:00',
    returnToShipTime: '11:15',
    allAboardTime: '11:45',
    maxCapacity: 120,
    bookedCount: 96,
    price: 650000,
    currency: 'VND',
    isIncluded: true,
    status: 'COMPLETED',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    active: true,
    passengers: INITIAL_EXCURSION_PASSENGERS,
  },
  {
    id: 2,
    tourId: 2,
    tourName: 'Hải Trình Di Sản Miền Trung & Vịnh Nha Trang 5N4Đ',
    portId: 4,
    portName: 'Cảng Tiên Sa',
    portCity: 'Đà Nẵng',
    title: 'Di Sản Phố Cổ Hội An & Rừng Dừa Bảy Mẫu',
    code: 'EXC-DAD-02',
    description: 'Xe cao cấp đưa đón tham quan quần thể Di sản thế giới Hội An, trải nghiệm đi thuyền thúng sông nước và thưởng thức đặc sản Cao Lầu.',
    category: 'CULTURAL',
    difficulty: 'EASY',
    operatorName: 'Danang Green Horizon Tours',
    operatorContact: '+84 236 392 1122',
    guideName: 'Nguyễn Thanh Tùng',
    guidePhone: '+84 905 123 456',
    busNumber: 'BUS-VIP-01 (45 Chỗ)',
    excursionDate: '2026-10-16',
    meetingTime: '14:30',
    departureTime: '14:45',
    returnToShipTime: '17:00',
    allAboardTime: '17:30',
    maxCapacity: 80,
    bookedCount: 74,
    price: 1200000,
    currency: 'VND',
    isIncluded: false,
    status: 'IN_PROGRESS',
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
    active: true,
    passengers: INITIAL_EXCURSION_PASSENGERS,
  },
  {
    id: 3,
    tourId: 2,
    tourName: 'Hải Trình Di Sản Miền Trung & Vịnh Nha Trang 5N4Đ',
    portId: 2,
    portName: 'Cảng Hành Khách Nha Trang',
    portCity: 'Nha Trang',
    title: 'Lặn Biển Ngắm San Hô Hòn Mun & Du Khảo Hòn Tằm',
    code: 'EXC-NHA-03',
    description: 'Trải nghiệm lặn scuba và đi bộ dưới biển ngắm rạn san hô Khu bảo tồn Hòn Mun, tắm bùn khoáng nóng thiên nhiên Hòn Tằm.',
    category: 'WATER_SPORTS',
    difficulty: 'CHALLENGING',
    operatorName: 'Nha Trang Ocean Blue Adventures',
    operatorContact: '+84 258 351 7788',
    guideName: 'Vũ Đức Nam',
    guidePhone: '+84 935 999 111',
    busNumber: 'CANO-EXPRESS-03',
    excursionDate: '2026-10-22',
    meetingTime: '08:00',
    departureTime: '08:20',
    returnToShipTime: '12:00',
    allAboardTime: '12:30',
    maxCapacity: 50,
    bookedCount: 42,
    price: 1850000,
    currency: 'VND',
    isIncluded: false,
    status: 'SCHEDULED',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    active: true,
    passengers: INITIAL_EXCURSION_PASSENGERS,
  },
  {
    id: 4,
    tourId: 3,
    tourName: 'Đảo Ngọc Phú Quốc & Vịnh Thái Lan 3N2Đ',
    portId: 3,
    portName: 'Cảng An Thới',
    portCity: 'Phú Quốc',
    title: 'Khám Phá Quần Đảo An Thới & Sunset Sanato',
    code: 'EXC-PQ-04',
    description: 'Cano cao tốc vi vu Hòn Mây Rút, Hòn Gầm Ghì câu cá ngắm rạn san hô, check-in hoàng hôn bãi biển Sunset Sanato nghệ thuật.',
    category: 'ADVENTURE',
    difficulty: 'MODERATE',
    operatorName: 'Phu Quoc Island Explorer',
    operatorContact: '+84 297 384 9900',
    guideName: 'Trương Quốc Bảo',
    guidePhone: '+84 944 555 666',
    busNumber: 'BUS-PQ-05 (29 Chỗ)',
    excursionDate: '2026-11-02',
    meetingTime: '09:00',
    departureTime: '09:30',
    returnToShipTime: '14:30',
    allAboardTime: '15:00',
    maxCapacity: 60,
    bookedCount: 58,
    price: 950000,
    currency: 'VND',
    isIncluded: true,
    status: 'DELAYED',
    delayReason: 'Xe trung chuyển bị kẹt do thời tiết mưa lớn cục bộ, hướng dẫn viên đang liên tục báo cáo',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    active: true,
    passengers: INITIAL_EXCURSION_PASSENGERS,
  },
];

let localExcursions: ShoreExcursion[] = [...INITIAL_EXCURSIONS];

export function validateExcursionForm(data: ExcursionFormData): ExcursionFormErrors {
  const errors: ExcursionFormErrors = {};

  if (!data.title || !data.title.trim()) {
    errors.title = 'Tên tour trên bờ không được để trống';
  } else if (data.title.trim().length < 5 || data.title.trim().length > 150) {
    errors.title = 'Tên tour phải từ 5 đến 150 ký tự';
  }

  const codeRegex = /^[A-Z0-9_-]{3,25}$/;
  if (!data.code || !data.code.trim()) {
    errors.code = 'Mã excursion không được để trống';
  } else if (!codeRegex.test(data.code.trim().toUpperCase())) {
    errors.code = 'Mã excursion chỉ gồm chữ cái in hoa, số và gạch nối (3-25 ký tự)';
  }

  if (data.tourId === '' || data.tourId === undefined || Number(data.tourId) <= 0) {
    errors.tourId = 'Vui lòng chọn tour du thuyền liên kết';
  }

  if (data.portId === '' || data.portId === undefined || Number(data.portId) <= 0) {
    errors.portId = 'Vui lòng chọn cảng dừng (Port of Call)';
  }

  if (!data.operatorName || !data.operatorName.trim()) {
    errors.operatorName = 'Nhà cung cấp tour địa phương không được để trống';
  }

  if (!data.excursionDate) {
    errors.excursionDate = 'Ngày khởi hành tour không được để trống';
  }

  if (!data.meetingTime) {
    errors.meetingTime = 'Giờ tập trung không được để trống';
  }

  if (!data.departureTime) {
    errors.departureTime = 'Giờ xuất bến không được để trống';
  }

  if (!data.returnToShipTime) {
    errors.returnToShipTime = 'Giờ quay lại tàu không được để trống';
  }

  if (!data.allAboardTime) {
    errors.allAboardTime = 'Giờ tàu nhổ neo (All Aboard) không được để trống';
  }

  // Time sequence checks: meetingTime <= departureTime < returnToShipTime <= allAboardTime
  if (data.meetingTime && data.departureTime && data.meetingTime > data.departureTime) {
    errors.departureTime = 'Giờ khởi hành phải sau hoặc cùng giờ tập trung';
  }

  if (data.departureTime && data.returnToShipTime && data.departureTime >= data.returnToShipTime) {
    errors.returnToShipTime = 'Giờ quay lại tàu phải sau giờ khởi hành';
  }

  if (data.returnToShipTime && data.allAboardTime && data.returnToShipTime > data.allAboardTime) {
    errors.allAboardTime = 'Giờ quay lại tàu không thể trễ hơn giờ tàu nhổ neo (All Aboard)';
  }

  if (data.maxCapacity === '' || data.maxCapacity === undefined || Number(data.maxCapacity) <= 0) {
    errors.maxCapacity = 'Số lượng chỗ tối đa phải lớn hơn 0';
  } else if (Number(data.maxCapacity) > 1000) {
    errors.maxCapacity = 'Sức chứa của một đoàn tour trên bờ không quá 1000 khách';
  }

  if (!data.isIncluded) {
    if (data.price === '' || data.price === undefined || Number(data.price) <= 0) {
      errors.price = 'Tour có tính phí bắt buộc phải có giá lớn hơn 0';
    }
  }

  return errors;
}

export function formatExcursionPayload(data: ExcursionFormData) {
  return {
    ...data,
    tourId: Number(data.tourId),
    portId: Number(data.portId),
    title: data.title.trim(),
    code: data.code.trim().toUpperCase(),
    operatorName: data.operatorName.trim(),
    guideName: data.guideName.trim(),
    busNumber: data.busNumber.trim(),
    maxCapacity: Number(data.maxCapacity),
    price: data.isIncluded ? 0 : Number(data.price),
    currency: data.currency || 'VND',
  };
}

export async function fetchExcursions(params?: {
  tourId?: number;
  portId?: number;
  status?: ExcursionStatus;
  category?: string;
  keyword?: string;
}): Promise<ShoreExcursion[]> {
  try {
    const res = await apiClient.get<{ success: boolean; data: ShoreExcursion[] | { content: ShoreExcursion[] } }>(
      '/excursions',
      { params }
    );
    if (res.data?.data) {
      const list = Array.isArray(res.data.data) ? res.data.data : res.data.data.content;
      if (list && list.length > 0) return list;
    }
  } catch {
    // fallback to local mock
  }

  let filtered = [...localExcursions];
  if (params?.tourId) {
    filtered = filtered.filter((e) => e.tourId === Number(params.tourId));
  }
  if (params?.portId) {
    filtered = filtered.filter((e) => e.portId === Number(params.portId));
  }
  if (params?.status) {
    filtered = filtered.filter((e) => e.status === params.status);
  }
  if (params?.category && params.category !== 'ALL') {
    filtered = filtered.filter((e) => e.category === params.category);
  }
  if (params?.keyword && params.keyword.trim()) {
    const kw = params.keyword.toLowerCase().trim();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(kw) ||
        e.code.toLowerCase().includes(kw) ||
        e.portCity.toLowerCase().includes(kw) ||
        e.operatorName.toLowerCase().includes(kw)
    );
  }
  return filtered;
}

export async function getExcursionById(id: number): Promise<ShoreExcursion | null> {
  try {
    const res = await apiClient.get<{ success: boolean; data: ShoreExcursion }>(`/excursions/${id}`);
    if (res.data?.data) return res.data.data;
  } catch {
    // fallback
  }
  return localExcursions.find((e) => e.id === id) || null;
}

export async function createExcursion(
  data: ExcursionFormData,
  portName = 'Cảng Đến',
  portCity = 'Điểm Dừng'
): Promise<ShoreExcursion> {
  const formatted = formatExcursionPayload(data);
  try {
    const res = await apiClient.post<{ success: boolean; data: ShoreExcursion }>('/excursions', formatted);
    if (res.data?.data) {
      localExcursions.unshift(res.data.data);
      return res.data.data;
    }
  } catch {
    // fallback
  }

  const newExcursion: ShoreExcursion = {
    ...formatted,
    id: Date.now(),
    portName,
    portCity,
    bookedCount: 0,
    active: true,
    passengers: [],
    createdAt: new Date().toISOString(),
  };
  localExcursions.unshift(newExcursion);
  return newExcursion;
}

export async function updateExcursion(
  id: number,
  data: ExcursionFormData,
  portName?: string,
  portCity?: string
): Promise<ShoreExcursion> {
  const formatted = formatExcursionPayload(data);
  try {
    const res = await apiClient.put<{ success: boolean; data: ShoreExcursion }>(`/excursions/${id}`, formatted);
    if (res.data?.data) {
      const idx = localExcursions.findIndex((e) => e.id === id);
      if (idx !== -1) localExcursions[idx] = res.data.data;
      return res.data.data;
    }
  } catch {
    // fallback
  }

  const idx = localExcursions.findIndex((e) => e.id === id);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const updated: ShoreExcursion = {
      ...existing,
      ...formatted,
      portName: portName || existing.portName,
      portCity: portCity || existing.portCity,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${id}`);
}

export async function updateExcursionStatus(
  id: number,
  status: ExcursionStatus,
  reason?: string
): Promise<ShoreExcursion> {
  try {
    const res = await apiClient.patch<{ success: boolean; data: ShoreExcursion }>(`/excursions/${id}/status`, {
      status,
      reason,
    });
    if (res.data?.data) {
      const idx = localExcursions.findIndex((e) => e.id === id);
      if (idx !== -1) localExcursions[idx] = res.data.data;
      return res.data.data;
    }
  } catch {
    // fallback
  }

  const idx = localExcursions.findIndex((e) => e.id === id);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const updated: ShoreExcursion = {
      ...existing,
      status,
      delayReason: status === 'DELAYED' ? reason : undefined,
      cancellationReason: status === 'CANCELLED' ? reason : undefined,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${id}`);
}

export async function deleteExcursion(id: number): Promise<void> {
  try {
    await apiClient.delete(`/excursions/${id}`);
  } catch {
    // fallback
  }
  localExcursions = localExcursions.filter((e) => e.id !== id);
}

export interface ExcursionGroup {
  id: string;
  groupName: string;
  busNumber: string;
  maxSeats: number;
}

export const DEFAULT_EXCURSION_GROUPS: ExcursionGroup[] = [
  { id: 'GRP-A', groupName: 'Đoàn A - Khám phá', busNumber: 'XE-01 (45 Chỗ)', maxSeats: 45 },
  { id: 'GRP-B', groupName: 'Đoàn B - Ẩm thực', busNumber: 'XE-02 (29 Chỗ)', maxSeats: 29 },
  { id: 'GRP-C', groupName: 'Đoàn C - Thưởng ngoạn', busNumber: 'XE-03 (45 Chỗ)', maxSeats: 45 },
  { id: 'GRP-VIP', groupName: 'Đoàn VIP - Cao cấp', busNumber: 'BUS-VIP-01 (16 Chỗ)', maxSeats: 16 },
  { id: 'GRP-TENDER', groupName: 'Đoàn Thuyền Trung Chuyển', busNumber: 'Tàu trung chuyển TENDER-01', maxSeats: 60 },
];

export async function assignPassengerToGroup(
  excursionId: number,
  passengerId: number,
  groupName: string,
  busNumber: string
): Promise<ShoreExcursion> {
  try {
    const res = await apiClient.patch<{ success: boolean; data: ShoreExcursion }>(
      `/excursions/${excursionId}/passengers/${passengerId}/group`,
      { groupName, busNumber }
    );
    if (res.data?.data) {
      const idx = localExcursions.findIndex((e) => e.id === excursionId);
      if (idx !== -1) localExcursions[idx] = res.data.data;
      return res.data.data;
    }
  } catch (err) {
    if (isAxiosError(err) && err.response) throw err;
    // network unavailable: fallback
  }

  const idx = localExcursions.findIndex((e) => e.id === excursionId);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const passengers = existing.passengers || [];
    const updatedPassengers = passengers.map((p) =>
      p.id === passengerId ? { ...p, groupName, busNumber } : p
    );
    const updated: ShoreExcursion = {
      ...existing,
      passengers: updatedPassengers,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${excursionId}`);
}

export async function bulkAssignPassengersToGroup(
  excursionId: number,
  passengerIds: number[],
  groupName: string,
  busNumber: string
): Promise<ShoreExcursion> {
  try {
    const res = await apiClient.patch<{ success: boolean; data: ShoreExcursion }>(
      `/excursions/${excursionId}/passengers/bulk-group`,
      { passengerIds, groupName, busNumber }
    );
    if (res.data?.data) {
      const idx = localExcursions.findIndex((e) => e.id === excursionId);
      if (idx !== -1) localExcursions[idx] = res.data.data;
      return res.data.data;
    }
  } catch (err) {
    if (isAxiosError(err) && err.response) throw err;
    // network unavailable: fallback
  }

  const idx = localExcursions.findIndex((e) => e.id === excursionId);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const passengers = existing.passengers || [];
    const idSet = new Set(passengerIds);
    const updatedPassengers = passengers.map((p) =>
      idSet.has(p.id) ? { ...p, groupName, busNumber } : p
    );
    const updated: ShoreExcursion = {
      ...existing,
      passengers: updatedPassengers,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${excursionId}`);
}

export async function addPassengerToExcursion(
  excursionId: number,
  passengerData: Omit<ExcursionPassenger, 'id'>
): Promise<ShoreExcursion> {
  try {
    const res = await apiClient.post<{ success: boolean; data: ShoreExcursion }>(
      `/excursions/${excursionId}/passengers`,
      passengerData
    );
    if (res.data?.data) {
      const idx = localExcursions.findIndex((e) => e.id === excursionId);
      if (idx !== -1) localExcursions[idx] = res.data.data;
      return res.data.data;
    }
  } catch (err) {
    if (isAxiosError(err) && err.response) throw err;
    // network unavailable: fallback
  }

  const idx = localExcursions.findIndex((e) => e.id === excursionId);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const passengers = existing.passengers ? [...existing.passengers] : [];
    if (passengers.length >= existing.maxCapacity) {
      throw new Error(`Tour đã đạt sức chứa tối đa (${existing.maxCapacity} khách)`);
    }

    const maxId = passengers.reduce((max, p) => (p.id > max ? p.id : max), 0);
    const newPassengerId = maxId + 1;
    const newPassenger: ExcursionPassenger = {
      ...passengerData,
      id: newPassengerId,
      ticketCode:
        passengerData.ticketCode ||
        `EXC-TKT-${String(newPassengerId).padStart(3, '0')}`,
    };
    passengers.push(newPassenger);

    const updated: ShoreExcursion = {
      ...existing,
      passengers,
      bookedCount: passengers.length,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${excursionId}`);
}

export async function removePassengerFromExcursion(
  excursionId: number,
  passengerId: number
): Promise<ShoreExcursion> {
  try {
    const res = await apiClient.delete<{ success: boolean; data: ShoreExcursion }>(
      `/excursions/${excursionId}/passengers/${passengerId}`
    );
    if (res.data?.data) {
      const idx = localExcursions.findIndex((e) => e.id === excursionId);
      if (idx !== -1) localExcursions[idx] = res.data.data;
      return res.data.data;
    }
  } catch (err) {
    if (isAxiosError(err) && err.response) throw err;
    // network unavailable: fallback
  }

  const idx = localExcursions.findIndex((e) => e.id === excursionId);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const passengers = (existing.passengers || []).filter((p) => p.id !== passengerId);
    const updated: ShoreExcursion = {
      ...existing,
      passengers,
      bookedCount: passengers.length,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${excursionId}`);
}

export async function autoAssignGroups(
  excursionId: number,
  groups: ExcursionGroup[] = DEFAULT_EXCURSION_GROUPS
): Promise<ShoreExcursion> {
  const idx = localExcursions.findIndex((e) => e.id === excursionId);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const passengers = existing.passengers ? [...existing.passengers] : [];
    if (groups.length === 0 || passengers.length === 0) return existing;

    const updatedPassengers = passengers.map((p, i) => {
      const assignedGroup = groups[i % groups.length];
      return {
        ...p,
        groupName: assignedGroup.groupName,
        busNumber: assignedGroup.busNumber,
      };
    });

    const updated: ShoreExcursion = {
      ...existing,
      passengers: updatedPassengers,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${excursionId}`);
}

export async function updateExcursionPassengers(
  excursionId: number,
  passengers: ExcursionPassenger[]
): Promise<ShoreExcursion> {
  const idx = localExcursions.findIndex((e) => e.id === excursionId);
  if (idx !== -1) {
    const existing = localExcursions[idx];
    const updated: ShoreExcursion = {
      ...existing,
      passengers,
      bookedCount: passengers.length,
      updatedAt: new Date().toISOString(),
    };
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${excursionId}`);
}

export function resetExcursionServiceState(): void {
  localExcursions = [...INITIAL_EXCURSIONS];
}
