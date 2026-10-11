import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StopFormModal } from './StopFormModal';
import { TourStopsModal } from './TourStopsModal';
import type { CruiseTour } from '../../services/tourService';
import type { Port } from '../../services/portStopService';
import * as portStopService from '../../services/portStopService';

const mockPorts: Port[] = [
  {
    id: 1,
    name: 'Cảng Tuần Châu',
    code: 'VN-TCH',
    country: 'Việt Nam',
    city: 'Hạ Long',
    timezone: 'Asia/Ho_Chi_Minh',
    active: true,
  },
];

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

describe('Port and Stop Forms Component Tests (KAN-112)', () => {
  it('renders StopFormModal with all required fields and submits valid form', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <StopFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        ports={mockPorts}
        tourStartDate="2026-10-15"
        tourEndDate="2026-10-18"
      />
    );

    expect(screen.getByText('Thêm Điểm Dừng Hải Trình')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Cảng Ghé/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Thứ Tự Điểm Dừng/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Thời Gian Cập Cảng \(Arrival\)/i), {
      target: { value: '2026-10-15T08:00' },
    });
    fireEvent.change(screen.getByLabelText(/Thời Gian Rời Cảng \(Departure\)/i), {
      target: { value: '2026-10-15T18:00' },
    });
    fireEvent.change(screen.getByLabelText(/Mô Tả \/ Hoạt Động Tại Cảng/i), {
      target: { value: 'Đón khách tham quan' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu Điểm Dừng/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        portId: 1,
        stopOrder: 1,
        arrivalTime: '2026-10-15T08:00',
        departureTime: '2026-10-15T18:00',
        allAboardTime: '',
        description: 'Đón khách tham quan',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders TourStopsModal and lists existing stops', async () => {
    vi.spyOn(portStopService, 'getTourStops').mockResolvedValue([
      {
        id: 101,
        tourId: 1,
        portId: 1,
        portName: 'Cảng Tuần Châu',
        portCode: 'VN-TCH',
        portCity: 'Hạ Long',
        stopOrder: 1,
        arrivalTime: '2026-10-15T08:00',
        departureTime: '2026-10-15T18:00',
        active: true,
      },
    ]);

    render(
      <TourStopsModal
        isOpen={true}
        onClose={vi.fn()}
        tour={mockTour}
        ports={mockPorts}
      />
    );

    expect(screen.getByText('Quản Lý Điểm Dừng Hải Trình')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Cảng Tuần Châu/i)).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  it('shows validation errors when required fields are empty on submit', () => {
    const onSubmit = vi.fn();
    render(
      <StopFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        ports={mockPorts}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Lưu Điểm Dừng/i }));

    expect(screen.getByText('Vui lòng chọn cảng ghé')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng chọn thời gian cập cảng')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng chọn thời gian rời cảng')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
