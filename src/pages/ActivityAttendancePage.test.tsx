import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ActivityAttendancePage } from './ActivityAttendancePage';
import {
  activityAttendanceService,
  type ActivityAttendanceSummaryResponse,
  type PagedRosterResponse,
  type ActivityCheckInResponse,
  type WalkInCheckInResponse,
} from '../services/activityAttendanceService';
import * as activityService from '../services/activityService';

const renderWithRoute = (initialPath = '/activities/10/attendance') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/activities/:id/attendance" element={<ActivityAttendancePage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ActivityAttendancePage Component Tests (KAN-323)', () => {
  const mockActivity: activityService.OnboardActivity = {
    id: 10,
    tourId: 1,
    dayNumber: 2,
    title: 'Dạ tiệc Khiêu vũ & Gala Âm nhạc',
    category: 'Âm nhạc',
    location: 'Venetian Ballroom (Deck 4 & 5)',
    activityDate: '2026-11-02',
    startTime: '20:00',
    endTime: '22:30',
    maxCapacity: 100,
    currentParticipants: 45,
    price: 0,
    isIncluded: true,
    status: 'IN_PROGRESS',
    active: true,
  };

  const mockSummary: ActivityAttendanceSummaryResponse = {
    activityId: 10,
    activityTitle: 'Dạ tiệc Khiêu vũ & Gala Âm nhạc',
    totalRegistered: 50,
    checkedInCount: 35,
    pendingCount: 15,
    walkInCount: 5,
    maxCapacity: 100,
    remainingCapacity: 65,
    attendanceRatePercentage: 70,
    venue: 'Venetian Ballroom (Deck 4 & 5)',
    startTime: '20:00',
    endTime: '22:30',
  };

  const mockRoster: PagedRosterResponse = {
    content: [
      {
        attendanceId: 1,
        passengerId: 101,
        passengerName: 'Nguyễn Văn Minh',
        cabinNumber: '402',
        rfidTag: 'RFID-101',
        status: 'CHECKED_IN',
        checkedInAt: '2026-11-02T20:05:00Z',
        checkedInByStaffId: 'STAFF-DESK-01',
        checkInMethod: 'QR_CODE',
        isWalkIn: false,
      },
      {
        attendanceId: 2,
        passengerId: 102,
        passengerName: 'Trần Thị Mai',
        cabinNumber: '504',
        rfidTag: 'RFID-102',
        status: 'REGISTERED',
        isWalkIn: false,
      },
      {
        attendanceId: 3,
        passengerId: 103,
        passengerName: 'Lê Hoàng Nam',
        cabinNumber: '601',
        rfidTag: 'RFID-103',
        status: 'CHECKED_IN',
        checkedInAt: '2026-11-02T20:12:00Z',
        checkedInByStaffId: 'STAFF-DESK-01',
        checkInMethod: 'WALK_IN',
        isWalkIn: true,
      },
    ],
    totalElements: 3,
    totalPages: 1,
    size: 50,
    number: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(activityService, 'fetchActivities').mockResolvedValue([mockActivity]);
    vi.spyOn(activityAttendanceService, 'getAttendanceSummary').mockResolvedValue(mockSummary);
    vi.spyOn(activityAttendanceService, 'getActivityRoster').mockResolvedValue(mockRoster);
  });

  it('hiển thị tiêu đề, các thẻ KPI và danh sách hành khách điểm danh', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Điểm Danh & Quét Vé Hoạt Động')).toBeInTheDocument();
      expect(screen.getByText('Đã Đăng Ký')).toBeInTheDocument();
      expect(screen.getByText('Đã Vào Cửa')).toBeInTheDocument();
      expect(screen.getByText('Khách Vãng Lai')).toBeInTheDocument();
      expect(screen.getByText('Chỗ Trống Còn Lại')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
      expect(screen.getByText('Lê Hoàng Nam')).toBeInTheDocument();
    });
  });

  it('lọc danh sách hành khách theo từ khóa tìm kiếm (search)', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm tên, cabin, RFID.../i);
    fireEvent.change(searchInput, { target: { value: '504' } });

    expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();
  });

  it('lọc danh sách theo trạng thái Chưa quét / Đã vào cửa', async () => {
    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    });

    const uncheckTab = screen.getByRole('button', { name: 'Chưa quét' });
    fireEvent.click(uncheckTab);

    expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();
  });

  it('thực hiện điểm danh nhanh thành công qua form thanh Quick Input', async () => {
    const mockCheckInRes: ActivityCheckInResponse = {
      attendanceId: 2,
      activityId: 10,
      activityTitle: 'Dạ tiệc Khiêu vũ & Gala Âm nhạc',
      passengerId: 102,
      passengerName: 'Trần Thị Mai',
      cabinNumber: '504',
      status: 'CHECKED_IN',
      checkInTime: new Date().toISOString(),
      staffId: 'STAFF-DESK-01',
      method: 'RFID',
      message: 'Điểm danh thành công',
    };

    const checkInSpy = vi
      .spyOn(activityAttendanceService, 'checkIn')
      .mockResolvedValueOnce(mockCheckInRes);

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Điểm Danh & Quét Vé Hoạt Động')).toBeInTheDocument();
    });

    const rfidTab = screen.getByRole('button', { name: 'Thẻ RFID' });
    fireEvent.click(rfidTab);

    const input = screen.getByPlaceholderText(/Chạm thẻ RFID hoặc nhập mã thẻ/i);
    fireEvent.change(input, { target: { value: 'RFID-102' } });

    const submitBtn = screen.getByRole('button', { name: /Điểm danh ngay/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(checkInSpy).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          rfidTag: 'RFID-102',
          staffId: 'STAFF-DESK-01',
        })
      );
      expect(screen.getByText(/Điểm danh thành công: Trần Thị Mai/i)).toBeInTheDocument();
    });
  });

  it('mở và thao tác đăng ký khách vãng lai (Walk-in)', async () => {
    const mockWalkInRes: WalkInCheckInResponse = {
      attendanceId: 99,
      activityId: 10,
      activityTitle: 'Dạ tiệc Khiêu vũ & Gala Âm nhạc',
      passengerName: 'Phạm Hương Giang',
      cabinNumber: '702',
      chargedAmount: 150000,
      transactionId: 'TX-WALKIN-12345',
      status: 'CHECKED_IN',
      checkInTime: new Date().toISOString(),
      isWalkIn: true,
      message: 'Đăng ký thành công',
    };

    const walkInSpy = vi
      .spyOn(activityAttendanceService, 'walkInCheckIn')
      .mockResolvedValueOnce(mockWalkInRes);

    renderWithRoute();

    await waitFor(() => {
      expect(screen.getByText('Điểm Danh & Quét Vé Hoạt Động')).toBeInTheDocument();
    });

    const openWalkInBtn = screen.getByRole('button', { name: /Khách Vãng Lai/i });
    fireEvent.click(openWalkInBtn);

    expect(screen.getByText('Đăng Ký Khách Vãng Lai (Walk-in)')).toBeInTheDocument();

    const cabinInput = screen.getByPlaceholderText(/VD: 101, A-204.../i);
    fireEvent.change(cabinInput, { target: { value: '702' } });

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận vào cửa/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(walkInSpy).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          cabinNumber: '702',
          paymentMethod: 'FOLIO',
        })
      );
    });
  });
});
