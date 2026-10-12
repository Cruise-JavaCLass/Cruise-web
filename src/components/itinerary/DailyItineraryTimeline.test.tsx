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
});
