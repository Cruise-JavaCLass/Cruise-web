import { apiClient } from './api';
import type { ActivityStatus } from './activityService';
import type { ExcursionStatus } from './excursionService';

export type CatalogItemType = 'ONBOARD_ACTIVITY' | 'SHORE_EXCURSION';

export interface PassengerCatalogItem {
  id: number;
  tourId: number;
  itemType: CatalogItemType;
  title: string;
  description?: string;
  category: string;
  locationOrPort: string;
  portId?: number;
  dayNumber: number;
  activityDate: string;
  startTime: string;
  endTime: string;
  gatheringTime?: string;
  departureTime?: string;
  returnToShipTime?: string;
  maxCapacity: number;
  currentParticipants: number;
  remainingCapacity: number;
  isIncluded: boolean;
  price: number;
  childPrice?: number;
  currency: string;
  status: ActivityStatus | ExcursionStatus | string;
  isSoldOut: boolean;
}

export interface CatalogFilterParams {
  dayNumber?: number;
  portId?: number;
  itemType?: CatalogItemType;
  isIncluded?: boolean;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  isFallback?: boolean;
}

export const passengerCatalogService = {
  async getCatalogItems(
    tourId: number,
    params: CatalogFilterParams = {}
  ): Promise<PagedResponse<PassengerCatalogItem>> {
    try {
      const response = await apiClient.get<{ success: boolean; data: PagedResponse<PassengerCatalogItem> }>(
        `/api/passenger-portal/catalog/tour/${tourId}`,
        { params }
      );
      if (response.data && response.data.data) {
        return { ...response.data.data, isFallback: false };
      }
    } catch (error) {
      console.warn('API /api/passenger-portal/catalog unavailable, using local demo fallback data.', error);
    }
    const fallback = getFallbackCatalogItems(tourId, params);
    return { ...fallback, isFallback: true };
  },

  async getCatalogItemDetail(
    itemType: CatalogItemType,
    id: number
  ): Promise<PassengerCatalogItem | null> {
    try {
      const response = await apiClient.get<{ success: boolean; data: PassengerCatalogItem }>(
        `/api/passenger-portal/catalog/detail/${itemType}/${id}`
      );
      if (response.data && response.data.data) {
        return response.data.data;
      }
    } catch (error) {
      console.warn(`API /api/passenger-portal/catalog/detail/${itemType}/${id} unavailable, using fallback`, error);
    }
    const fallbackList = getFallbackCatalogItems(1, {}).content;
    return fallbackList.find(item => item.itemType === itemType && item.id === id) || null;
  }
};

function getFallbackCatalogItems(
  tourId: number,
  params: CatalogFilterParams
): PagedResponse<PassengerCatalogItem> {
  const mockItems: PassengerCatalogItem[] = [
    {
      id: 1,
      tourId,
      itemType: 'ONBOARD_ACTIVITY',
      title: 'Sunrise Deck Yoga & Meditation',
      description: 'Start your cruising day with serene morning yoga facing the ocean breeze.',
      category: 'WELLNESS',
      locationOrPort: 'Deck 11 Sun Deck',
      dayNumber: 1,
      activityDate: '2026-10-18',
      startTime: '06:30',
      endTime: '07:30',
      gatheringTime: '06:30',
      departureTime: '06:30',
      returnToShipTime: '07:30',
      maxCapacity: 25,
      currentParticipants: 12,
      remainingCapacity: 13,
      isIncluded: true,
      price: 0,
      currency: 'USD',
      status: 'SCHEDULED',
      isSoldOut: false,
    },
    {
      id: 2,
      tourId,
      itemType: 'SHORE_EXCURSION',
      title: 'Halong Bay Majestic Cave Expedition & Kayaking',
      description: 'Discover UNESCO Heritage stalactite caves and paddle crystal emerald waterways.',
      category: 'ADVENTURE',
      locationOrPort: 'Halong International Port',
      portId: 101,
      dayNumber: 2,
      activityDate: '2026-10-19',
      startTime: '08:00',
      endTime: '15:30',
      gatheringTime: '08:00',
      departureTime: '08:30',
      returnToShipTime: '15:30',
      maxCapacity: 30,
      currentParticipants: 28,
      remainingCapacity: 2,
      isIncluded: false,
      price: 110,
      childPrice: 75,
      currency: 'USD',
      status: 'SCHEDULED',
      isSoldOut: false,
    },
    {
      id: 3,
      tourId,
      itemType: 'ONBOARD_ACTIVITY',
      title: 'Chef Special Italian Wine & Pasta Masterclass',
      description: 'Learn artisanal pasta rolling and authentic Italian sauce secrets with our Executive Chef.',
      category: 'CULINARY',
      locationOrPort: 'Deck 4 Culinary Studio',
      dayNumber: 2,
      activityDate: '2026-10-19',
      startTime: '16:00',
      endTime: '18:00',
      gatheringTime: '16:00',
      departureTime: '16:00',
      returnToShipTime: '18:00',
      maxCapacity: 15,
      currentParticipants: 15,
      remainingCapacity: 0,
      isIncluded: false,
      price: 45,
      currency: 'USD',
      status: 'SCHEDULED',
      isSoldOut: true,
    },
    {
      id: 4,
      tourId,
      itemType: 'SHORE_EXCURSION',
      title: 'Danang & Hoi An Ancient Town Cultural Walking Tour',
      description: 'Stroll through glowing lantern streets, Japanese covered bridge, and taste Cao Lau.',
      category: 'CULTURAL',
      locationOrPort: 'Tien Sa Port - Da Nang',
      portId: 102,
      dayNumber: 3,
      activityDate: '2026-10-20',
      startTime: '09:00',
      endTime: '17:00',
      gatheringTime: '09:00',
      departureTime: '09:30',
      returnToShipTime: '17:00',
      maxCapacity: 40,
      currentParticipants: 20,
      remainingCapacity: 20,
      isIncluded: true,
      price: 0,
      currency: 'USD',
      status: 'SCHEDULED',
      isSoldOut: false,
    },
    {
      id: 5,
      tourId,
      itemType: 'ONBOARD_ACTIVITY',
      title: 'Broadway Musical Gala: The Phantom at Sea',
      description: 'World-class musical theater performance with dazzling costumes and orchestral live score.',
      category: 'ENTERTAINMENT',
      locationOrPort: 'Deck 3 Grand Starlight Theater',
      dayNumber: 3,
      activityDate: '2026-10-20',
      startTime: '20:30',
      endTime: '22:15',
      gatheringTime: '20:30',
      departureTime: '20:30',
      returnToShipTime: '22:15',
      maxCapacity: 400,
      currentParticipants: 180,
      remainingCapacity: 220,
      isIncluded: true,
      price: 0,
      currency: 'USD',
      status: 'SCHEDULED',
      isSoldOut: false,
    }
  ];

  let filtered = mockItems.filter(item => {
    if (params.dayNumber !== undefined && item.dayNumber !== params.dayNumber) {
      return false;
    }
    if (params.portId !== undefined && item.portId !== params.portId) {
      return false;
    }
    if (params.itemType && item.itemType !== params.itemType) {
      return false;
    }
    if (params.isIncluded !== undefined && item.isIncluded !== params.isIncluded) {
      return false;
    }
    if (params.keyword && params.keyword.trim() !== '') {
      const q = params.keyword.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchLoc = item.locationOrPort.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) {
        return false;
      }
    }
    return true;
  });

  const page = params.page || 0;
  const size = params.size || 10;
  const start = page * size;
  const pagedContent = filtered.slice(start, start + size);

  return {
    content: pagedContent,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size) || 1,
    size,
    number: page
  };
}
