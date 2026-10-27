import { apiClient } from './api';

export type RegistrationStatus = 'CONFIRMED' | 'PENDING' | 'CANCELLED';
export type CheckInStatus = 'NOT_CHECKED_IN' | 'BOARDED';

export interface Passenger {
  id: number;
  tourId: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  cabinNumber: string;
  rfidTag: string;
  qrCode?: string;
  tourPackage: string;
  bleZone?: string;
  registrationStatus: RegistrationStatus;
  checkInStatus: CheckInStatus;
  boardedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExcursionSummaryItem {
  excursionId: number;
  excursionTitle: string;
  ticketCode: string;
  groupName: string;
  busNumber: string;
  status: string;
  gatheringTime?: string;
  returnToShipTime?: string;
  portName?: string;
  price: number;
}

export interface PassengerBookingSummary {
  passengerId: number;
  tourId: number;
  tourName: string;
  tourCode: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  cabinNumber: string;
  cabinCategory: string;
  rfidTag: string;
  qrCode?: string;
  tourPackage: string;
  bleZone?: string;
  registrationStatus: RegistrationStatus;
  checkInStatus: CheckInStatus;
  boardedAt?: string;
  totalRegisteredExcursions: number;
  totalExcursionSpent: number;
  registeredExcursions: ExcursionSummaryItem[];
}

export interface RegisterPassengerPayload {
  tourId: number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  cabinNumber: string;
  rfidTag: string;
  qrCode?: string;
  tourPackage: string;
  bleZone?: string;
  registrationStatus?: RegistrationStatus;
  checkInStatus?: CheckInStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const INITIAL_PASSENGERS: Passenger[] = [
  {
    id: 1,
    tourId: 1,
    fullName: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@cruise.com',
    phoneNumber: '0901234567',
    cabinNumber: '402 (Ban công)',
    rfidTag: 'RFID-99412',
    qrCode: 'QR-99412',
    tourPackage: 'All-Inclusive VIP',
    bleZone: 'Zone A - Sky Lounge',
    registrationStatus: 'CONFIRMED',
    checkInStatus: 'BOARDED',
    boardedAt: '2026-10-15T08:30:00Z',
  },
  {
    id: 2,
    tourId: 1,
    fullName: 'Trần Thị Thu Thảo',
    email: 'thao.tran@cruise.com',
    phoneNumber: '0912345678',
    cabinNumber: '718 (Suite)',
    rfidTag: 'RFID-99413',
    qrCode: 'QR-99413',
    tourPackage: 'All-Inclusive VIP',
    bleZone: 'Zone C - Pool Deck',
    registrationStatus: 'CONFIRMED',
    checkInStatus: 'BOARDED',
    boardedAt: '2026-10-15T08:45:00Z',
  },
  {
    id: 3,
    tourId: 1,
    fullName: 'Lê Hoàng Nam',
    email: 'nam.le@cruise.com',
    phoneNumber: '0923456789',
    cabinNumber: '505 (Tiêu chuẩn)',
    rfidTag: 'RFID-88102',
    qrCode: 'QR-88102',
    tourPackage: 'Classic Cruise',
    bleZone: 'Zone B - Main Dining',
    registrationStatus: 'CONFIRMED',
    checkInStatus: 'BOARDED',
    boardedAt: '2026-10-15T09:10:00Z',
  },
  {
    id: 4,
    tourId: 1,
    fullName: 'Phạm Hồng Ánh',
    email: 'anh.pham@cruise.com',
    phoneNumber: '0934567890',
    cabinNumber: '812 (Oceanview)',
    rfidTag: 'RFID-77291',
    qrCode: 'QR-77291',
    tourPackage: 'Premium Tour',
    bleZone: 'Zone E - Theater',
    registrationStatus: 'PENDING',
    checkInStatus: 'NOT_CHECKED_IN',
  },
  {
    id: 5,
    tourId: 1,
    fullName: 'Đỗ Quốc Bảo',
    email: 'bao.do@cruise.com',
    phoneNumber: '0945678901',
    cabinNumber: '304 (Tiêu chuẩn)',
    rfidTag: 'RFID-66230',
    qrCode: 'QR-66230',
    tourPackage: 'Classic Cruise',
    bleZone: 'Chưa cập nhật',
    registrationStatus: 'CANCELLED',
    checkInStatus: 'NOT_CHECKED_IN',
  },
  {
    id: 6,
    tourId: 2,
    fullName: 'Vũ Hoàng Nam',
    email: 'nam.vu@cruise.com',
    phoneNumber: '0956789012',
    cabinNumber: '601 (Ban công)',
    rfidTag: 'RFID-55201',
    qrCode: 'QR-55201',
    tourPackage: 'Deluxe Sunset',
    bleZone: 'Zone D - Spa',
    registrationStatus: 'CONFIRMED',
    checkInStatus: 'BOARDED',
    boardedAt: '2026-10-20T10:00:00Z',
  },
];

let localPassengers: Passenger[] = [];

export const resetLocalPassengers = () => {
  localPassengers = [...INITIAL_PASSENGERS];
};

export async function fetchRegisteredPassengers(
  tourId: number,
  status?: RegistrationStatus
): Promise<Passenger[]> {
  try {
    const params = status ? { status } : {};
    const res = await apiClient.get<{ success: boolean; data: Passenger[] }>(
      `/activities/passengers/tour/${tourId}`,
      { params }
    );
    return res.data.data;
  } catch {
    return localPassengers.filter((p) => {
      if (p.tourId !== tourId) return false;
      if (status && p.registrationStatus !== status) return false;
      return true;
    });
  }
}

export async function fetchRegisteredPassengersPaged(
  tourId: number,
  options?: {
    keyword?: string;
    status?: RegistrationStatus;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }
): Promise<PageResponse<Passenger>> {
  try {
    const res = await apiClient.get<{ success: boolean; data: PageResponse<Passenger> }>(
      `/activities/passengers/tour/${tourId}/paged`,
      { params: options }
    );
    return res.data.data;
  } catch {
    const keyword = options?.keyword?.toLowerCase().trim() || '';
    const status = options?.status;
    const page = options?.page ?? 0;
    const size = options?.size ?? 10;
    const sortBy = options?.sortBy || 'cabinNumber';
    const sortDir = options?.sortDir || 'asc';

    let filtered = localPassengers.filter((p) => {
      if (p.tourId !== tourId) return false;
      if (status && p.registrationStatus !== status) return false;
      if (keyword) {
        const matchName = p.fullName.toLowerCase().includes(keyword);
        const matchCabin = p.cabinNumber.toLowerCase().includes(keyword);
        const matchRfid = p.rfidTag.toLowerCase().includes(keyword);
        if (!matchName && !matchCabin && !matchRfid) return false;
      }
      return true;
    });

    filtered = [...filtered].sort((a, b) => {
      const aVal = String((a as unknown as Record<string, unknown>)[sortBy] ?? '');
      const bVal = String((b as unknown as Record<string, unknown>)[sortBy] ?? '');
      return sortDir === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    });

    const start = page * size;
    const pagedContent = filtered.slice(start, start + size);

    return {
      content: pagedContent,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size) || 1,
      size,
      number: page,
    };
  }
}

export async function registerPassenger(
  payload: RegisterPassengerPayload
): Promise<Passenger> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Passenger }>(
      '/activities/passengers/register',
      payload
    );
    return res.data.data;
  } catch {
    const newPassenger: Passenger = {
      id: Date.now(),
      tourId: payload.tourId,
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      cabinNumber: payload.cabinNumber,
      rfidTag: payload.rfidTag,
      qrCode: payload.qrCode || `QR-${payload.rfidTag}`,
      tourPackage: payload.tourPackage,
      bleZone: payload.bleZone || 'Chưa cập nhật',
      registrationStatus: payload.registrationStatus || 'PENDING',
      checkInStatus: payload.checkInStatus || 'NOT_CHECKED_IN',
      boardedAt: payload.checkInStatus === 'BOARDED' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localPassengers.push(newPassenger);
    return newPassenger;
  }
}

export async function updateRegistrationStatus(
  passengerId: number,
  status: RegistrationStatus
): Promise<Passenger> {
  try {
    const res = await apiClient.patch<{ success: boolean; data: Passenger }>(
      `/activities/passengers/${passengerId}/registration-status`,
      null,
      { params: { status } }
    );
    return res.data.data;
  } catch {
    const p = localPassengers.find((item) => item.id === passengerId);
    if (p) {
      p.registrationStatus = status;
      p.updatedAt = new Date().toISOString();
      return { ...p };
    }
    throw new Error(`Passenger ${passengerId} not found`);
  }
}

export async function updateCheckInStatus(
  passengerId: number,
  status: CheckInStatus
): Promise<Passenger> {
  try {
    const res = await apiClient.patch<{ success: boolean; data: Passenger }>(
      `/activities/passengers/${passengerId}/check-in`,
      null,
      { params: { status } }
    );
    return res.data.data;
  } catch {
    const p = localPassengers.find((item) => item.id === passengerId);
    if (p) {
      p.checkInStatus = status;
      if (status === 'BOARDED' && !p.boardedAt) {
        p.boardedAt = new Date().toISOString();
      }
      p.updatedAt = new Date().toISOString();
      return { ...p };
    }
    throw new Error(`Passenger ${passengerId} not found`);
  }
}

export async function exportPassengersCsv(
  tourId: number,
  status?: RegistrationStatus
): Promise<Blob> {
  try {
    const params = status ? { status } : {};
    const res = await apiClient.get(`/activities/passengers/tour/${tourId}/export/csv`, {
      params,
      responseType: 'blob',
    });
    return res.data;
  } catch {
    const list = localPassengers.filter((p) => {
      if (p.tourId !== tourId) return false;
      if (status && p.registrationStatus !== status) return false;
      return true;
    });

    const header = '\ufeffID,Tour ID,Họ và Tên,Số Cabin,Mã Thẻ RFID,Mã QR,Gói Tour,Vị Trí BLE,Trạng Thái Check-in,Thời Gian Lên Tàu\n';
    const rows = list
      .map((p) =>
        [
          p.id,
          p.tourId,
          `"${p.fullName.replace(/"/g, '""')}"`,
          `"${p.cabinNumber.replace(/"/g, '""')}"`,
          `"${p.rfidTag.replace(/"/g, '""')}"`,
          `"${(p.qrCode || '').replace(/"/g, '""')}"`,
          `"${p.tourPackage.replace(/"/g, '""')}"`,
          `"${(p.bleZone || '').replace(/"/g, '""')}"`,
          p.checkInStatus,
          p.boardedAt || '',
        ].join(',')
      )
      .join('\n');

    return new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  }
}

export async function getPassengerBookingSummary(passengerId: number = 1): Promise<PassengerBookingSummary | null> {
  try {
    const res = await apiClient.get<{ success: boolean; data: PassengerBookingSummary }>(
      `/activities/passengers/${passengerId}/summary`
    );
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    console.warn('API /activities/passengers/summary unavailable, using fallback mock data', err);
  }

  const p = localPassengers.find((item) => item.id === passengerId) || localPassengers[0];
  if (!p) {
    return null;
  }
  return {
    passengerId: p.id,
    tourId: p.tourId,
    tourName: 'Hải trình Di sản Vịnh Hạ Long - Đà Nẵng',
    tourCode: 'CRUISE-' + p.tourId,
    fullName: p.fullName,
    email: p.email,
    phoneNumber: p.phoneNumber,
    cabinNumber: p.cabinNumber,
    cabinCategory: p.cabinNumber.includes('Suite')
      ? 'Royal Suite'
      : p.cabinNumber.includes('Ban công')
      ? 'Balcony Stateroom'
      : 'Deluxe Stateroom',
    rfidTag: p.rfidTag,
    qrCode: p.qrCode,
    tourPackage: p.tourPackage,
    bleZone: p.bleZone,
    registrationStatus: p.registrationStatus,
    checkInStatus: p.checkInStatus,
    boardedAt: p.boardedAt,
    totalRegisteredExcursions: 2,
    totalExcursionSpent: 165,
    registeredExcursions: [
      {
        excursionId: 2,
        excursionTitle: 'Khám phá Hang Sửng Sốt & Đảo Ti Tốp',
        ticketCode: 'TCK-HL-9921',
        groupName: 'Đoàn Hải Âu (Xe 01)',
        busNumber: 'BUS-16-A',
        status: 'CONFIRMED',
        gatheringTime: '08:00',
        returnToShipTime: '15:30',
        portName: 'Cảng Tuần Châu (Hạ Long)',
        price: 110,
      },
      {
        excursionId: 4,
        excursionTitle: 'Phố Cổ Hội An & Thuyền Đèn Lồng',
        ticketCode: 'TCK-HA-8834',
        groupName: 'Đoàn Sao Biển (Xe 02)',
        busNumber: 'BUS-29-B',
        status: 'CONFIRMED',
        gatheringTime: '09:00',
        returnToShipTime: '17:00',
        portName: 'Cảng Tiên Sa (Đà Nẵng)',
        price: 55,
      },
    ],
  };
}
