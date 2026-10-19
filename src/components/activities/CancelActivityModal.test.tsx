import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelActivityModal } from './CancelActivityModal';
import {
  activityRegistrationService,
  type ActivityCancellationResponse
} from '../../services/activityRegistrationService';

describe('CancelActivityModal Component Tests (KAN-372)', () => {
  const sampleRegistration = {
    registrationId: 501,
    activityId: 10,
    activityTitle: 'Dạ Tiệc Khiêu Vũ Ý',
    chargedAmount: 400000,
    cancellationCutOffMinutes: 120,
    passengerId: 101
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không render gì khi isOpen = false', () => {
    const { container } = render(
      <CancelActivityModal
        isOpen={false}
        onClose={vi.fn()}
        registration={sampleRegistration}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('hiển thị thông tin hoạt động, cảnh báo cut-off và số tiền hoàn dự kiến', () => {
    render(
      <CancelActivityModal
        isOpen={true}
        onClose={vi.fn()}
        registration={sampleRegistration}
      />
    );

    expect(screen.getByText('Dạ Tiệc Khiêu Vũ Ý')).toBeInTheDocument();
    expect(screen.getByText(/120 phút/)).toBeInTheDocument();
    expect(screen.getByText(/400\.000 VND \(100%\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác Nhận Hủy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Giữ Chỗ/i })).toBeInTheDocument();
  });

  it('hủy đặt chỗ thành công và thông báo số tiền hoàn Folio', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockResult: ActivityCancellationResponse = {
      registrationId: 501,
      status: 'CANCELLED',
      refundAmount: 400000,
      waitlistPromotedPassengerId: 105,
      cancellationReason: 'Thay đổi kế hoạch',
      cancelledAt: new Date().toISOString()
    };

    vi.spyOn(activityRegistrationService, 'cancelRegistration').mockResolvedValueOnce(mockResult);

    render(
      <CancelActivityModal
        isOpen={true}
        onClose={vi.fn()}
        registration={sampleRegistration}
        onSuccess={onSuccess}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Xác Nhận Hủy/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('Hủy Đăng Ký Thành Công!')).toBeInTheDocument();
      expect(screen.getByText(/400\.000 VND đã được hoàn vào tài khoản Folio/)).toBeInTheDocument();
      expect(screen.getByText(/tự động phân bổ suất trống cho hành khách tiếp theo/)).toBeInTheDocument();
    });

    expect(onSuccess).toHaveBeenCalledWith(mockResult);
  });

  it('hiển thị lỗi khi API hủy bị từ chối', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityRegistrationService, 'cancelRegistration').mockRejectedValueOnce({
      response: { data: { message: 'Đăng ký này đã bị hủy trước đó' } }
    });

    render(
      <CancelActivityModal
        isOpen={true}
        onClose={vi.fn()}
        registration={sampleRegistration}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Xác Nhận Hủy/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Đăng ký này đã bị hủy trước đó');
    });
  });
});
