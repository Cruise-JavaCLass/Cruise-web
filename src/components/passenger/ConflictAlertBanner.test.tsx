import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictAlertBanner } from './ConflictAlertBanner';
import type { ScheduleConflict } from '../../services/passengerScheduleService';

describe('ConflictAlertBanner Component Tests (KAN-354)', () => {
  const mockConflicts: ScheduleConflict[] = [
    {
      firstEventId: 10,
      firstEventTitle: 'Yoga Bình Minh',
      firstEventType: 'ACTIVITY',
      firstStartTime: '07:00',
      firstEndTime: '08:00',
      secondEventId: 20,
      secondEventTitle: 'Lớp Học Nấu Ăn',
      secondEventType: 'ACTIVITY',
      secondStartTime: '07:30',
      secondEndTime: '09:00',
      overlapMinutes: 30,
      description: 'Xung đột thời gian 30 phút giữa Yoga Bình Minh và Lớp Học Nấu Ăn',
    },
  ];

  it('không render bất kỳ phần tử nào khi không có xung đột', () => {
    const { container } = render(<ConflictAlertBanner conflicts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('hiển thị banner cảnh báo và số lượng xung đột khi có dữ liệu', () => {
    render(<ConflictAlertBanner conflicts={mockConflicts} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Phát hiện 1 xung đột lịch trình trong ngày/i)).toBeInTheDocument();
    expect(screen.getByText('Yoga Bình Minh')).toBeInTheDocument();
    expect(screen.getByText('Lớp Học Nấu Ăn')).toBeInTheDocument();
    expect(screen.getByText(/Trùng 30 phút/i)).toBeInTheDocument();
  });

  it('cho phép thu gọn và mở rộng chi tiết xung đột', () => {
    render(<ConflictAlertBanner conflicts={mockConflicts} />);

    const toggleBtn = screen.getByLabelText('Thu gọn chi tiết xung đột');
    fireEvent.click(toggleBtn);

    // Sau khi thu gọn, danh sách chi tiết bị ẩn
    expect(screen.queryByText(/Trùng 30 phút/i)).not.toBeInTheDocument();

    // Click lại để mở rộng
    const expandBtn = screen.getByLabelText('Xem chi tiết xung đột');
    fireEvent.click(expandBtn);
    expect(screen.getByText(/Trùng 30 phút/i)).toBeInTheDocument();
  });

  it('gọi hàm onDismiss khi người dùng bấm nút đóng', () => {
    const handleDismiss = vi.fn();
    render(<ConflictAlertBanner conflicts={mockConflicts} onDismiss={handleDismiss} />);

    const closeBtn = screen.getByLabelText('Đóng cảnh báo');
    fireEvent.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
