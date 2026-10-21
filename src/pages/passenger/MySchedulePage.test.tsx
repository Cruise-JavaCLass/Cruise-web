import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MySchedulePage } from './MySchedulePage';
import { passengerScheduleService, type PersonalScheduleResponse } from '../../services/passengerScheduleService';

vi.mock('../../services/passengerScheduleService', async () => {
  const actual = await vi.importActual<typeof import('../../services/passengerScheduleService')>(
    '../../services/passengerScheduleService'
  );
  return {
    ...actual,
    passengerScheduleService: {
      getPersonalSchedule: vi.fn(),
      getScheduleConflicts: vi.fn(),
      loadFromCache: vi.fn(),
      saveToCache: vi.fn(),
    },
  };
});

// Mock ActivityPassModal to verify opening
vi.mock('../../components/activities/ActivityPassModal', () => ({
  ActivityPassModal: ({ isOpen, onClose, activityTitle }: { isOpen: boolean; onClose: () => void; activityTitle?: string }) =>
    isOpen ? (
      <div data-testid="mock-activity-pass-modal">
        <span>Modal Thẻ QR: {activityTitle}</span>
        <button onClick={onClose} aria-label="Đóng modal">
          Đóng
        </button>
      </div>
    ) : null,
}));

describe('MySchedulePage Component & User Flow Tests (KAN-354)', () => {
  const mockScheduleResponse: PersonalScheduleResponse = {
    passengerId: 1,
    passengerName: 'Nguyễn Văn A',
    cabinNumber: '701',
    dayNumber: 1,
    scope: 'my',
    totalItems: 2,
    totalConflicts: 1,
    items: [
      {
        eventId: 10,
        itemType: 'ACTIVITY',
        title: 'Yoga Bình Minh Trên Boong',
        category: 'Wellness',
        dayNumber: 1,
        activityDate: '2026-11-01',
        startTime: '07:00',
        endTime: '08:00',
        location: 'Sundeck 12',
        deck: 'Boong 12',
        status: 'REGISTERED',
        passengerId: 1,
        passengerName: 'Nguyễn Văn A',
        cabinNumber: '701',
        ticketCode: 'ACT-101',
        price: 0,
        isIncluded: true,
        hasConflict: true,
        conflictReason: "Trùng khung giờ với 'Lớp Học Nấu Ăn' (30 phút)",
        conflictWithIds: [20],
      },
      {
        eventId: 20,
        itemType: 'EXCURSION',
        title: 'Tour Tham Quan Di Sản Chàm',
        category: 'Tour trên bờ',
        dayNumber: 1,
        activityDate: '2026-11-01',
        startTime: '07:30',
        endTime: '12:00',
        assemblyTime: '07:30',
        departureTime: '08:00',
        assemblyWarning: 'Tập trung trước giờ khởi hành 30 phút tại Cầu tàu số 2',
        location: 'Cảng Chân Mây',
        deck: 'Cầu tàu số 2',
        status: 'CHECKED_IN',
        passengerId: 1,
        passengerName: 'Nguyễn Văn A',
        cabinNumber: '701',
        ticketCode: 'TCK-202',
        price: 50,
        isIncluded: false,
        hasConflict: true,
        conflictReason: "Trùng khung giờ với 'Yoga Bình Minh Trên Boong' (30 phút)",
        conflictWithIds: [10],
      },
    ],
    conflicts: [
      {
        firstEventId: 10,
        firstEventTitle: 'Yoga Bình Minh Trên Boong',
        firstEventType: 'ACTIVITY',
        firstStartTime: '07:00',
        firstEndTime: '08:00',
        secondEventId: 20,
        secondEventTitle: 'Tour Tham Quan Di Sản Chàm',
        secondEventType: 'EXCURSION',
        secondStartTime: '07:30',
        secondEndTime: '12:00',
        overlapMinutes: 30,
        description: "Xung đột thời gian 30 phút giữa 'Yoga Bình Minh Trên Boong' và 'Tour Tham Quan Di Sản Chàm'",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tải và hiển thị dòng thời gian lịch trình cá nhân cùng thẻ thống kê', async () => {
    vi.mocked(passengerScheduleService.getPersonalSchedule).mockResolvedValue(mockScheduleResponse);

    render(
      <MemoryRouter initialEntries={['/my-schedule?passengerId=1&day=1']}>
        <MySchedulePage />
      </MemoryRouter>
    );

    // Kiểm tra tiêu đề trang
    expect(screen.getByText(/Lịch Trình Cá Nhân \(My Day\)/i)).toBeInTheDocument();

    // Chờ dữ liệu hiển thị
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Yoga Bình Minh Trên Boong' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Tour Tham Quan Di Sản Chàm' })).toBeInTheDocument();
    });

    // Kiểm tra thông tin hành khách & cabin
    expect(screen.getByText(/Nguyễn Văn A • Cabin 701/i)).toBeInTheDocument();

    // Kiểm tra các nhãn trạng thái badge
    expect(screen.getByText('Đã đăng ký')).toBeInTheDocument();
    expect(screen.getByText('Đã điểm danh')).toBeInTheDocument();

    // Kiểm tra cảnh báo giờ tập trung của tour bờ
    expect(screen.getByText(/Tập trung trước giờ khởi hành 30 phút tại Cầu tàu số 2/i)).toBeInTheDocument();

    // Kiểm tra thống kê số liệu
    expect(screen.getByText('Tổng sự kiện')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // total events
  });

  it('hiển thị banner cảnh báo trùng lịch khi có xung đột', async () => {
    vi.mocked(passengerScheduleService.getPersonalSchedule).mockResolvedValue(mockScheduleResponse);

    render(
      <MemoryRouter initialEntries={['/my-schedule?passengerId=1&day=1']}>
        <MySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText(/Phát hiện 1 xung đột lịch trình trong ngày/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Cảnh báo trùng giờ:/i).length).toBeGreaterThan(0);
  });

  it('chuyển đổi bộ lọc giữa "Chỉ lịch của tôi" và "Cả cabin"', async () => {
    vi.mocked(passengerScheduleService.getPersonalSchedule).mockResolvedValue(mockScheduleResponse);

    render(
      <MemoryRouter initialEntries={['/my-schedule?passengerId=1&day=1&scope=my']}>
        <MySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Yoga Bình Minh Trên Boong' })).toBeInTheDocument();
    });

    const cabinBtn = screen.getByText(/Cả cabin/i);
    fireEvent.click(cabinBtn);

    await waitFor(() => {
      expect(passengerScheduleService.getPersonalSchedule).toHaveBeenCalledWith(1, 1, 'cabin');
    });
  });

  it('chuyển đổi tab ngày hải trình kích hoạt gọi lại service', async () => {
    vi.mocked(passengerScheduleService.getPersonalSchedule).mockResolvedValue(mockScheduleResponse);

    render(
      <MemoryRouter initialEntries={['/my-schedule?passengerId=1&day=1']}>
        <MySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Yoga Bình Minh Trên Boong' })).toBeInTheDocument();
    });

    const day2Btn = screen.getByText('Ngày 2');
    fireEvent.click(day2Btn);

    await waitFor(() => {
      expect(passengerScheduleService.getPersonalSchedule).toHaveBeenCalledWith(1, 2, 'my');
    });
  });

  it('mở modal thẻ QR Pass khi bấm nút "Xem vé QR"', async () => {
    vi.mocked(passengerScheduleService.getPersonalSchedule).mockResolvedValue(mockScheduleResponse);

    render(
      <MemoryRouter initialEntries={['/my-schedule?passengerId=1&day=1']}>
        <MySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Yoga Bình Minh Trên Boong' })).toBeInTheDocument();
    });

    const showPassButtons = screen.getAllByText('Xem vé QR');
    fireEvent.click(showPassButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('mock-activity-pass-modal')).toBeInTheDocument();
    });

    // Đóng modal
    const closeBtn = screen.getByLabelText('Đóng modal');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('mock-activity-pass-modal')).not.toBeInTheDocument();
  });

  it('hiển thị trạng thái rỗng khi ngày không có sự kiện nào', async () => {
    const emptyResponse: PersonalScheduleResponse = {
      passengerId: 1,
      passengerName: 'Nguyễn Văn A',
      cabinNumber: '701',
      dayNumber: 3,
      scope: 'my',
      totalItems: 0,
      totalConflicts: 0,
      items: [],
      conflicts: [],
    };
    vi.mocked(passengerScheduleService.getPersonalSchedule).mockResolvedValue(emptyResponse);

    render(
      <MemoryRouter initialEntries={['/my-schedule?passengerId=1&day=3']}>
        <MySchedulePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Chưa có lịch trình cho ngày này/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Bạn chưa đăng ký hoạt động giải trí trên tàu hoặc tour tham quan bờ nào/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Khám phá Danh mục Hoạt động/i)).toBeInTheDocument();
  });
});
