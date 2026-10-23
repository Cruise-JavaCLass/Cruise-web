import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ExcursionRosterPage } from '../pages/ExcursionRosterPage';
import { WaitlistModal, MedicalWaiverModal } from '../components/excursions/WaitlistAndWaiverModals';
import * as excursionService from '../services/excursionService';

vi.mock('../services/excursionService', async (importOriginal) => {
  const actual = await importOriginal<typeof excursionService>();
  return {
    ...actual,
    fetchExcursionRoster: vi.fn(),
    fetchExcursionWaitlist: vi.fn(),
    exportExcursionRosterCsv: vi.fn(),
    sendScheduleChangeAlert: vi.fn(),
    promoteWaitlistPassenger: vi.fn(),
    cancelBookingWithMedicalWaiver: vi.fn(),
  };
});

describe('Excursion Roster & Waitlist UI Suite (KAN-331)', () => {
  const mockRosterSummary: excursionService.ExcursionRosterSummary = {
    excursionId: 10,
    excursionTitle: 'Vịnh Hạ Long Tour',
    maxCapacity: 40,
    confirmedCount: 2,
    waitlistCount: 1,
    cancelledCount: 0,
    checkedInCount: 1,
    specialAssistanceCount: 1,
    items: [
      {
        id: 1,
        excursionId: 10,
        passengerId: 101,
        passengerName: 'Nguyen Van A',
        cabinNumber: 'C-101',
        ticketCode: 'EXC-10-1001',
        busNumber: 'BUS-01',
        groupName: 'Nhóm 1',
        bookingStatus: 'CONFIRMED',
        status: 'CHECKED_IN',
        specialRequirements: 'Xe lăn (Wheelchair)',
        needsSpecialAssistance: true,
        chargedAmount: 120,
        refundAmount: 0,
        penaltyFee: 0,
      },
      {
        id: 2,
        excursionId: 10,
        passengerId: 102,
        passengerName: 'Tran Thi B',
        cabinNumber: 'C-102',
        ticketCode: 'EXC-10-1002',
        busNumber: 'BUS-01',
        groupName: 'Nhóm 1',
        bookingStatus: 'CONFIRMED',
        status: 'REGISTERED',
        chargedAmount: 120,
        refundAmount: 0,
        penaltyFee: 0,
      },
    ],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
  };

  const mockWaitlist: excursionService.ExcursionWaitlistEntry[] = [
    {
      position: 1,
      bookingId: 99,
      excursionId: 10,
      passengerId: 201,
      passengerName: 'Le Van C',
      cabinNumber: 'D-305',
      emergencyPhone: '+84909000111',
      specialRequirements: 'Ăn chay',
      bookedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(excursionService.fetchExcursionRoster).mockResolvedValue(mockRosterSummary);
    vi.mocked(excursionService.fetchExcursionWaitlist).mockResolvedValue(mockWaitlist);
  });

  it('renders roster dashboard with passenger list and metrics', async () => {
    render(
      <MemoryRouter initialEntries={['/excursions/10/roster']}>
        <Routes>
          <Route path="/excursions/:id/roster" element={<ExcursionRosterPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Trung Tâm Điều Hành Roster/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
      expect(screen.getByText('Tran Thi B')).toBeInTheDocument();
      expect(screen.getByText('EXC-10-1001')).toBeInTheDocument();
      expect(screen.getByText(/Xe lăn/i)).toBeInTheDocument();
    });
  });

  it('opens Waitlist Modal and handles auto-promotion action', async () => {
    vi.mocked(excursionService.promoteWaitlistPassenger).mockResolvedValue({
      excursionId: 10,
      bookingId: 99,
      passengerId: 201,
      passengerName: 'Le Van C',
      cabinNumber: 'D-305',
      ticketCode: 'EXC-10-PROMOTE',
      status: 'CONFIRMED',
      chargedAmount: 120,
      promotedAt: new Date().toISOString(),
      message: 'Đã đôn hành khách Le Van C lên vé chính thức!',
    });

    const onPromoted = vi.fn();
    render(
      <WaitlistModal
        isOpen={true}
        onClose={vi.fn()}
        excursionId={10}
        excursionTitle="Vịnh Hạ Long Tour"
        waitlist={mockWaitlist}
        onPromoted={onPromoted}
      />
    );

    expect(screen.getByText(/Hàng Đợi Danh Sách Chờ/i)).toBeInTheDocument();
    expect(screen.getByText('Le Van C')).toBeInTheDocument();
    expect(screen.getByText(/Cabin D-305/i)).toBeInTheDocument();

    const promoteBtn = screen.getByRole('button', { name: /Đôn Khách Kế Tiếp/i });
    fireEvent.click(promoteBtn);

    await waitFor(() => {
      expect(excursionService.promoteWaitlistPassenger).toHaveBeenCalledWith(10);
      expect(onPromoted).toHaveBeenCalled();
    });
  });

  it('submits Medical Waiver cancellation with reason', async () => {
    vi.mocked(excursionService.cancelBookingWithMedicalWaiver).mockResolvedValue({
      bookingId: 1,
      excursionId: 10,
      passengerId: 101,
      status: 'CANCELLED_MEDICAL_WAIVER',
      refundAmount: 120,
      penaltyFee: 0,
      cancellationReason: 'Miễn trừ y tế: Hành khách sốt cao',
      cancelledAt: new Date().toISOString(),
    });

    const onCancelled = vi.fn();
    const onClose = vi.fn();

    render(
      <MedicalWaiverModal
        isOpen={true}
        onClose={onClose}
        booking={mockRosterSummary.items[0]}
        onCancelled={onCancelled}
      />
    );

    expect(screen.getByText(/Miễn Phạt Y Tế Khẩn Cấp/i)).toBeInTheDocument();
    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Hành khách bị chấn thương/i);
    fireEvent.change(textarea, { target: { value: 'Hành khách sốt cao điều trị tại trạm xá tàu' } });

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Miễn Phạt 100%/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(excursionService.cancelBookingWithMedicalWaiver).toHaveBeenCalledWith(
        10,
        1,
        expect.objectContaining({
          reason: 'Hành khách sốt cao điều trị tại trạm xá tàu',
        })
      );
      expect(onCancelled).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('triggers schedule alert broadcast from page', async () => {
    vi.mocked(excursionService.sendScheduleChangeAlert).mockResolvedValue({
      excursionId: 10,
      recipientsCount: 2,
      title: 'Dời giờ đón xe',
      message: 'Xe đón sớm hơn 15 phút tại sảnh',
      status: 'BROADCAST_SUCCESS',
    });

    render(
      <MemoryRouter initialEntries={['/excursions/10/roster']}>
        <Routes>
          <Route path="/excursions/:id/roster" element={<ExcursionRosterPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
    });

    const alertBtn = screen.getByRole('button', { name: /Phát Cảnh Báo Lịch Trình/i });
    fireEvent.click(alertBtn);

    const titleInput = screen.getByLabelText(/Tiêu Đề Thông Báo/i);
    const msgInput = screen.getByLabelText(/Nội Dung Chi Tiết/i);

    fireEvent.change(titleInput, { target: { value: 'Dời giờ đón xe' } });
    fireEvent.change(msgInput, { target: { value: 'Xe đón sớm hơn 15 phút tại sảnh' } });

    const broadcastSubmitBtn = screen.getByRole('button', { name: /Phát Thông Báo/i });
    fireEvent.click(broadcastSubmitBtn);

    await waitFor(() => {
      expect(excursionService.sendScheduleChangeAlert).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          title: 'Dời giờ đón xe',
          message: 'Xe đón sớm hơn 15 phút tại sảnh',
        })
      );
    });
  });
});
