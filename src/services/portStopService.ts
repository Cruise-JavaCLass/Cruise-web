import { apiClient } from './api';

export interface Port {
  id: number;
  name: string;
  code: string;
  country: string;
  city: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  active: boolean;
}

export interface CruiseStop {
  id: number;
  tourId: number;
  portId: number;
  portName?: string;
  portCode?: string;
  portCity?: string;
  stopOrder: number;
  arrivalTime: string;
  departureTime: string;
  allAboardTime?: string;
  description?: string;
  active: boolean;
}

export interface StopFormData {
  portId: number | '';
  stopOrder: number | '';
  arrivalTime: string;
  departureTime: string;
  allAboardTime?: string;
  description?: string;
}

export const INITIAL_PORTS: Port[] = [
  {
    id: 1,
    name: 'Cảng Quốc Tế Tuần Châu',
    code: 'VN-TCH',
    country: 'Việt Nam',
    city: 'Hạ Long',
    timezone: 'Asia/Ho_Chi_Minh',
    active: true,
  },
  {
    id: 2,
    name: 'Cảng Hành Khách Nha Trang',
    code: 'VN-NHA',
    country: 'Việt Nam',
    city: 'Nha Trang',
    timezone: 'Asia/Ho_Chi_Minh',
    active: true,
  },
  {
    id: 3,
    name: 'Cảng An Thới',
    code: 'VN-ATH',
    country: 'Việt Nam',
    city: 'Phú Quốc',
    timezone: 'Asia/Ho_Chi_Minh',
    active: true,
  },
  {
    id: 4,
    name: 'Cảng Tiên Sa',
    code: 'VN-TSA',
    country: 'Việt Nam',
    city: 'Đà Nẵng',
    timezone: 'Asia/Ho_Chi_Minh',
    active: true,
  },
];

export const INITIAL_STOPS: Record<number, CruiseStop[]> = {
  1: [
    {
      id: 101,
      tourId: 1,
      portId: 1,
      portName: 'Cảng Quốc Tế Tuần Châu',
      portCode: 'VN-TCH',
      portCity: 'Hạ Long',
      stopOrder: 1,
      arrivalTime: '2026-10-15T08:00',
      departureTime: '2026-10-15T12:00',
      allAboardTime: '2026-10-15T11:30',
      description: 'Đón khách tại bến Tuần Châu và làm thủ tục lên tàu',
      active: true,
    },
    {
      id: 102,
      tourId: 1,
      portId: 4,
      portName: 'Cảng Tiên Sa',
      portCode: 'VN-TSA',
      portCity: 'Đà Nẵng',
      stopOrder: 2,
      arrivalTime: '2026-10-16T14:00',
      departureTime: '2026-10-17T18:00',
      allAboardTime: '2026-10-17T17:30',
      description: 'Khám phá bán đảo Sơn Trà và phố cổ Hội An',
      active: true,
    },
  ],
};

let localPorts: Port[] = [];
let localStops: Record<number, CruiseStop[]> = {};

export async function getPorts(): Promise<Port[]> {
  try {
    const res = await apiClient.get<{ data: { content?: Port[] } | Port[] }>('/itinerary/ports');
    if (res.data && 'data' in res.data) {
      const data = res.data.data;
      if (Array.isArray(data)) return data;
      if (data && 'content' in data && Array.isArray(data.content)) return data.content;
    }
    return localPorts;
  } catch {
    return localPorts;
  }
}

export async function getTourStops(tourId: number): Promise<CruiseStop[]> {
  try {
    const res = await apiClient.get<{ data: CruiseStop[] }>(`/itinerary/tours/${tourId}/stops`);
    if (res.data?.data) return res.data.data;
    return localStops[tourId] || [];
  } catch {
    return localStops[tourId] || [];
  }
}

export async function createTourStop(tourId: number, data: StopFormData): Promise<CruiseStop> {
  const payload = {
    ...data,
    portId: Number(data.portId),
    stopOrder: Number(data.stopOrder),
  };
  try {
    const res = await apiClient.post<{ data: CruiseStop }>(`/itinerary/tours/${tourId}/stops`, payload);
    return res.data.data;
  } catch {
    const assignedPort = localPorts.find((p) => p.id === Number(data.portId));
    const newStop: CruiseStop = {
      id: Date.now(),
      tourId,
      portId: Number(data.portId),
      portName: assignedPort?.name,
      portCode: assignedPort?.code,
      portCity: assignedPort?.city,
      stopOrder: Number(data.stopOrder),
      arrivalTime: data.arrivalTime,
      departureTime: data.departureTime,
      allAboardTime: data.allAboardTime,
      description: data.description,
      active: true,
    };
    if (!localStops[tourId]) localStops[tourId] = [];
    localStops[tourId].push(newStop);
    return newStop;
  }
}

export async function deleteTourStop(tourId: number, stopId: number): Promise<void> {
  try {
    await apiClient.delete(`/itinerary/tours/${tourId}/stops/${stopId}`);
  } catch {
    if (localStops[tourId]) {
      localStops[tourId] = localStops[tourId].filter((s) => s.id !== stopId);
    }
  }
}
