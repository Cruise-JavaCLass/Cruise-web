import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ActivityRosterPage } from './ActivityRosterPage';
import {
  activityRegistrationService,
  type PagedRosterResponse,
  type WaitlistQueueItem
} from '../services/activityRegistrationService';
import * as activityService from '../services/activityService';

describe('ActivityRosterPage Component Tests (KAN-372)', () => {
  const sampleActivity: activityService.OnboardActivity = {
    id: 10,
    tourId: 1,
    dayNumber: 2,
    title: 'Dạ Tiệc Khiêu Vũ Ý',
    description: 'Chương trình gala nghệ thuật',
    category: 'Gala & Show',
    location: 'Venetian Ballroom',
    activityDate: '2026-10-25',
    startTime: '20:00',
    endTime: '22:30',
    maxCapacity: 50,
    currentParticipants: 46,
    price: 500000,
    isIncluded: false,
    status: 'SCHEDULED',
    active: true
  };

  const sampleRoster: PagedRosterResponse = {
    content: [
      {
        registrationId: 501,
        activityId: 10,
        passengerId: 101,
        passengerName: 'Nguyễn Văn Minh',
        cabinNumber: '702',
        tourPackage: 'VIP Suite',
        status: 'CONFIRMED',
        chargedAmount: 500000,
        transactionId: 'FOLIO-REG-1111',
        registeredAt: '2026-10-20T10:00:00Z'
      },
      {
        registrationId: 502,
        activityId: 10,
        passengerId: 102,
        passengerName: 'Lê Thị Thu',
        cabinNumber: '804',
        tourPackage: 'Tiêu Chuẩn',
        status: 'CANCELLED',
        chargedAmount: 0,
        transactionId: 'N/A',
        registeredAt: '2026-10-20T11:00:00Z'
      }
    ],
    totalElements: 2,
    totalPages: 1,
    size: 15,
    number: 0
  };

  const sampleWaitlist: WaitlistQueueItem[] = [
    {
      position: 1,
      registrationId: 503,
      passengerId: 103,
      passengerName: 'Hoàng Quốc Việt',
      cabinNumber: '901',
      registeredAt: '2026-10-20T12:00:00Z',
      status: 'WAITLISTED'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/activities/10/roster']}>
        <Routes>
          <Route path="/activities/:id/roster" element={<ActivityRosterPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders page header, activity title, and 4 KPI summary cards', async () => {
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValueOnce(sampleActivity);
    vi.spyOn(activityRegistrationService, 'getRosterPaged').mockResolvedValueOnce(sampleRoster);
    vi.spyOn(activityRegistrationService, 'getWaitlistQueue').mockResolvedValueOnce(sampleWaitlist);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dạ Tiệc Khiêu Vũ Ý')).toBeInTheDocument();
      expect(screen.getByText('Đã Đăng Ký (Confirmed)')).toBeInTheDocument();
      expect(screen.getByText('Suất Khả Dụng')).toBeInTheDocument();
      expect(screen.getByText('Danh Sách Chờ (Waitlist)')).toBeInTheDocument();
      expect(screen.getByText('Doanh Thu Tạm Tính')).toBeInTheDocument();
    });

    // Check High Occupancy banner (46/50 = 92% >= 90%)
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Cảnh báo lấp đầy cao/)).toBeInTheDocument();
  });

  it('renders Roster table and displays passenger details correctly', async () => {
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValueOnce(sampleActivity);
    vi.spyOn(activityRegistrationService, 'getRosterPaged').mockResolvedValueOnce(sampleRoster);
    vi.spyOn(activityRegistrationService, 'getWaitlistQueue').mockResolvedValueOnce(sampleWaitlist);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
      expect(screen.getByText('702')).toBeInTheDocument();
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Lê Thị Thu')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });
  });

  it('chuyển tab Waitlist và thực hiện đôn suất thành công', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValue(sampleActivity);
    vi.spyOn(activityRegistrationService, 'getRosterPaged').mockResolvedValue(sampleRoster);
    vi.spyOn(activityRegistrationService, 'getWaitlistQueue').mockResolvedValue(sampleWaitlist);
    const promoteSpy = vi.spyOn(activityRegistrationService, 'promoteWaitlist').mockResolvedValueOnce({
      registrationId: 503,
      activityId: 10,
      activityTitle: 'Dạ Tiệc Khiêu Vũ Ý',
      passengerId: 103,
      passengerName: 'Hoàng Quốc Việt',
      cabinNumber: '901',
      status: 'CONFIRMED',
      chargedAmount: 500000,
      registeredAt: new Date().toISOString()
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Hàng Đợi Waitlist/)).toBeInTheDocument();
    });

    const waitlistTab = screen.getByText(/Hàng Đợi Waitlist/);
    await user.click(waitlistTab);

    await waitFor(() => {
      expect(screen.getByText('Hoàng Quốc Việt')).toBeInTheDocument();
      expect(screen.getByText('901')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Đôn Suất Ngay/i })).toBeInTheDocument();
    });

    const promoteBtn = screen.getByRole('button', { name: /Đôn Suất Ngay/i });
    await user.click(promoteBtn);

    await waitFor(() => {
      expect(promoteSpy).toHaveBeenCalledWith(10, 503);
      expect(screen.getByRole('status')).toHaveTextContent('Đôn suất thành công!');
    });
  });

  it('kích hoạt xuất file CSV khi bấm nút Xuất File CSV', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValueOnce(sampleActivity);
    vi.spyOn(activityRegistrationService, 'getRosterPaged').mockResolvedValueOnce(sampleRoster);
    vi.spyOn(activityRegistrationService, 'getWaitlistQueue').mockResolvedValueOnce(sampleWaitlist);

    const mockBlob = new Blob(['test-csv-data'], { type: 'text/csv' });
    const exportSpy = vi.spyOn(activityRegistrationService, 'exportRosterCsv').mockResolvedValueOnce(mockBlob);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/test');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Xuất File CSV/i })).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole('button', { name: /Xuất File CSV/i });
    await user.click(exportBtn);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith(10);
      expect(createObjectURLMock).toHaveBeenCalledWith(mockBlob);
      expect(screen.getByRole('status')).toHaveTextContent('Tải xuống file CSV thành công!');
    });
  });
});
