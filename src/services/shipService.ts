import { apiClient } from './api';

export type ShipStatus = 'ACTIVE' | 'DOCKED' | 'ON_VOYAGE' | 'UNDER_MAINTENANCE' | 'INACTIVE';

export interface Ship {
  id: number;
  name: string;
  code: string;
  operator: string;
  capacity: number;
  crewCapacity: number;
  totalCabins: number;
  totalDecks: number;
  manufacturingYear?: number;
  lengthMeters?: number;
  beamMeters?: number;
  draftMeters?: number;
  status: ShipStatus;
  description?: string;
  amenities?: string;
  imageUrl?: string;
  active: boolean;
}

export interface ShipFormData {
  name: string;
  code: string;
  operator: string;
  capacity: number | '';
  crewCapacity: number | '';
  totalCabins: number | '';
  totalDecks: number | '';
  manufacturingYear?: number | '';
  lengthMeters?: number | '';
  beamMeters?: number | '';
  draftMeters?: number | '';
  status: ShipStatus;
  description?: string;
  amenities?: string;
  imageUrl?: string;
}

export interface ShipFormErrors {
  [key: string]: string | undefined;
}

export const INITIAL_SHIPS: Ship[] = [
  {
    id: 1,
    name: 'Halong Grand Harmony',
    code: 'SHIP-001',
    operator: 'Paradise Vietnam Cruises',
    capacity: 2400,
    crewCapacity: 750,
    totalCabins: 1100,
    totalDecks: 14,
    manufacturingYear: 2023,
    lengthMeters: 315.5,
    beamMeters: 38.0,
    draftMeters: 8.5,
    status: 'ACTIVE',
    description: 'Du thuyền 5 sao đẳng cấp quốc tế phục vụ các tour cao cấp vịnh Hạ Long',
    amenities: 'Sky Pool, Luxury Spa, Grand Ballroom, VIP Helipad',
    imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 2,
    name: 'Ocean Pearl Voyager',
    code: 'SHIP-002',
    operator: 'Indochina Sails Group',
    capacity: 1800,
    crewCapacity: 520,
    totalCabins: 850,
    totalDecks: 11,
    manufacturingYear: 2021,
    lengthMeters: 280.0,
    beamMeters: 34.0,
    draftMeters: 7.8,
    status: 'ON_VOYAGE',
    description: 'Hải trình khám phá Di sản Miền Trung và vịnh Nha Trang',
    amenities: 'Cinema, Infinity Pool, Sunset Lounge',
    imageUrl: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 3,
    name: 'Phu Quoc Princess',
    code: 'SHIP-003',
    operator: 'Sun World Cruises',
    capacity: 1200,
    crewCapacity: 380,
    totalCabins: 550,
    totalDecks: 9,
    manufacturingYear: 2020,
    lengthMeters: 220.0,
    beamMeters: 29.0,
    draftMeters: 6.9,
    status: 'DOCKED',
    description: 'Du thuyền ven đảo Phú Quốc và vịnh Thái Lan',
    amenities: 'Snorkeling Deck, Sea View Dining',
    imageUrl: 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
];

export function validateShipForm(data: ShipFormData): ShipFormErrors {
  const errors: ShipFormErrors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Tên tàu không được để trống';
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.name = 'Tên tàu phải từ 2 đến 100 ký tự';
  }

  const codeRegex = /^[A-Z0-9_-]{3,30}$/;
  if (!data.code || !data.code.trim()) {
    errors.code = 'Mã tàu không được để trống';
  } else if (!codeRegex.test(data.code.trim().toUpperCase())) {
    errors.code = 'Mã tàu chỉ được chứa chữ cái, số, gạch ngang/dưới (3-30 ký tự)';
  }

  if (!data.operator || !data.operator.trim()) {
    errors.operator = 'Đơn vị vận hành không được để trống';
  }

  if (data.capacity === '' || data.capacity === undefined || Number(data.capacity) <= 0) {
    errors.capacity = 'Sức chứa hành khách phải lớn hơn 0';
  }

  if (data.totalCabins === '' || data.totalCabins === undefined || Number(data.totalCabins) <= 0) {
    errors.totalCabins = 'Tổng số cabin phải lớn hơn 0';
  } else if (data.capacity !== '' && Number(data.totalCabins) > Number(data.capacity)) {
    errors.totalCabins = 'Số lượng cabin không thể lớn hơn sức chứa hành khách';
  }

  if (data.crewCapacity === '' || data.crewCapacity === undefined || Number(data.crewCapacity) <= 0) {
    errors.crewCapacity = 'Sức chứa thủy thủ đoàn phải lớn hơn 0';
  } else if (data.capacity !== '' && Number(data.crewCapacity) > Number(data.capacity) * 2) {
    errors.crewCapacity = 'Sức chứa thủy thủ đoàn không hợp lý (tối đa gấp đôi khách)';
  }

  if (data.totalDecks === '' || data.totalDecks === undefined || Number(data.totalDecks) <= 0) {
    errors.totalDecks = 'Số boong tàu phải lớn hơn 0';
  }

  if (data.manufacturingYear !== '' && data.manufacturingYear !== undefined) {
    const currentYear = new Date().getFullYear();
    const year = Number(data.manufacturingYear);
    if (year < 1900) {
      errors.manufacturingYear = 'Năm đóng tàu phải từ năm 1900 trở đi';
    } else if (year > currentYear + 5) {
      errors.manufacturingYear = `Năm đóng tàu không được vượt quá năm ${currentYear + 5}`;
    }
  }

  const length = data.lengthMeters !== '' && data.lengthMeters !== undefined ? Number(data.lengthMeters) : null;
  const beam = data.beamMeters !== '' && data.beamMeters !== undefined ? Number(data.beamMeters) : null;
  const draft = data.draftMeters !== '' && data.draftMeters !== undefined ? Number(data.draftMeters) : null;

  if (length !== null && beam !== null && length <= beam) {
    errors.lengthMeters = 'Chiều dài thân tàu phải lớn hơn chiều rộng';
  }

  if (draft !== null && beam !== null && draft >= beam) {
    errors.draftMeters = 'Mớn nước phải nhỏ hơn chiều rộng thân tàu';
  }

  return errors;
}

export async function getShips(): Promise<Ship[]> {
  try {
    const res = await apiClient.get<{ success: boolean; data: { content: Ship[] } }>('/itinerary/ships');
    if (res.data?.data?.content && res.data.data.content.length > 0) {
      return res.data.data.content;
    }
    return INITIAL_SHIPS;
  } catch {
    return INITIAL_SHIPS;
  }
}

export function formatShipPayload(data: ShipFormData) {
  return {
    ...data,
    code: data.code.trim().toUpperCase(),
    name: data.name.trim(),
    operator: data.operator.trim(),
    capacity: Number(data.capacity),
    crewCapacity: Number(data.crewCapacity),
    totalCabins: Number(data.totalCabins),
    totalDecks: Number(data.totalDecks),
    manufacturingYear: data.manufacturingYear ? Number(data.manufacturingYear) : undefined,
    lengthMeters: data.lengthMeters ? Number(data.lengthMeters) : undefined,
    beamMeters: data.beamMeters ? Number(data.beamMeters) : undefined,
    draftMeters: data.draftMeters ? Number(data.draftMeters) : undefined,
  };
}

export async function createShip(data: ShipFormData): Promise<Ship> {
  const payload = formatShipPayload(data);
  const res = await apiClient.post<{ success: boolean; data: Ship }>('/itinerary/ships', payload);
  return res.data.data;
}

export async function updateShip(id: number, data: ShipFormData): Promise<Ship> {
  const payload = formatShipPayload(data);
  const res = await apiClient.put<{ success: boolean; data: Ship }>(`/itinerary/ships/${id}`, payload);
  return res.data.data;
}

