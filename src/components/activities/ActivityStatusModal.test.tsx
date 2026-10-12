import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityStatusModal } from './ActivityStatusModal';
import * as activityService from '../../services/activityService';

const mockScheduledActivity: activityService.OnboardActivity = {
  id: 1,
  tourId: 1,
  dayNumber: 1,
  title: 'Yoga Bình Minh Trên Boong Tàu',
  category: 'Wellness & Sức Khỏe',
  location: 'Tầng 12 - Sundeck',
  activityDate: '2026-11-01',
  startTime: '06:00',
  endTime: '07:30',
  maxCapacity: 35,
  currentParticipants: 28,
  price: 0,
  isIncluded: true,
  status: 'SCHEDULED',
  active: true,
};

const mockInProgressActivity: activityService.OnboardActivity = {
  ...mockScheduledActivity,
  id: 2,
  title: 'Lớp Học Nấu Ăn Ẩm Thực Ý',
  status: 'IN_PROGRESS',
};

const mockCompletedActivity: activityService.OnboardActivity = {
  ...mockScheduledActivity,
  id: 3,
  title: 'Thử Thách Leo Núi',
  status: 'COMPLETED',
};

const mockCancelledActivity: activityService.OnboardActivity = {
  ...mockScheduledActivity,
  id: 4,
  title: 'Tiệc Hồ Bơi Chiều Hoàng Hôn',
  status: 'CANCELLED',
  cancellationReason: 'Thời tiết gió giật mạnh',
};

describe('ActivityStatusModal Component Tests (KAN-141)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ActivityStatusModal
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={mockScheduledActivity}
      />
    );

    expect(screen.queryByText('Chuyển Trạng Thái Hoạt Động')).not.toBeInTheDocument();
  });

  it('does not render when activity is null', () => {
    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={null}
      />
    );

    expect(screen.queryByText('Chuyển Trạng Thái Hoạt Động')).not.toBeInTheDocument();
  });

  it('renders modal with allowed transitions for SCHEDULED activity', () => {
    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={mockScheduledActivity}
      />
    );

    expect(screen.getByText('Chuyển Trạng Thái Hoạt Động')).toBeInTheDocument();
    expect(screen.getByText('Yoga Bình Minh Trên Boong Tàu')).toBeInTheDocument();
    expect(screen.getByText('Lên lịch (SCHEDULED)')).toBeInTheDocument();

    // From SCHEDULED, allowed transitions are IN_PROGRESS and CANCELLED
    expect(screen.getByLabelText(/Đang diễn ra \(IN_PROGRESS\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hủy bỏ \(CANCELLED\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Đã hoàn thành \(COMPLETED\)/i)).not.toBeInTheDocument();
  });

  it('renders modal with allowed transitions for IN_PROGRESS activity', () => {
    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={mockInProgressActivity}
      />
    );

    // From IN_PROGRESS, allowed transitions are COMPLETED and CANCELLED
    expect(screen.getByLabelText(/Đã hoàn thành \(COMPLETED\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hủy bỏ \(CANCELLED\)/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Lên lịch \(SCHEDULED\)/i)).not.toBeInTheDocument();
  });

  it('renders disabled state when activity is COMPLETED (terminal state)', () => {
    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={mockCompletedActivity}
      />
    );

    expect(
      screen.getByText(/Hoạt động đã kết thúc \(COMPLETED\) và không thể chuyển trạng thái tiếp/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác nhận chuyển đổi/i })).toBeDisabled();
  });

  it('renders allow return to SCHEDULED from CANCELLED activity', () => {
    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={mockCancelledActivity}
      />
    );

    expect(screen.getByLabelText(/Lên lịch \(SCHEDULED\)/i)).toBeInTheDocument();
  });

  it('validates cancellation reason when selecting CANCELLED status', async () => {
    const user = userEvent.setup();

    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={mockScheduledActivity}
      />
    );

    // Select CANCELLED radio option
    const cancelRadio = screen.getByLabelText(/Hủy bỏ \(CANCELLED\)/i);
    await user.click(cancelRadio);

    // Textarea for cancellation reason should appear
    expect(screen.getByLabelText(/Lý do hủy hoạt động/i)).toBeInTheDocument();

    // Click submit with empty reason
    await user.click(screen.getByRole('button', { name: /Xác nhận chuyển đổi/i }));

    expect(
      screen.getByText('Vui lòng nhập lý do hủy hoạt động để thông báo cho hành khách')
    ).toBeInTheDocument();
  });

  it('successfully updates activity status and triggers onSuccess & onClose', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const updatedMock: activityService.OnboardActivity = {
      ...mockScheduledActivity,
      status: 'IN_PROGRESS',
    };

    const spyUpdate = vi
      .spyOn(activityService, 'updateActivityStatus')
      .mockResolvedValueOnce(updatedMock);

    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        activity={mockScheduledActivity}
      />
    );

    // Default selected status is IN_PROGRESS
    await user.click(screen.getByRole('button', { name: /Xác nhận chuyển đổi/i }));

    await waitFor(() => {
      expect(spyUpdate).toHaveBeenCalledWith(
        mockScheduledActivity.id,
        expect.objectContaining({
          status: 'IN_PROGRESS',
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(updatedMock);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles cancellation submission with reason', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const cancelledMock: activityService.OnboardActivity = {
      ...mockScheduledActivity,
      status: 'CANCELLED',
      cancellationReason: 'Thời tiết mưa bão cấp 7',
    };

    const spyUpdate = vi
      .spyOn(activityService, 'updateActivityStatus')
      .mockResolvedValueOnce(cancelledMock);

    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        activity={mockScheduledActivity}
      />
    );

    await user.click(screen.getByLabelText(/Hủy bỏ \(CANCELLED\)/i));
    const textarea = screen.getByLabelText(/Lý do hủy hoạt động/i);
    await user.type(textarea, 'Thời tiết mưa bão cấp 7');

    await user.click(screen.getByRole('button', { name: /Xác nhận chuyển đổi/i }));

    await waitFor(() => {
      expect(spyUpdate).toHaveBeenCalledWith(
        mockScheduledActivity.id,
        expect.objectContaining({
          status: 'CANCELLED',
          cancellationReason: 'Thời tiết mưa bão cấp 7',
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(cancelledMock);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('displays API error message when status update fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityService, 'updateActivityStatus').mockRejectedValueOnce(
      new Error('Không thể cập nhật trạng thái hoạt động do lỗi mạng.')
    );

    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activity={mockScheduledActivity}
      />
    );

    await user.click(screen.getByRole('button', { name: /Xác nhận chuyển đổi/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Không thể cập nhật trạng thái hoạt động do lỗi mạng.')
      ).toBeInTheDocument();
    });
  });

  it('closes when clicking close or cancel button', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ActivityStatusModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={vi.fn()}
        activity={mockScheduledActivity}
      />
    );

    await user.click(screen.getByRole('button', { name: /Hủy/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByRole('button', { name: 'Đóng' });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
