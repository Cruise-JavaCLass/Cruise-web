import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ExcursionAttendancePage } from './ExcursionAttendancePage';
import { MissingPassengerModal } from '../components/excursions/MissingPassengerModal';
import { QrScannerModal } from '../components/excursions/QrScannerModal';
import * as excursionService from '../services/excursionService';

describe('Excursion Attendance Frontend Tests (KAN-319)', () => {
  const mockExcursion: excursionService.ShoreExcursion = {
    id: 1,
    tourId: 10,
    portId: 2,
    portName: 'Cảng Hạ Long',
    portCity: 'Quảng Ninh',
    title: 'Tour Khám Phá Vịnh Hạ Long',
    code: 'EXC-HL-01',
    description: 'Khám phá hang động kỳ quan',
    category: 'SIGHTSEEING',
    difficulty: 'EASY',
    operatorName: 'Halong Tours',
    operatorContact: '0912345678',
    guideName: 'Trần Văn Hướng',
    guidePhone: '0987654321',
    busNumber: 'BUS-01',
    excursionDate: '2026-11-02',
    meetingTime: '08:00',
    departureTime: '08:30',
    returnToShipTime: '16:00',
    allAboardTime: '17:00',
    maxCapacity: 45,
    bookedCount: 2,
    price: 1500000,
    currency: 'VND',
    isIncluded: false,
    status: 'IN_PROGRESS',
    active: true,
    passengers: [
      {
        id: 101,
        passengerName: 'Nguyễn Văn Minh',
        cabinNumber: '402',
        ticketCode: 'EXC-TKT-101',
        busNumber: 'XE-01',
        groupName: 'Đoàn Hải Âu',
        emergencyPhone: '0901234567',
        status: 'CHECKED_IN',
      },
      {
        id: 102,
        passengerName: 'Trần Thị Mai',
        cabinNumber: 'Suite 1205',
        ticketCode: 'EXC-TKT-102',
        busNumber: 'XE-02',
        groupName: 'Đoàn Hải Âu',
        emergencyPhone: '0909876543',
        status: 'REGISTERED',
      },
    ],
  };

  const mockSummary: excursionService.AttendanceSummary = {
    excursionId: 1,
    excursionTitle: 'Tour Khám Phá Vịnh Hạ Long',
    returnToShipTime: '16:00',
    totalRegistered: 2,
    totalCheckedIn: 1,
    totalOnTour: 0,
    totalReturnedSafe: 0,
    totalPendingDeparture: 1,
    totalMissingReturn: 2,
    busStats: [
      { busNumber: 'XE-01', total: 1, checkedIn: 1, returnedSafe: 0, missing: 1 },
      { busNumber: 'XE-02', total: 1, checkedIn: 0, returnedSafe: 0, missing: 1 },
    ],
    groupStats: [
      { groupName: 'Đoàn Hải Âu', total: 2, checkedIn: 1, returnedSafe: 0, missing: 2 },
    ],
    missingPassengers: [
      {
        excursionPassengerId: 102,
        passengerName: 'Trần Thị Mai',
        cabinNumber: 'Suite 1205',
        ticketCode: 'EXC-TKT-102',
        busNumber: 'XE-02',
        groupName: 'Đoàn Hải Âu',
        emergencyPhone: '0909876543',
        currentStatus: 'REGISTERED',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(excursionService, 'fetchExcursions').mockResolvedValue([mockExcursion]);
    vi.spyOn(excursionService, 'getAttendanceSummary').mockResolvedValue(mockSummary);
  });

  it('renders ExcursionAttendancePage with KPI cards and passenger table', async () => {
    render(
      <MemoryRouter>
        <ExcursionAttendancePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Điểm Danh & Kiểm Soát Tour Bờ')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
      expect(screen.getByText('EXC-TKT-101')).toBeInTheDocument();
    });
  });

  it('filters passenger list when searching by name or cabin', async () => {
    render(
      <MemoryRouter>
        <ExcursionAttendancePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tìm hành khách theo tên, cabin, mã vé...');
    fireEvent.change(searchInput, { target: { value: 'Mai' } });

    expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();
    expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
  });

  it('renders MissingPassengerModal and triggers quick return check-in', async () => {
    const mockCheckIn = vi.fn().mockResolvedValue(undefined);

    render(
      <MissingPassengerModal
        isOpen={true}
        onClose={vi.fn()}
        summary={mockSummary}
        onQuickCheckIn={mockCheckIn}
      />
    );

    expect(screen.getByText('Cảnh Báo Hành Khách Chưa Về Tàu')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
    expect(screen.getByText('Cabin: Suite 1205')).toBeInTheDocument();

    const checkInBtn = screen.getByText('Xác nhận về tàu');
    fireEvent.click(checkInBtn);

    expect(mockCheckIn).toHaveBeenCalledWith(102, 'Trần Thị Mai');
  });

  it('renders QrScannerModal and submits ticket code', async () => {
    const mockScanSubmit = vi.fn().mockResolvedValue({
      excursionPassengerId: 101,
      excursionId: 1,
      passengerName: 'Nguyễn Văn Minh',
      cabinNumber: '402',
      ticketCode: 'EXC-TKT-101',
      previousStatus: 'REGISTERED',
      currentStatus: 'CHECKED_IN',
      message: 'Success',
    });

    render(
      <QrScannerModal
        isOpen={true}
        onClose={vi.fn()}
        onScanSubmit={mockScanSubmit}
        targetStatus="CHECKED_IN"
      />
    );

    expect(screen.getByText('Quét Vé / Thẻ Điểm Danh')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Nhập mã vé/i);
    fireEvent.change(input, { target: { value: 'EXC-TKT-101' } });

    const submitBtn = screen.getByText('Xác nhận Điểm Danh');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockScanSubmit).toHaveBeenCalledWith({
        targetStatus: 'CHECKED_IN',
        ticketCode: 'EXC-TKT-101',
      });
    });
  });
});
