import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityRegistrationModal } from './ActivityRegistrationModal';
import {
  activityRegistrationService,
  type ActivityRegistrationResponse
} from '../../services/activityRegistrationService';

describe('ActivityRegistrationModal Component Tests (KAN-372)', () => {
  const sampleActivity = {
    id: 10,
    title: 'Lớp Học Nấu Ăn 5 Sao',
    location: 'Bếp Trưởng - Tầng 4',
    activityDate: '2026-10-25',
    startTime: '15:00',
    endTime: '17:00',
    price: 350000,
    remainingCapacity: 5,
    maxCapacity: 20,
    currentParticipants: 15,
    isIncluded: false,
    cancellationCutOffMinutes: 120
  };

  const samplePassenger = {
    id: 101,
    fullName: 'Trần Minh Hoàng',
    cabinNumber: '812'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không render gì khi isOpen = false', () => {
    const { container } = render(
      <ActivityRegistrationModal
        isOpen={false}
        onClose={vi.fn()}
        activity={sampleActivity}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('render thông tin hoạt động, chi phí và huy hiệu còn chỗ khi còn slot', () => {
    render(
      <ActivityRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        activity={sampleActivity}
        currentPassenger={samplePassenger}
      />
    );

    expect(screen.getByText('Lớp Học Nấu Ăn 5 Sao')).toBeInTheDocument();
    expect(screen.getByText('Bếp Trưởng - Tầng 4')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-available')).toBeInTheDocument();
    expect(screen.getByText(/350\.000 VND/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác Nhận Đăng Ký/i })).toBeInTheDocument();
  });

  it('hiển thị huy hiệu hàng đợi Waitlist khi hoạt động đã hết chỗ', () => {
    const fullActivity = {
      ...sampleActivity,
      remainingCapacity: 0,
      currentParticipants: 20
    };

    render(
      <ActivityRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        activity={fullActivity}
        currentPassenger={samplePassenger}
      />
    );

    expect(screen.getByTestId('status-badge-waitlist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gia Nhập Danh Sách Chờ/i })).toBeInTheDocument();
  });

  it('đăng ký thành công và hiển thị kết quả xác nhận', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockResponse: ActivityRegistrationResponse = {
      registrationId: 501,
      activityId: 10,
      activityTitle: 'Lớp Học Nấu Ăn 5 Sao',
      passengerId: 101,
      passengerName: 'Trần Minh Hoàng',
      cabinNumber: '812',
      status: 'CONFIRMED',
      chargedAmount: 350000,
      transactionId: 'FOLIO-REG-ABC123',
      registeredAt: new Date().toISOString()
    };

    vi.spyOn(activityRegistrationService, 'registerActivity').mockResolvedValueOnce(mockResponse);

    render(
      <ActivityRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        activity={sampleActivity}
        currentPassenger={samplePassenger}
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đăng Ký/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Đăng Ký Thành Công!')).toBeInTheDocument();
      expect(screen.getByText(/FOLIO-REG-ABC123/)).toBeInTheDocument();
    });

    expect(onSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('bắt lỗi 409 khi hành khách đã đăng ký trước đó', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityRegistrationService, 'registerActivity').mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Trùng lặp' } }
    });

    render(
      <ActivityRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        activity={sampleActivity}
        currentPassenger={samplePassenger}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đăng Ký/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Hành khách này đã đăng ký tham gia hoặc đang trong danh sách chờ của hoạt động!'
      );
    });
  });

  it('bắt lỗi 402 khi tài khoản Folio bị khóa chi tiêu', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityRegistrationService, 'registerActivity').mockRejectedValueOnce({
      response: { status: 402, data: { message: 'Folio locked' } }
    });

    render(
      <ActivityRegistrationModal
        isOpen={true}
        onClose={vi.fn()}
        activity={sampleActivity}
        currentPassenger={samplePassenger}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đăng Ký/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Tài khoản cabin Folio đang bị tạm khóa chi tiêu hoặc không đủ hạn mức thanh toán.'
      );
    });
  });
});
