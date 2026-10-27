import { apiClient } from './api';

export type TourStatus = 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CruiseTour {
  id: number;
  name: string;
  code: string;
  description?: string;
  shipId?: number;
  shipName?: string;
  shipCode?: string;
  durationDays: number;
  durationNights: number;
  departurePort: string;
  destinationPort: string;
  startDate: string;
  endDate: string;
  maxCapacity: number;
  basePrice: number;
  currency: string;
  itineraryOverview?: string;
  imageUrl?: string;
  status: TourStatus;
  cancellationReason?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TourFormData {
  name: string;
  code: string;
  description?: string;
  shipId?: number | '';
  durationDays: number | '';
  durationNights: number | '';
  departurePort: string;
  destinationPort: string;
  startDate: string;
  endDate: string;
  maxCapacity: number | '';
  basePrice: number | '';
  currency: string;
  itineraryOverview?: string;
  imageUrl?: string;
  status: TourStatus;
}

export interface TourFormErrors {
  [key: string]: string | undefined;
}

export const INITIAL_TOURS: CruiseTour[] = [
  {
    id: 1,
    name: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
    code: 'TOUR-HL-001',
    description: 'Khám phá Di sản thiên nhiên thế giới Vịnh Hạ Long và Lan Hạ trên siêu du thuyền cao cấp',
    shipId: 1,
    shipName: 'Halong Grand Harmony',
    shipCode: 'SHIP-001',
    durationDays: 4,
    durationNights: 3,
    departurePort: 'Cảng Tuần Châu (Hạ Long)',
    destinationPort: 'Cảng Tuần Châu (Hạ Long)',
    startDate: '2026-10-15',
    endDate: '2026-10-18',
    maxCapacity: 2000,
    basePrice: 15500000,
    currency: 'VND',
    itineraryOverview: 'Hạ Long - Hang Sửng Sốt - Đảo Ti Tốp - Vịnh Lan Hạ - Trở về Tuần Châu',
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    status: 'PUBLISHED',
    active: true,
  },
  {
    id: 2,
    name: 'Hải Trình Di Sản Miền Trung & Vịnh Nha Trang 5N4Đ',
    code: 'TOUR-MT-002',
    description: 'Chuyến hải trình đẳng cấp dọc bờ biển miền Trung kết nối Đà Nẵng, Hội An và Nha Trang',
    shipId: 2,
    shipName: 'Ocean Pearl Voyager',
    shipCode: 'SHIP-002',
    durationDays: 5,
    durationNights: 4,
    departurePort: 'Cảng Tiên Sa (Đà Nẵng)',
    destinationPort: 'Cảng Nha Trang',
    startDate: '2026-10-20',
    endDate: '2026-10-24',
    maxCapacity: 1500,
    basePrice: 22000000,
    currency: 'VND',
    itineraryOverview: 'Đà Nẵng - Cù Lao Chàm - Quy Nhơn - Hòn Mun (Nha Trang)',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    status: 'IN_PROGRESS',
    active: true,
  },
  {
    id: 3,
    name: 'Đảo Ngọc Phú Quốc & Vịnh Thái Lan 3N2Đ',
    code: 'TOUR-PQ-003',
    description: 'Hành trình ngắm hoàng hôn đảo ngọc Phú Quốc và thưởng ngoạn quần đảo An Thới',
    shipId: 3,
    shipName: 'Phu Quoc Princess',
    shipCode: 'SHIP-003',
    durationDays: 3,
    durationNights: 2,
    departurePort: 'Cảng An Thới (Phú Quốc)',
    destinationPort: 'Cảng An Thới (Phú Quốc)',
    startDate: '2026-11-01',
    endDate: '2026-11-03',
    maxCapacity: 1000,
    basePrice: 9800000,
    currency: 'VND',
    itineraryOverview: 'An Thới - Hòn Mây Rút - Hòn Móng Tay - Sunset Sanato - Cảng An Thới',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    status: 'DRAFT',
    active: true,
  },
];

export const TOUR_STATUS_TRANSITIONS: Record<TourStatus, TourStatus[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['IN_PROGRESS', 'DRAFT', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['DRAFT'],
};

export function canTransitionTourStatus(current: TourStatus, target: TourStatus): boolean {
  if (current === target) return true;
  return TOUR_STATUS_TRANSITIONS[current]?.includes(target) ?? false;
}

export function validateTourForm(data: TourFormData, maxShipCapacity?: number): TourFormErrors {
  const errors: TourFormErrors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Tên tour không được để trống';
  } else if (data.name.trim().length < 5 || data.name.trim().length > 150) {
    errors.name = 'Tên tour phải từ 5 đến 150 ký tự';
  }

  const codeRegex = /^[A-Z0-9_-]{3,30}$/;
  if (!data.code || !data.code.trim()) {
    errors.code = 'Mã tour không được để trống';
  } else if (!codeRegex.test(data.code.trim().toUpperCase())) {
    errors.code = 'Mã tour chỉ được chứa chữ cái, số, gạch ngang/dưới (3-30 ký tự)';
  }

  if (data.durationDays === '' || data.durationDays === undefined || Number(data.durationDays) < 1) {
    errors.durationDays = 'Số ngày tour phải từ 1 ngày trở lên';
  } else if (Number(data.durationDays) > 60) {
    errors.durationDays = 'Số ngày tour tối đa là 60 ngày';
  }

  if (data.durationNights === '' || data.durationNights === undefined || Number(data.durationNights) < 0) {
    errors.durationNights = 'Số đêm tour không thể âm';
  } else if (data.durationDays !== '' && Number(data.durationNights) > Number(data.durationDays)) {
    errors.durationNights = 'Số đêm tour không thể lớn hơn số ngày tour';
  }

  if (!data.departurePort || !data.departurePort.trim()) {
    errors.departurePort = 'Cảng khởi hành không được để trống';
  }

  if (!data.destinationPort || !data.destinationPort.trim()) {
    errors.destinationPort = 'Cảng đích không được để trống';
  }

  if (!data.startDate) {
    errors.startDate = 'Ngày bắt đầu tour không được để trống';
  }

  if (!data.endDate) {
    errors.endDate = 'Ngày kết thúc tour không được để trống';
  } else if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    errors.endDate = 'Ngày kết thúc tour không thể trước ngày bắt đầu';
  }

  if (data.maxCapacity === '' || data.maxCapacity === undefined || Number(data.maxCapacity) <= 0) {
    errors.maxCapacity = 'Sức chứa tối đa phải lớn hơn 0';
  } else if (maxShipCapacity && Number(data.maxCapacity) > maxShipCapacity) {
    errors.maxCapacity = `Sức chứa của tour (${data.maxCapacity}) không thể vượt quá sức chứa tàu (${maxShipCapacity})`;
  }

  if (data.basePrice === '' || data.basePrice === undefined || Number(data.basePrice) < 0) {
    errors.basePrice = 'Giá tour cơ bản không được âm';
  }

  return errors;
}

export function formatTourPayload(data: TourFormData) {
  return {
    ...data,
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    departurePort: data.departurePort.trim(),
    destinationPort: data.destinationPort.trim(),
    shipId: data.shipId ? Number(data.shipId) : undefined,
    durationDays: Number(data.durationDays),
    durationNights: Number(data.durationNights),
    maxCapacity: Number(data.maxCapacity),
    basePrice: Number(data.basePrice),
    currency: data.currency || 'VND',
  };
}

export async function getTours(params?: {
  keyword?: string;
  status?: string;
  shipId?: number;
}): Promise<CruiseTour[]> {
  try {
    const res = await apiClient.get<{ success: boolean; data: { content: CruiseTour[] } }>('/itinerary/tours', {
      params,
    });
    return res.data?.data?.content ?? [];
  } catch {
    return INITIAL_TOURS;
  }
}

export async function getTourById(id: number): Promise<CruiseTour | null> {
  try {
    const res = await apiClient.get<{ success: boolean; data: CruiseTour }>(`/itinerary/tours/${id}`);
    return res.data?.data || null;
  } catch {
    return INITIAL_TOURS.find((t) => t.id === id) || null;
  }
}

export async function createTour(data: TourFormData): Promise<CruiseTour> {
  const payload = formatTourPayload(data);
  const res = await apiClient.post<{ success: boolean; data: CruiseTour }>('/itinerary/tours', payload);
  return res.data.data;
}

export async function updateTour(id: number, data: TourFormData): Promise<CruiseTour> {
  const payload = formatTourPayload(data);
  const res = await apiClient.put<{ success: boolean; data: CruiseTour }>(`/itinerary/tours/${id}`, payload);
  return res.data.data;
}

export async function updateTourStatus(
  id: number,
  status: TourStatus,
  cancellationReason?: string
): Promise<CruiseTour> {
  const res = await apiClient.patch<{ success: boolean; data: CruiseTour }>(`/itinerary/tours/${id}/status`, {
    status,
    cancellationReason,
  });
  return res.data.data;
}

export async function deleteTour(id: number): Promise<void> {
  await apiClient.delete(`/itinerary/tours/${id}`);
}
