import { apiClient } from './api';

export interface DailyActivityItem {
  id: number;
  time: string; // e.g. "08:00"
  title: string;
  location: string;
  category: 'DINING' | 'ENTERTAINMENT' | 'WELLNESS' | 'SHORE_EXCURSION' | 'NAVIGATION' | 'OTHER';
  isIncluded: boolean;
  price?: number;
  currency?: string;
  capacity?: number;
  enrolledCount?: number;
  description?: string;
}

export interface DailyItineraryDay {
  dayNumber: number; // Day 1, Day 2...
  date: string; // YYYY-MM-DD
  title: string; // e.g. "Ngày 1: Rời bến Tuần Châu & Tiệc Chào Mừng"
  portName?: string;
  portStatus: 'DEPARTURE' | 'AT_SEA' | 'DOCKING' | 'ARRIVAL';
  seaDay: boolean;
  arrivalTime?: string; // HH:mm
  departureTime?: string; // HH:mm
  allAboardTime?: string; // HH:mm
  weatherForecast?: string;
  isAffected?: boolean;
  changeReason?: string;
  activities: DailyActivityItem[];
}

export interface ItineraryChangeHistoryItem {
  id: number;
  timestamp: string;
  author: string;
  action: string; // e.g. "CẬP NHẬT HOẠT ĐỘNG", "THÊM HOẠT ĐỘNG", "ĐỔI THỨ TỰ", "ĐIỀU CHỈNH CẢNG"
  description: string;
  dayNumber?: number;
  details?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

export interface TourDailyItinerary {
  tourId: number;
  tourName: string;
  tourCode: string;
  startDate: string;
  endDate: string;
  lastUpdated?: string;
  updateNotice?: string;
  changeHistory?: ItineraryChangeHistoryItem[];
  days: DailyItineraryDay[];
}

export interface ActivityFormData {
  time: string;
  title: string;
  location: string;
  category: DailyActivityItem['category'];
  isIncluded: boolean;
  price?: number;
  capacity?: number;
  description?: string;
}

export const CATEGORY_LABELS: Record<DailyActivityItem['category'], { label: string; color: string; bg: string; border: string }> = {
  DINING: {
    label: 'Ẩm thực & Buffet',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  ENTERTAINMENT: {
    label: 'Giải trí & Gala',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  WELLNESS: {
    label: 'Spa & Thư giãn',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  SHORE_EXCURSION: {
    label: 'Tour trên bờ',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  NAVIGATION: {
    label: 'Hải trình & Cập cảng',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  OTHER: {
    label: 'Dịch vụ khác',
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
};

export const INITIAL_DAILY_ITINERARIES: Record<number, TourDailyItinerary> = {
  1: {
    tourId: 1,
    tourName: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
    tourCode: 'TOUR-HL-001',
    startDate: '2026-10-15',
    endDate: '2026-10-18',
    lastUpdated: '2026-10-12 09:30',
    updateNotice: 'Lịch trình đã được cập nhật: Điều chỉnh thời gian cập cảng Tiên Sa và thêm tiệc Gala Dinner',
    changeHistory: [
      {
        id: 1,
        timestamp: '2026-10-12 09:30',
        author: 'Nguyễn Văn Quản Trị (Ops Manager)',
        action: 'CẬP NHẬT HOẠT ĐỘNG',
        description: 'Bổ sung Gala Dinner & Vũ Điệu Biển Hoàng Gia vào Ngày 1',
        dayNumber: 1,
        details: 'Tăng sức chứa lên 500 khách và bổ sung nghệ sĩ biểu diễn live acoustic',
        field: 'Hoạt động tối',
        oldValue: 'Tự do ngắm cảnh vịnh',
        newValue: 'Gala Dinner & Vũ Điệu Biển Hoàng Gia',
      },
      {
        id: 2,
        timestamp: '2026-10-11 16:45',
        author: 'Lê Hàng Hải (Cruise Coordinator)',
        action: 'ĐIỀU CHỈNH CẢNG',
        description: 'Điều chỉnh thời gian cập cảng Tiên Sa, Đà Nẵng',
        dayNumber: 3,
        details: 'Cập nhật theo thông báo luồng hàng hải của Cảng vụ Đà Nẵng',
        field: 'Giờ cập cảng',
        oldValue: '08:00',
        newValue: '08:30',
      },
      {
        id: 3,
        timestamp: '2026-10-10 14:00',
        author: 'Trần Điều Hành (Tour Director)',
        action: 'THÊM TOUR TRÊN BỜ',
        description: 'Mở bán Tour Tham Quan Phố Cổ Hội An & Chùa Cầu',
        dayNumber: 3,
        details: 'Bổ sung 120 suất vé tham quan Hội An kèm bữa tối đặc sản Quảng Nam',
        field: 'Dịch vụ phụ thu',
        oldValue: 'Không có',
        newValue: 'Tour Hội An 1,500,000 VND',
      },
      {
        id: 4,
        timestamp: '2026-10-09 10:15',
        author: 'Nguyễn Văn Quản Trị (Ops Manager)',
        action: 'KHỞI TẠO LỊCH TRÌNH',
        description: 'Khởi tạo khung lịch trình chi tiết 4 ngày 3 đêm cho tour',
        details: 'Hoàn thiện lịch trình sơ bộ theo phê duyệt hải trình',
      },
    ],
    days: [
      {
        dayNumber: 1,
        date: '2026-10-15',
        title: 'Khởi hành tại Cảng Quốc Tế Tuần Châu & Tiệc Chào Mừng',
        portName: 'Cảng Tuần Châu (Hạ Long)',
        portStatus: 'DEPARTURE',
        seaDay: false,
        activities: [
          {
            id: 1001,
            time: '08:00',
            title: 'Làm thủ tục Check-in & Nhận phòng cabin',
            location: 'Nhà ga quốc tế Tuần Châu',
            category: 'NAVIGATION',
            isIncluded: true,
            description: 'Đón tiếp đại biểu và hành khách, tiếp nhận hành lý lên du thuyền',
          },
          {
            id: 1002,
            time: '12:00',
            title: 'Tàu xuất bến & Buffet trưa Hải sản Á - Âu',
            location: 'Tầng 3 - Nhà hàng Imperial Ocean',
            category: 'DINING',
            isIncluded: true,
            description: 'Thưởng thức ẩm thực tươi ngon ngắm nhìn hàng ngàn đảo đá vôi kỳ vĩ',
          },
          {
            id: 1003,
            time: '19:30',
            title: 'Gala Dinner & Vũ Điệu Biển Hoàng Gia',
            location: 'Tầng 7 - Grand Ballroom',
            category: 'ENTERTAINMENT',
            isIncluded: true,
            capacity: 500,
            enrolledCount: 450,
            description: 'Đêm nhạc sống acoustic giao lưu cùng Thuyền trưởng và dàn nhạc giao hưởng',
          },
        ],
      },
      {
        dayNumber: 2,
        date: '2026-10-16',
        title: 'Hành trình trên biển & Thư giãn hoàng hôn',
        portName: 'Vịnh Bắc Bộ — Biển Đông',
        portStatus: 'AT_SEA',
        seaDay: true,
        activities: [
          {
            id: 1004,
            time: '06:30',
            title: 'Lớp Yoga & Thái Cực Quyền đón bình minh',
            location: 'Tầng 12 - Sundeck',
            category: 'WELLNESS',
            isIncluded: true,
            description: 'Hít thở không khí trong lành giữa đại dương mênh mông',
          },
          {
            id: 1005,
            time: '14:00',
            title: 'Hội thảo Trải nghiệm Rượu vang & Ẩm thực Địa Trung Hải',
            location: 'Tầng 5 - Sunset Lounge',
            category: 'DINING',
            isIncluded: false,
            price: 650000,
            currency: 'VND',
            capacity: 40,
            enrolledCount: 32,
            description: 'Chuyên gia sommelier giới thiệu 5 loại vang cổ điển kèm phô mai hảo hạng',
          },
          {
            id: 1006,
            time: '17:00',
            title: 'Lớp Học Pha Chế Cocktail Hoàng Hôn',
            location: 'Tầng 12 - Sky Deck Bar',
            category: 'ENTERTAINMENT',
            isIncluded: false,
            price: 550000,
            currency: 'VND',
            capacity: 35,
            enrolledCount: 28,
            description: 'Trải nghiệm tự tay lắc cocktail cùng bartender chuyên nghiệp',
          },
        ],
      },
      {
        dayNumber: 3,
        date: '2026-10-17',
        title: 'Cập cảng Tiên Sa & Tour Khám phá Phố Cổ Hội An',
        portName: 'Cảng Tiên Sa (Đà Nẵng)',
        portStatus: 'DOCKING',
        seaDay: false,
        activities: [
          {
            id: 1007,
            time: '08:30',
            title: 'Cập cảng Tiên Sa & Điểm danh tham quan',
            location: 'Cảng Tiên Sa, Đà Nẵng',
            category: 'NAVIGATION',
            isIncluded: true,
            description: 'Tàu thả neo an toàn, hành khách chuẩn bị giấy tờ xuất bến',
          },
          {
            id: 1008,
            time: '09:00',
            title: 'Tour Tham Quan Phố Cổ Hội An & Chùa Cầu',
            location: 'Cảng Tiên Sa -> Hội An',
            category: 'SHORE_EXCURSION',
            isIncluded: false,
            price: 1500000,
            currency: 'VND',
            capacity: 120,
            enrolledCount: 120,
            description: 'Xe đưa đón đời mới, hướng dẫn viên song ngữ, trải nghiệm làm lồng đèn truyền thống',
          },
          {
            id: 1009,
            time: '17:30',
            title: 'All-Aboard & Toàn bộ hành khách trở lại du thuyền',
            location: 'Cầu tàu Tiên Sa',
            category: 'NAVIGATION',
            isIncluded: true,
            description: 'Kiểm soát an ninh và đối chiếu số lượng khách trước khi nhổ neo',
          },
        ],
      },
      {
        dayNumber: 4,
        date: '2026-10-18',
        title: 'Hải trình hồi cảng Tuần Châu & Kết thúc hành trình',
        portName: 'Cảng Tuần Châu (Hạ Long)',
        portStatus: 'ARRIVAL',
        seaDay: false,
        activities: [
          {
            id: 1010,
            time: '07:30',
            title: 'Tiệc Buffet chia tay & Quyết toán chi tiêu thẻ Onboard',
            location: 'Tầng 3 - Grand Restaurant',
            category: 'DINING',
            isIncluded: true,
            description: 'Thưởng thức bữa sáng chia tay và hoàn tất thanh toán hóa đơn hành trình',
          },
          {
            id: 1011,
            time: '10:30',
            title: 'Cập bến Tuần Châu & Hỗ trợ hành lý lên bờ',
            location: 'Nhà ga Cảng Tuần Châu',
            category: 'NAVIGATION',
            isIncluded: true,
            description: 'Chào tạm biệt quý khách, xe trung chuyển đưa khách về điểm hẹn',
          },
        ],
      },
    ],
  },
};

let localDailyItineraries: Record<number, TourDailyItinerary> = { ...INITIAL_DAILY_ITINERARIES };

export async function getDailyItinerary(tourId: number): Promise<TourDailyItinerary | null> {
  try {
    const res = await apiClient.get<{ data: TourDailyItinerary }>(`/itinerary/tours/${tourId}/daily-itinerary`);
    if (res.data?.data) return res.data.data;
    return localDailyItineraries[tourId] || null;
  } catch {
    return localDailyItineraries[tourId] || null;
  }
}

function buildActivityItem(id: number, data: ActivityFormData): DailyActivityItem {
  const price = data.price ? Number(data.price) : undefined;
  const capacity = data.capacity ? Number(data.capacity) : undefined;
  return {
    id,
    time: data.time,
    title: data.title,
    location: data.location,
    category: data.category,
    isIncluded: data.isIncluded,
    price,
    currency: price ? 'VND' : undefined,
    capacity,
    enrolledCount: 0,
    description: data.description,
  };
}

function recordHistoryEntry(
  tourId: number,
  entry: Omit<ItineraryChangeHistoryItem, 'id' | 'timestamp'>
) {
  const target = localDailyItineraries[tourId];
  if (!target) return;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  target.lastUpdated = now;
  if (!target.changeHistory) {
    target.changeHistory = [];
  }
  target.changeHistory.unshift({
    ...entry,
    id: Date.now(),
    timestamp: now,
  });
}

export async function addDailyActivity(
  tourId: number,
  dayNumber: number,
  activityData: ActivityFormData
): Promise<DailyActivityItem> {
  const payload = {
    ...activityData,
    price: activityData.price ? Number(activityData.price) : undefined,
    capacity: activityData.capacity ? Number(activityData.capacity) : undefined,
  };

  try {
    const res = await apiClient.post<{ data: DailyActivityItem }>(
      `/itinerary/tours/${tourId}/days/${dayNumber}/activities`,
      payload
    );
    return res.data.data;
  } catch {
    const newAct = buildActivityItem(Date.now(), activityData);

    if (localDailyItineraries[tourId]) {
      const day = localDailyItineraries[tourId].days.find((d) => d.dayNumber === dayNumber);
      if (day) {
        day.activities.push(newAct);
        day.activities.sort((a, b) => a.time.localeCompare(b.time));
        recordHistoryEntry(tourId, {
          author: 'Quản trị viên (Admin)',
          action: 'THÊM HOẠT ĐỘNG',
          description: `Thêm hoạt động "${newAct.title}" vào Ngày ${dayNumber}`,
          dayNumber,
          details: `Địa điểm: ${newAct.location}, Thời gian: ${newAct.time}`,
          newValue: newAct.title,
        });
      }
    }
    return newAct;
  }
}

export async function updateDailyActivity(
  tourId: number,
  dayNumber: number,
  activityId: number,
  activityData: ActivityFormData
): Promise<DailyActivityItem> {
  const payload = {
    ...activityData,
    price: activityData.price ? Number(activityData.price) : undefined,
    capacity: activityData.capacity ? Number(activityData.capacity) : undefined,
  };

  try {
    const res = await apiClient.put<{ data: DailyActivityItem }>(
      `/itinerary/tours/${tourId}/days/${dayNumber}/activities/${activityId}`,
      payload
    );
    return res.data.data;
  } catch {
    const updated = buildActivityItem(activityId, activityData);

    if (localDailyItineraries[tourId]) {
      const day = localDailyItineraries[tourId].days.find((d) => d.dayNumber === dayNumber);
      if (day) {
        const oldAct = day.activities.find((a) => a.id === activityId);
        day.activities = day.activities.map((a) => (a.id === activityId ? { ...a, ...updated } : a));
        day.activities.sort((a, b) => a.time.localeCompare(b.time));
        recordHistoryEntry(tourId, {
          author: 'Quản trị viên (Admin)',
          action: 'CẬP NHẬT HOẠT ĐỘNG',
          description: `Cập nhật hoạt động "${updated.title}" tại Ngày ${dayNumber}`,
          dayNumber,
          oldValue: oldAct?.title,
          newValue: updated.title,
        });
      }
    }
    return updated;
  }
}

export async function reorderDailyActivities(
  tourId: number,
  dayNumber: number,
  orderedActivityIds: number[]
): Promise<DailyActivityItem[]> {
  try {
    const res = await apiClient.put<{ data: DailyActivityItem[] }>(
      `/itinerary/tours/${tourId}/days/${dayNumber}/activities/reorder`,
      { orderedActivityIds }
    );
    return res.data.data;
  } catch {
    if (localDailyItineraries[tourId]) {
      const day = localDailyItineraries[tourId].days.find((d) => d.dayNumber === dayNumber);
      if (day) {
        const idMap = new Map(day.activities.map((act) => [act.id, act]));
        day.activities = orderedActivityIds
          .map((id) => idMap.get(id))
          .filter((act): act is DailyActivityItem => act !== undefined);
        recordHistoryEntry(tourId, {
          author: 'Quản trị viên (Admin)',
          action: 'ĐỔI THỨ TỰ HOẠT ĐỘNG',
          description: `Thay đổi thứ tự sắp xếp các hoạt động trong Ngày ${dayNumber}`,
          dayNumber,
        });
        return day.activities;
      }
    }
    return [];
  }
}

export async function deleteDailyActivity(
  tourId: number,
  dayNumber: number,
  activityId: number
): Promise<void> {
  try {
    await apiClient.delete(`/itinerary/tours/${tourId}/days/${dayNumber}/activities/${activityId}`);
  } catch {
    if (localDailyItineraries[tourId]) {
      const day = localDailyItineraries[tourId].days.find((d) => d.dayNumber === dayNumber);
      if (day) {
        const removed = day.activities.find((a) => a.id === activityId);
        day.activities = day.activities.filter((a) => a.id !== activityId);
        recordHistoryEntry(tourId, {
          author: 'Quản trị viên (Admin)',
          action: 'XÓA HOẠT ĐỘNG',
          description: `Xóa hoạt động "${removed?.title || activityId}" khỏi Ngày ${dayNumber}`,
          dayNumber,
          oldValue: removed?.title,
        });
      }
    }
  }
}
