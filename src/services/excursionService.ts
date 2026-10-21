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
  passengerId?: number;
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
    passengers: INITIAL_EXCURSION_PASSENGERS.map((p) => ({ ...p })),
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
    passengers: INITIAL_EXCURSION_PASSENGERS.map((p) => ({ ...p })),
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
    passengers: INITIAL_EXCURSION_PASSENGERS.map((p) => ({ ...p })),
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
    passengers: INITIAL_EXCURSION_PASSENGERS.map((p) => ({ ...p })),
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
    if (res.data?.data) {
      const idx = localExcursions.findIndex((e) => e.id === id);
      if (idx !== -1) localExcursions[idx] = res.data.data;
      else localExcursions.push(res.data.data);
      return res.data.data;
    }
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

async function mutateExcursionWithFallback(
  excursionId: number,
  apiCall: () => Promise<{ data?: { data?: ShoreExcursion } }>,
  localMutation: (existing: ShoreExcursion) => ShoreExcursion
): Promise<ShoreExcursion> {
  try {
    const res = await apiCall();
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
    const updated = localMutation(localExcursions[idx]);
    localExcursions[idx] = updated;
    return updated;
  }
  throw new Error(`Excursion not found with id ${excursionId}`);
}

export async function assignPassengerToGroup(
  excursionId: number,
  passengerId: number,
  groupName: string,
  busNumber: string
): Promise<ShoreExcursion> {
  return mutateExcursionWithFallback(
    excursionId,
    () => apiClient.patch(`/excursions/${excursionId}/passengers/${passengerId}/group`, { groupName, busNumber }),
    (existing) => ({
      ...existing,
      passengers: (existing.passengers || []).map((p) =>
        p.id === passengerId ? { ...p, groupName, busNumber } : p
      ),
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function bulkAssignPassengersToGroup(
  excursionId: number,
  passengerIds: number[],
  groupName: string,
  busNumber: string
): Promise<ShoreExcursion> {
  const idSet = new Set(passengerIds);
  return mutateExcursionWithFallback(
    excursionId,
    () => apiClient.patch(`/excursions/${excursionId}/passengers/bulk-group`, { passengerIds, groupName, busNumber }),
    (existing) => ({
      ...existing,
      passengers: (existing.passengers || []).map((p) =>
        idSet.has(p.id) ? { ...p, groupName, busNumber } : p
      ),
      updatedAt: new Date().toISOString(),
    })
  );
}

export async function addPassengerToExcursion(
  excursionId: number,
  passengerData: Omit<ExcursionPassenger, 'id'>
): Promise<ShoreExcursion> {
  return mutateExcursionWithFallback(
    excursionId,
    () => apiClient.post(`/excursions/${excursionId}/passengers`, passengerData),
    (existing) => {
      const passengers = existing.passengers ? [...existing.passengers] : [];
      if (passengers.length >= existing.maxCapacity) {
        throw new Error(`Tour đã đạt sức chứa tối đa (${existing.maxCapacity} khách)`);
      }
      const maxId = passengers.reduce((max, p) => (p.id > max ? p.id : max), 0);
      const newPassengerId = maxId + 1;
      const newPassenger: ExcursionPassenger = {
        ...passengerData,
        id: newPassengerId,
        ticketCode: passengerData.ticketCode || `EXC-TKT-${String(newPassengerId).padStart(3, '0')}`,
      };
      passengers.push(newPassenger);
      return {
        ...existing,
        passengers,
        bookedCount: passengers.length,
        updatedAt: new Date().toISOString(),
      };
    }
  );
}

export async function removePassengerFromExcursion(
  excursionId: number,
  passengerId: number
): Promise<ShoreExcursion> {
  return mutateExcursionWithFallback(
    excursionId,
    () => apiClient.delete(`/excursions/${excursionId}/passengers/${passengerId}`),
    (existing) => {
      const passengers = (existing.passengers || []).filter((p) => p.id !== passengerId);
      return {
        ...existing,
        passengers,
        bookedCount: passengers.length,
        updatedAt: new Date().toISOString(),
      };
    }
  );
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

// ==========================================
// ATTENDANCE & CHECK-IN SERVICES (KAN-225, KAN-318)
// ==========================================

export interface ExcursionCheckInPayload {
  excursionPassengerId?: number;
  ticketCode?: string;
  rfidTag?: string;
  cabinNumber?: string;
  targetStatus: 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE';
  note?: string;
}

export interface ExcursionCheckInResult {
  excursionPassengerId: number;
  excursionId: number;
  passengerName: string;
  cabinNumber: string;
  ticketCode: string;
  previousStatus: string;
  currentStatus: 'REGISTERED' | 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE';
  checkedInAt?: string;
  returnedSafeAt?: string;
  message: string;
}

export interface BulkAttendancePayload {
  passengerIds?: number[];
  groupName?: string;
  busNumber?: string;
  targetStatus: 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE';
  note?: string;
}

export interface BulkAttendanceResult {
  excursionId: number;
  totalRequested: number;
  totalUpdated: number;
  targetStatus: string;
  updatedPassengerIds: number[];
  message: string;
}

export interface AttendanceSummary {
  excursionId: number;
  excursionTitle: string;
  returnToShipTime?: string;
  totalRegistered: number;
  totalCheckedIn: number;
  totalOnTour: number;
  totalReturnedSafe: number;
  totalPendingDeparture: number;
  totalMissingReturn: number;
  busStats: {
    busNumber: string;
    total: number;
    checkedIn: number;
    returnedSafe: number;
    missing: number;
  }[];
  groupStats: {
    groupName: string;
    total: number;
    checkedIn: number;
    returnedSafe: number;
    missing: number;
  }[];
  missingPassengers: {
    excursionPassengerId: number;
    passengerName: string;
    cabinNumber: string;
    ticketCode: string;
    busNumber: string;
    groupName: string;
    emergencyPhone?: string;
    currentStatus: 'REGISTERED' | 'CHECKED_IN' | 'ON_TOUR';
  }[];
}

const USE_MOCK_FALLBACK = false;

export async function checkInPassenger(
  excursionId: number,
  payload: ExcursionCheckInPayload
): Promise<ExcursionCheckInResult> {
  try {
    const res = await apiClient.post<{ success: boolean; data: ExcursionCheckInResult }>(
      `/excursions/${excursionId}/check-in`,
      payload
    );
    if (res.data?.data) {
      return res.data.data;
    }
    if (!USE_MOCK_FALLBACK) {
      throw new Error('Phản hồi điểm danh không hợp lệ từ máy chủ');
    }
  } catch (err) {
    if (!USE_MOCK_FALLBACK) throw err;
    console.warn('API /check-in unavailable, fallback to mock state', err);
  }

  // Local fallback (dev / mock only)
  const exc = localExcursions.find((e) => e.id === excursionId);
  if (!exc) throw new Error(`Excursion not found with ID ${excursionId}`);

  const p = (exc.passengers || []).find(
    (item) =>
      (payload.excursionPassengerId && item.id === payload.excursionPassengerId) ||
      (payload.ticketCode && item.ticketCode.toLowerCase() === payload.ticketCode.toLowerCase()) ||
      (payload.cabinNumber && item.cabinNumber.toLowerCase() === payload.cabinNumber.toLowerCase()) ||
      (payload.rfidTag && item.ticketCode.toLowerCase() === payload.rfidTag.toLowerCase())
  );

  if (!p) {
    throw new Error('Không tìm thấy hành khách khớp với thông tin vé, RFID hoặc số cabin');
  }

  const prev = p.status;
  p.status = payload.targetStatus;
  return {
    excursionPassengerId: p.id,
    excursionId,
    passengerName: p.passengerName,
    cabinNumber: p.cabinNumber,
    ticketCode: p.ticketCode,
    previousStatus: prev,
    currentStatus: payload.targetStatus,
    message: `Điểm danh thành công hành khách ${p.passengerName}`,
  };
}

export async function bulkCheckInPassengers(
  excursionId: number,
  payload: BulkAttendancePayload
): Promise<BulkAttendanceResult> {
  try {
    const res = await apiClient.post<{ success: boolean; data: BulkAttendanceResult }>(
      `/excursions/${excursionId}/attendance/bulk`,
      payload
    );
    if (res.data?.data) {
      return res.data.data;
    }
    if (!USE_MOCK_FALLBACK) {
      throw new Error('Phản hồi điểm danh hàng loạt không hợp lệ từ máy chủ');
    }
  } catch (err) {
    if (!USE_MOCK_FALLBACK) throw err;
    console.warn('API /attendance/bulk unavailable, fallback to mock state', err);
  }

  // Local fallback (dev / mock only)
  const exc = localExcursions.find((e) => e.id === excursionId);
  if (!exc) throw new Error(`Excursion not found with ID ${excursionId}`);

  const updatedIds: number[] = [];
  (exc.passengers || []).forEach((p) => {
    const matchId = payload.passengerIds && payload.passengerIds.includes(p.id);
    const matchBus = payload.busNumber && p.busNumber === payload.busNumber;
    const matchGroup = payload.groupName && p.groupName === payload.groupName;

    if (matchId || matchBus || matchGroup) {
      if (p.status !== payload.targetStatus) {
        p.status = payload.targetStatus;
        updatedIds.push(p.id);
      }
    }
  });

  return {
    excursionId,
    totalRequested: updatedIds.length,
    totalUpdated: updatedIds.length,
    targetStatus: payload.targetStatus,
    updatedPassengerIds: updatedIds,
    message: `Đã cập nhật ${updatedIds.length} hành khách sang trạng thái ${payload.targetStatus}`,
  };
}

export async function getAttendanceSummary(excursionId: number): Promise<AttendanceSummary> {
  try {
    const res = await apiClient.get<{ success: boolean; data: AttendanceSummary }>(
      `/excursions/${excursionId}/attendance/summary`
    );
    if (res.data?.data) {
      return res.data.data;
    }
    if (!USE_MOCK_FALLBACK) {
      throw new Error('Phản hồi thống kê điểm danh không hợp lệ từ máy chủ');
    }
  } catch (err) {
    if (!USE_MOCK_FALLBACK) throw err;
    console.warn('API /attendance/summary unavailable, fallback to mock state', err);
  }

  // Local fallback
  const exc = localExcursions.find((e) => e.id === excursionId);
  if (!exc) throw new Error(`Excursion not found with ID ${excursionId}`);
  const passengers = exc.passengers || [];

  const checkedIn = passengers.filter((p) => p.status === 'CHECKED_IN').length;
  const onTour = passengers.filter((p) => p.status === 'ON_TOUR').length;
  const returnedSafe = passengers.filter((p) => p.status === 'RETURNED_SAFE').length;
  const total = passengers.length;

  const missing = passengers
    .filter((p) => p.status === 'CHECKED_IN' || p.status === 'ON_TOUR')
    .map((p) => ({
      excursionPassengerId: p.id,
      passengerName: p.passengerName,
      cabinNumber: p.cabinNumber,
      ticketCode: p.ticketCode,
      busNumber: p.busNumber || 'Chưa phân xe',
      groupName: p.groupName || 'Chưa xếp đoàn',
      emergencyPhone: p.emergencyPhone,
      currentStatus: p.status as 'CHECKED_IN' | 'ON_TOUR',
    }));

  const groupBy = (key: 'busNumber' | 'groupName') => {
    const map = new Map<string, ExcursionPassenger[]>();
    passengers.forEach((p) => {
      const k = p[key] || (key === 'busNumber' ? 'Chưa phân xe' : 'Chưa xếp đoàn');
      map.set(k, [...(map.get(k) || []), p]);
    });
    return Array.from(map.entries()).map(([name, list]) => {
      const returned = list.filter((p) => p.status === 'RETURNED_SAFE').length;
      const departedMissing = list.filter((p) => p.status === 'CHECKED_IN' || p.status === 'ON_TOUR').length;
      return {
        name,
        total: list.length,
        checkedIn: list.filter((p) => p.status === 'CHECKED_IN').length,
        returnedSafe: returned,
        missing: departedMissing,
      };
    });
  };

  return {
    excursionId: exc.id,
    excursionTitle: exc.title,
    returnToShipTime: exc.returnToShipTime,
    totalRegistered: total,
    totalCheckedIn: checkedIn,
    totalOnTour: onTour,
    totalReturnedSafe: returnedSafe,
    totalPendingDeparture: Math.max(0, total - (checkedIn + onTour + returnedSafe)),
    totalMissingReturn: checkedIn + onTour,
    busStats: groupBy('busNumber').map(({ name, ...s }) => ({ busNumber: name, ...s })),
    groupStats: groupBy('groupName').map(({ name, ...s }) => ({ groupName: name, ...s })),
    missingPassengers: missing,
  };
}

export function resetExcursionServiceState(): void {
  localExcursions = INITIAL_EXCURSIONS.map((e) => ({
    ...e,
    passengers: e.passengers?.map((p) => ({ ...p })),
  }));
}


// ==========================================
// EXCURSION BOOKING, VEHICLE & CANCELLATION (KAN-374, KAN-375, KAN-376)
// ==========================================

export interface ExcursionBookingPayload {
  passengerId: number;
  passengerName?: string;
  cabinNumber?: string;
  busNumber?: string;
  groupName?: string;
  emergencyPhone?: string;
  specialRequirements?: string;
  linkedCabins?: string[];
}

export interface ExcursionBookingResult {
  bookingId: number;
  excursionId: number;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  ticketCode: string;
  busNumber: string;
  groupName: string;
  chargedAmount: number;
  transactionId?: string;
  isIncluded: boolean;
  status: string;
  bookedAt: string;
}

export interface ExcursionCancellationResult {
  bookingId: number;
  currency?: string;
  excursionId: number;
  passengerId: number;
  status: string;
  refundAmount: number;
  penaltyFee: number;
  cancellationReason?: string;
  cancelledAt: string;
}

export interface PassengerExcursionBooking {
  bookingId: number;
  currency?: string;
  excursionId: number;
  excursionTitle: string;
  portName: string;
  excursionDate: string;
  gatheringTime: string;
  departureTime: string;
  returnToShipTime: string;
  meetingPoint: string;
  passengerId: number;
  passengerName: string;
  cabinNumber: string;
  ticketCode: string;
  busNumber: string;
  groupName: string;
  status: string;
  chargedAmount: number;
  isIncluded: boolean;
}

export interface ReassignBusPayload {
  newBusNumber: string;
  newGroupName?: string;
}

export interface ReassignBusResult {
  bookingId: number;
  excursionId: number;
  ticketCode: string;
  oldBusNumber: string;
  newBusNumber: string;
  groupName: string;
  message: string;
}

function canUseLocalFallback(err: unknown): boolean {
  return isAxiosError(err) && err.response === undefined;
}

export async function bookExcursion(
  excursionId: number,
  payload: ExcursionBookingPayload
): Promise<ExcursionBookingResult> {
  try {
    const res = await apiClient.post<{ data: ExcursionBookingResult }>(
      `/activities/excursions/${excursionId}/bookings`,
      payload
    );
    if (res.data?.data) return res.data.data;
  } catch (err) {
    if (!canUseLocalFallback(err)) throw err;
  }

  // Local fallback simulation
  const exc = localExcursions.find((e) => e.id === excursionId);
  const ticketCode = `EXC-${excursionId}-${Date.now()}`;
  const isIncluded = exc?.isIncluded || false;
  const chargedAmount = isIncluded ? 0 : (exc?.price || 0);
  const busNumber = payload.busNumber || 'XE-01 (45 Chỗ)';
  const groupName = payload.groupName || `Nhóm ${busNumber}`;
  const bookingId = Date.now();

  const newP: ExcursionPassenger = {
    id: bookingId,
    passengerId: payload.passengerId,
    passengerName: payload.passengerName || 'Hành khách vãng lai',
    cabinNumber: payload.cabinNumber || 'Suite-801',
    ticketCode,
    busNumber,
    groupName,
    emergencyPhone: payload.emergencyPhone || '0987654321',
    status: 'REGISTERED',
    specialRequirements: payload.specialRequirements,
  };

  if (exc) {
    if (!exc.passengers) exc.passengers = [];
    exc.passengers.push(newP);
    exc.bookedCount = (exc.bookedCount || 0) + 1;
  }

  return {
    bookingId,
    excursionId,
    passengerId: payload.passengerId,
    passengerName: newP.passengerName,
    cabinNumber: newP.cabinNumber,
    ticketCode,
    busNumber,
    groupName,
    chargedAmount,
    transactionId: isIncluded ? undefined : `FOLIO-EXC-${bookingId}`,
    isIncluded,
    status: 'REGISTERED',
    bookedAt: new Date().toISOString(),
  };
}

export async function cancelExcursionBooking(
  excursionId: number,
  bookingId: number,
  reason?: string
): Promise<ExcursionCancellationResult> {
  try {
    const res = await apiClient.delete<{ data: ExcursionCancellationResult }>(
      `/activities/excursions/${excursionId}/bookings/${bookingId}`,
      { params: { reason } }
    );
    if (res.data?.data) return res.data.data;
  } catch (err) {
    if (!canUseLocalFallback(err)) throw err;
  }

  // Local fallback: verify both excursion and booking via passengers collection
  const exc = localExcursions.find((e) => e.id === excursionId);
  if (!exc) {
    throw new Error(`Excursion ${excursionId} not found`);
  }
  const passengerIndex = exc.passengers?.findIndex((p) => p.id === bookingId) ?? -1;
  if (passengerIndex === -1 || !exc.passengers) {
    throw new Error(`Booking ${bookingId} not found in excursion ${excursionId}`);
  }

  exc.passengers.splice(passengerIndex, 1);
  if (exc.bookedCount > 0) {
    exc.bookedCount -= 1;
  }

  const isWeather =
    reason?.toLowerCase().includes('thời tiết') ||
    reason?.toLowerCase().includes('weather') ||
    reason?.toLowerCase().includes('storm') ||
    reason?.toLowerCase().includes('bão');

  const charged = exc.isIncluded ? 0 : (exc.price || 0);
  let refundAmount = 0;
  let penaltyFee = 0;

  if (isWeather) {
    refundAmount = charged;
    penaltyFee = 0;
  } else {
    // Port-arrival / meeting-time cut-off: parse meetingTime (HH:mm) and excursionDate (YYYY-MM-DD)
    const cutOffString = `${exc.excursionDate}T${exc.meetingTime || '08:00'}:00`;
    const cutOffTime = new Date(cutOffString).getTime();
    const hoursUntilCutOff = Number.isNaN(cutOffTime) ? 48 : (cutOffTime - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilCutOff >= 24) {
      refundAmount = charged;
      penaltyFee = 0;
    } else if (hoursUntilCutOff >= 12) {
      penaltyFee = Math.round(charged * 0.5 * 100) / 100;
      refundAmount = charged - penaltyFee;
    } else {
      penaltyFee = charged;
      refundAmount = 0;
    }
  }

  return {
    bookingId,
    excursionId,
    passengerId: 1,
    status: 'CANCELLED',
    refundAmount,
    penaltyFee,
    currency: exc.currency || 'USD',
    cancellationReason: reason || 'Hành khách hủy tour',
    cancelledAt: new Date().toISOString(),
  };
}

export async function fetchMyExcursionBookings(
  passengerId: number = 1
): Promise<PassengerExcursionBooking[]> {
  try {
    const res = await apiClient.get<{ data: PassengerExcursionBooking[] }>(
      `/activities/excursions/bookings/my`,
      { params: { passengerId } }
    );
    if (res.data?.data) return res.data.data;
  } catch (err) {
    if (!canUseLocalFallback(err)) throw err;
  }

  // Local fallback: filter passengers by (passengerId ?? id) matching requested passengerId
  const result: PassengerExcursionBooking[] = [];
  for (const exc of localExcursions) {
    const matchingPassengers = exc.passengers?.filter(
      (pass) => (pass.passengerId ?? pass.id) === passengerId
    ) || [];
    for (const p of matchingPassengers) {
      result.push({
        bookingId: p.id,
        excursionId: exc.id,
        excursionTitle: exc.title,
        portName: exc.portName,
        excursionDate: exc.excursionDate,
        gatheringTime: exc.meetingTime,
        departureTime: exc.departureTime,
        returnToShipTime: exc.returnToShipTime,
        meetingPoint: 'Cầu cảng du lịch số 1',
        passengerId,
        passengerName: p.passengerName,
        cabinNumber: p.cabinNumber,
        ticketCode: p.ticketCode,
        busNumber: p.busNumber,
        groupName: p.groupName,
        status: p.status,
        chargedAmount: exc.isIncluded ? 0 : exc.price,
        currency: exc.currency || 'USD',
        isIncluded: exc.isIncluded,
      });
    }
  }
  return result;
}

export async function reassignBusBooking(
  excursionId: number,
  bookingId: number,
  payload: ReassignBusPayload
): Promise<ReassignBusResult> {
  try {
    const res = await apiClient.patch<{ data: ReassignBusResult }>(
      `/activities/excursions/${excursionId}/bookings/${bookingId}/reassign-bus`,
      payload
    );
    if (res.data?.data) return res.data.data;
  } catch (err) {
    if (!canUseLocalFallback(err)) throw err;
  }

  // Local fallback: rejects when the requested booking is absent
  const exc = localExcursions.find((e) => e.id === excursionId);
  if (!exc) {
    throw new Error(`Excursion ${excursionId} not found`);
  }
  const p = exc.passengers?.find((pass) => pass.id === bookingId);
  if (!p) {
    throw new Error(`Booking ${bookingId} not found in excursion ${excursionId}`);
  }

  const oldBus = p.busNumber || 'XE-01';
  p.busNumber = payload.newBusNumber;
  if (payload.newGroupName) {
    p.groupName = payload.newGroupName;
  }

  return {
    bookingId,
    excursionId,
    ticketCode: p.ticketCode || 'EXC-TKT-MOCK',
    oldBusNumber: oldBus,
    newBusNumber: payload.newBusNumber,
    groupName: payload.newGroupName || p.groupName || 'Nhóm 1',
    message: 'Chuyển xe thành công',
  };
}
