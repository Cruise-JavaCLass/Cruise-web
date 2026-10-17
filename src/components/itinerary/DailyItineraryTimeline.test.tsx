import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyItineraryTimeline } from './DailyItineraryTimeline';
import * as dailyItineraryService from '../../services/dailyItineraryService';
import type { CruiseTour } from '../../services/tourService';

const mockTour: CruiseTour = {
  id: 1,
  name: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
  code: 'TOUR-HL-001',
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
  status: 'PUBLISHED',
  active: true,
};

const mockItineraryData: dailyItineraryService.TourDailyItinerary = {
  tourId: 1,
  tourName: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
  tourCode: 'TOUR-HL-001',
  startDate: '2026-10-15',
  endDate: '2026-10-18',
  days: [
    {
      dayNumber: 1,
      date: '2026-10-15',
      title: 'Khởi hành tại Cảng Quốc Tế Tuần Châu',
      portName: 'Cảng Tuần Châu (Hạ Long)',
      portStatus: 'DEPARTURE',
      seaDay: false,
      activities: [
        {
          id: 101,
          time: '08:00',
          title: 'Làm thủ tục Check-in & Nhận phòng',
          location: 'Nhà ga quốc tế Tuần Châu',
          category: 'NAVIGATION',
          isIncluded: true,
          description: 'Đón tiếp và nhận hành lý',
        },
        {
          id: 102,
          time: '19:30',
          title: 'Gala Dinner & Vũ Điệu Biển Hoàng Gia',
          location: 'Tầng 7 - Grand Ballroom',
          category: 'ENTERTAINMENT',
          isIncluded: true,
        },
      ],
    },
    {
      dayNumber: 2,
      date: '2026-10-16',
      title: 'Hành trình trên biển',
      portName: 'Biển Đông',
      portStatus: 'AT_SEA',
      seaDay: true,
      activities: [
        {
          id: 103,
          time: '14:00',
          title: 'Hội thảo Thử Rượu Vang Cao Cấp',
          location: 'Tầng 5 - Sunset Lounge',
          category: 'DINING',
          isIncluded: false,
          price: 650000,
          currency: 'VND',
        },
      ],
    },
  ],
};

describe('DailyItineraryTimeline (KAN-119)', () => {
  beforeEach(() => {
    vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue(mockItineraryData);
  });

  it('renders daily itinerary timeline and activities for Day 1', async () => {
    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
      expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
      expect(screen.getByText('Gala Dinner & Vũ Điệu Biển Hoàng Gia')).toBeInTheDocument();
    });
  });

  it('switches between days when clicking tabs', async () => {
    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
    });

    const day2Tab = screen.getByRole('button', { name: /Ngày 2/i });
    fireEvent.click(day2Tab);

    await waitFor(() => {
      expect(screen.getByText('Hội thảo Thử Rượu Vang Cao Cấp')).toBeInTheDocument();
      expect(screen.queryByText('Làm thủ tục Check-in & Nhận phòng')).not.toBeInTheDocument();
    });
  });

  it('filters activities by category select', async () => {
    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
      expect(screen.getByText('Gala Dinner & Vũ Điệu Biển Hoàng Gia')).toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/Lọc hoạt động theo loại/i);
    fireEvent.change(filterSelect, { target: { value: 'NAVIGATION' } });

    expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
    expect(screen.queryByText('Gala Dinner & Vũ Điệu Biển Hoàng Gia')).not.toBeInTheDocument();
  });

  it('opens activity modal, validates fields, and adds new activity', async () => {
    vi.spyOn(dailyItineraryService, 'addDailyActivity').mockResolvedValue({
      id: 999,
      time: '10:00',
      title: 'Lớp Học Nấu Ăn Ẩm Thực Biển',
      location: 'Tầng 3 - Bếp Mở',
      category: 'DINING',
      isIncluded: true,
    });

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Thêm Hoạt Động Vào Ngày 1/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Thêm Hoạt Động Vào Lịch Trình')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/Gala Dinner Thuyền Trưởng/i);
    const locationInput = screen.getByPlaceholderText(/Tầng 7 - Grand Ballroom/i);
    const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });

    fireEvent.change(titleInput, { target: { value: 'Lớp Học Nấu Ăn Ẩm Thực Biển' } });
    fireEvent.change(locationInput, { target: { value: 'Tầng 3 - Bếp Mở' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(dailyItineraryService.addDailyActivity).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({
          title: 'Lớp Học Nấu Ăn Ẩm Thực Biển',
          location: 'Tầng 3 - Bếp Mở',
        })
      );
    });
  });

  it('deletes activity when clicking trash button', async () => {
    vi.spyOn(dailyItineraryService, 'deleteDailyActivity').mockResolvedValue(undefined);

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole('button', {
      name: /Xóa hoạt động Làm thủ tục Check-in & Nhận phòng/i,
    });
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(dailyItineraryService.deleteDailyActivity).toHaveBeenCalledWith(1, 1, 101);
    });
  });

  it('opens edit modal and updates existing activity (KAN-120)', async () => {
    vi.spyOn(dailyItineraryService, 'updateDailyActivity').mockResolvedValue({
      id: 101,
      time: '08:30',
      title: 'Làm thủ tục Check-in & VIP Lounge Welcome',
      location: 'Nhà ga VIP Tuần Châu',
      category: 'NAVIGATION',
      isIncluded: true,
    });

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', {
      name: /Cập nhật hoạt động Làm thủ tục Check-in & Nhận phòng/i,
    });
    fireEvent.click(editBtn);

    expect(screen.getByText('Cập Nhật Hoạt Động Lịch Trình')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue('Làm thủ tục Check-in & Nhận phòng');
    fireEvent.change(titleInput, { target: { value: 'Làm thủ tục Check-in & VIP Lounge Welcome' } });

    const submitBtn = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(dailyItineraryService.updateDailyActivity).toHaveBeenCalledWith(
        1,
        1,
        101,
        expect.objectContaining({
          title: 'Làm thủ tục Check-in & VIP Lounge Welcome',
        })
      );
    });
  });

  it('reorders activities using move up and move down buttons (KAN-120)', async () => {
    vi.spyOn(dailyItineraryService, 'reorderDailyActivities').mockResolvedValue([
      mockItineraryData.days[0].activities[1],
      mockItineraryData.days[0].activities[0],
    ]);

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Làm thủ tục Check-in & Nhận phòng')).toBeInTheDocument();
      expect(screen.getByText('Gala Dinner & Vũ Điệu Biển Hoàng Gia')).toBeInTheDocument();
    });

    const moveDownBtn = screen.getByRole('button', {
      name: /Di chuyển xuống dưới Làm thủ tục Check-in & Nhận phòng/i,
    });
    expect(moveDownBtn).not.toBeDisabled();

    fireEvent.click(moveDownBtn);

    await waitFor(() => {
      expect(dailyItineraryService.reorderDailyActivities).toHaveBeenCalledWith(1, 1, [102, 101]);
    });
  });

  it('displays updated itinerary timestamp and notice banner (KAN-129)', async () => {
    vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue({
      ...mockItineraryData,
      lastUpdated: '2026-10-12 10:15',
      updateNotice: 'Hải trình cập nhật do ảnh hưởng áp thấp nhiệt đới: Tránh vùng biển động',
    });

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText(/Cập nhật: 2026-10-12 10:15/i)).toBeInTheDocument();
      expect(screen.getByText(/Thông báo điều chỉnh hải trình:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Hải trình cập nhật do ảnh hưởng áp thấp nhiệt đới: Tránh vùng biển động/i)
      ).toBeInTheDocument();
    });
  });

  it('opens and closes itinerary change history modal (KAN-130)', async () => {
    vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue({
      ...mockItineraryData,
      changeHistory: [
        {
          id: 11,
          timestamp: '2026-10-12 09:30',
          author: 'Nguyễn Quản Trị',
          action: 'CẬP NHẬT HOẠT ĐỘNG',
          description: 'Thay đổi địa điểm Gala Dinner',
          dayNumber: 1,
          details: 'Chuyển sang Grand Ballroom',
          field: 'Địa điểm',
          oldValue: 'Sundeck',
          newValue: 'Grand Ballroom',
        },
      ],
    });

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xem lịch sử thay đổi lịch trình/i })).toBeInTheDocument();
    });

    // Modal is initially not in document
    expect(screen.queryByText('Lịch Sử Thay Đổi Lịch Trình')).not.toBeInTheDocument();

    // Click button to open modal
    fireEvent.click(screen.getByRole('button', { name: /Xem lịch sử thay đổi lịch trình/i }));

    // Verify modal content
    expect(screen.getByText('Lịch Sử Thay Đổi Lịch Trình')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Quản Trị')).toBeInTheDocument();
    expect(screen.getByText('Thay đổi địa điểm Gala Dinner')).toBeInTheDocument();
    expect(screen.getByText('Sundeck')).toBeInTheDocument();
    expect(screen.getByText('Grand Ballroom')).toBeInTheDocument();

    // Close modal via close button
    fireEvent.click(screen.getByRole('button', { name: /Đóng lịch sử thay đổi/i }));
    expect(screen.queryByText('Lịch Sử Thay Đổi Lịch Trình')).not.toBeInTheDocument();
  });

  it('renders port timings including arrival, departure, all-aboard and weather (KAN-206, KAN-209)', async () => {
    vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue({
      ...mockItineraryData,
      days: [
        {
          dayNumber: 1,
          date: '2026-10-15',
          title: 'Khởi hành tại Cảng Quốc Tế Tuần Châu',
          portName: 'Cảng Tuần Châu (Hạ Long)',
          portStatus: 'DEPARTURE',
          seaDay: false,
          arrivalTime: '08:00',
          allAboardTime: '11:30',
          departureTime: '12:00',
          weatherForecast: 'Nắng nhẹ, gió cấp 2, nhiệt độ 26°C',
          activities: [],
        },
      ],
    });

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText(/Giờ cập bến:/i)).toBeInTheDocument();
      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText(/Tất cả lên tàu \(All-Aboard\):/i)).toBeInTheDocument();
      expect(screen.getByText('11:30')).toBeInTheDocument();
      expect(screen.getByText(/Giờ rời bến:/i)).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
      expect(screen.getByText(/Nắng nhẹ, gió cấp 2, nhiệt độ 26°C/i)).toBeInTheDocument();
    });
  });

  it('renders specific schedule change alerts and affected badges (KAN-207, KAN-210)', async () => {
    vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue({
      ...mockItineraryData,
      days: [
        {
          dayNumber: 1,
          date: '2026-10-15',
          title: 'Khởi hành tại Cảng Quốc Tế Tuần Châu',
          portName: 'Cảng Tuần Châu (Hạ Long)',
          portStatus: 'DEPARTURE',
          seaDay: false,
          isAffected: true,
          changeReason: 'Tàu lùi giờ xuất bến 30 phút do thời tiết có sương mù dày',
          activities: [],
        },
      ],
    });

    render(<DailyItineraryTimeline tour={mockTour} />);

    await waitFor(() => {
      expect(screen.getByText('Đã điều chỉnh lịch trình')).toBeInTheDocument();
      expect(screen.getByText(/Cảnh báo thay đổi ngày 1:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Tàu lùi giờ xuất bến 30 phút do thời tiết có sương mù dày/i)
      ).toBeInTheDocument();
    });
  });
});
