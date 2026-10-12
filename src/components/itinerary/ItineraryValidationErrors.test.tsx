import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityFormModal } from './ActivityFormModal';
import { DailyItineraryTimeline } from './DailyItineraryTimeline';
import * as dailyItineraryService from '../../services/dailyItineraryService';
import type { CruiseTour } from '../../services/tourService';

const mockTour: CruiseTour = {
  id: 1,
  name: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
  code: 'TOUR-HL-001',
  durationDays: 4,
  durationNights: 3,
  departurePort: 'Cảng Tuần Châu',
  destinationPort: 'Cảng Tuần Châu',
  startDate: '2026-10-15',
  endDate: '2026-10-18',
  maxCapacity: 2000,
  basePrice: 15500000,
  currency: 'VND',
  status: 'PUBLISHED',
  active: true,
};

describe('Itinerary Validation and Error States (KAN-122)', () => {
  describe('ActivityFormModal - Field Validation Rules', () => {
    it('shows validation error when title is empty or only whitespace', () => {
      const onSubmit = vi.fn();
      render(
        <ActivityFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          dayNumber={1}
          dayTitle="Khởi hành"
        />
      );

      const titleInput = screen.getByPlaceholderText(/Gala Dinner Thuyền Trưởng/i);
      fireEvent.change(titleInput, { target: { value: '   ' } });

      const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Vui lòng nhập tên hoạt động')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows validation error when time is cleared', () => {
      const onSubmit = vi.fn();
      render(
        <ActivityFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          dayNumber={1}
          dayTitle="Khởi hành"
        />
      );

      const timeInput = screen.getByDisplayValue('09:00');
      fireEvent.change(timeInput, { target: { value: '' } });

      const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Vui lòng chọn thời gian diễn ra')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows validation error when location is empty', () => {
      const onSubmit = vi.fn();
      render(
        <ActivityFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          dayNumber={1}
          dayTitle="Khởi hành"
        />
      );

      const locationInput = screen.getByPlaceholderText(/Tầng 7 - Grand Ballroom/i);
      fireEvent.change(locationInput, { target: { value: '   ' } });

      const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Vui lòng nhập vị trí/địa điểm')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates price must be positive when service is not included', () => {
      const onSubmit = vi.fn();
      render(
        <ActivityFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          dayNumber={1}
          dayTitle="Khởi hành"
        />
      );

      // Uncheck isIncluded
      const includedCheckbox = screen.getByRole('checkbox');
      fireEvent.click(includedCheckbox);

      const priceInput = screen.getByPlaceholderText('Vd: 350000');
      fireEvent.change(priceInput, { target: { value: '0' } });

      const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Vui lòng nhập mức phí dịch vụ phát sinh (> 0)')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();

      // Negative price
      fireEvent.change(priceInput, { target: { value: '-50000' } });
      fireEvent.click(submitBtn);
      expect(screen.getByText('Vui lòng nhập mức phí dịch vụ phát sinh (> 0)')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates capacity must be greater than zero when specified', () => {
      const onSubmit = vi.fn();
      render(
        <ActivityFormModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={onSubmit}
          dayNumber={1}
          dayTitle="Khởi hành"
        />
      );

      const capacityInput = screen.getByPlaceholderText(/Vd: 150/i);
      fireEvent.change(capacityInput, { target: { value: '0' } });

      const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText('Sức chứa phải lớn hơn 0')).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('DailyItineraryTimeline - Empty and Fallback States', () => {
    it('generates fallback skeleton schedule when API returns null', async () => {
      const tourWithoutData: CruiseTour = {
        ...mockTour,
        id: 999,
        durationDays: 3,
        name: 'Tour Thử Nghiệm Fallback',
      };
      vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue(null);

      render(<DailyItineraryTimeline tour={tourWithoutData} />);

      await waitFor(() => {
        expect(screen.getByText('Tour Thử Nghiệm Fallback')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Ngày 3/i })).toBeInTheDocument();
    });

    it('displays empty state message when day has no activities', async () => {
      vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue({
        tourId: 1,
        tourName: mockTour.name,
        tourCode: mockTour.code,
        startDate: mockTour.startDate,
        endDate: mockTour.endDate,
        days: [
          {
            dayNumber: 1,
            date: '2026-10-15',
            title: 'Khởi hành tại Cảng Tuần Châu',
            portName: 'Cảng Tuần Châu',
            portStatus: 'DEPARTURE',
            seaDay: false,
            activities: [],
          },
        ],
      });

      render(<DailyItineraryTimeline tour={mockTour} />);

      await waitFor(() => {
        expect(
          screen.getByText('Chưa có hoạt động nào trong Ngày 1 với bộ lọc hiện tại.')
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /\+ Thêm hoạt động đầu tiên cho ngày này/i })
        ).toBeInTheDocument();
      });
    });

    it('displays empty state when filtered category has no matching activities', async () => {
      vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue({
        tourId: 1,
        tourName: mockTour.name,
        tourCode: mockTour.code,
        startDate: mockTour.startDate,
        endDate: mockTour.endDate,
        days: [
          {
            dayNumber: 1,
            date: '2026-10-15',
            title: 'Khởi hành tại Cảng Tuần Châu',
            portName: 'Cảng Tuần Châu',
            portStatus: 'DEPARTURE',
            seaDay: false,
            activities: [
              {
                id: 1,
                time: '08:00',
                title: 'Làm thủ tục lên tàu',
                location: 'Cảng Tuần Châu',
                category: 'NAVIGATION',
                isIncluded: true,
              },
            ],
          },
        ],
      });

      render(<DailyItineraryTimeline tour={mockTour} />);

      await waitFor(() => {
        expect(screen.getByText('Làm thủ tục lên tàu')).toBeInTheDocument();
      });

      // Filter by Spa/Wellness (which has no activities)
      const select = screen.getByLabelText(/Lọc hoạt động theo loại/i);
      fireEvent.change(select, { target: { value: 'WELLNESS' } });

      expect(screen.queryByText('Làm thủ tục lên tàu')).not.toBeInTheDocument();
      expect(
        screen.getByText('Chưa có hoạt động nào trong Ngày 1 với bộ lọc hiện tại.')
      ).toBeInTheDocument();
    });

    it('handles submission error gracefully when API fails during activity save', async () => {
      vi.spyOn(dailyItineraryService, 'getDailyItinerary').mockResolvedValue({
        tourId: 1,
        tourName: mockTour.name,
        tourCode: mockTour.code,
        startDate: mockTour.startDate,
        endDate: mockTour.endDate,
        days: [
          {
            dayNumber: 1,
            date: '2026-10-15',
            title: 'Khởi hành tại Cảng Tuần Châu',
            portName: 'Cảng Tuần Châu',
            portStatus: 'DEPARTURE',
            seaDay: false,
            activities: [],
          },
        ],
      });

      const addSpy = vi
        .spyOn(dailyItineraryService, 'addDailyActivity')
        .mockRejectedValue(new Error('Network error'));

      render(<DailyItineraryTimeline tour={mockTour} />);

      await waitFor(() => {
        expect(screen.getByText(/Khởi hành tại Cảng Tuần Châu/i)).toBeInTheDocument();
      });

      // Open add modal
      const openAddBtn = screen.getByRole('button', { name: /Thêm Hoạt Động Vào Ngày 1/i });
      fireEvent.click(openAddBtn);

      const titleInput = screen.getByPlaceholderText(/Gala Dinner Thuyền Trưởng/i);
      const locationInput = screen.getByPlaceholderText(/Tầng 7 - Grand Ballroom/i);
      fireEvent.change(titleInput, { target: { value: 'Tiệc Nhạc Sống Sân Khấu Nổi' } });
      fireEvent.change(locationInput, { target: { value: 'Tầng 12' } });

      const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalled();
      });
    });
  });
});
