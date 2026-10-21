import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenterDrawer } from './NotificationCenterDrawer';
import {
  passengerNotificationService,
  type PassengerNotificationDto,
  type NotificationSummaryDto,
} from '../../services/passengerNotificationService';

vi.mock('../../services/passengerNotificationService');

describe('NotificationCenterDrawer Component Tests (KAN-366 & KAN-368)', () => {
  const mockPassengerId = 10;
  const mockNotifications: PassengerNotificationDto[] = [
    {
      id: 1,
      passengerId: 10,
      title: 'Tàu chuyển giờ All Aboard',
      message: 'Toàn bộ hành khách có mặt trước 17:30 tại Cảng Hạ Long.',
      category: 'CRITICAL',
      isRead: false,
      createdAt: '2026-10-21T10:00:00Z',
      actionUrl: '/schedule',
    },
    {
      id: 2,
      passengerId: 10,
      title: 'Đổi điểm đón xe tour Hội An',
      message: 'Xe số 3 đón tại Cổng Bến Cảng 2.',
      category: 'OPERATIONAL',
      isRead: true,
      createdAt: '2026-10-21T09:00:00Z',
    },
    {
      id: 3,
      passengerId: 10,
      title: 'Nhắc giờ biểu diễn ảo thuật',
      message: 'Nhà hát Starlight lúc 20:00 tối nay.',
      category: 'REMINDER',
      isRead: false,
      createdAt: '2026-10-21T08:30:00Z',
    },
  ];

  const mockSummary: NotificationSummaryDto = {
    totalUnread: 2,
    criticalUnread: 1,
    unreadByCategory: {
      CRITICAL: 1,
      OPERATIONAL: 0,
      REMINDER: 1,
      PROMOTIONAL: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(passengerNotificationService.getNotifications).mockResolvedValue(mockNotifications);
    vi.mocked(passengerNotificationService.getNotificationSummary).mockResolvedValue(mockSummary);
    vi.mocked(passengerNotificationService.markAsRead).mockResolvedValue({
      ...mockNotifications[0],
      isRead: true,
    });
    vi.mocked(passengerNotificationService.markAllAsRead).mockResolvedValue();
  });

  it('renders drawer with notification list and unread badge count', async () => {
    render(
      <NotificationCenterDrawer
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Trung Tâm Thông Báo')).toBeInTheDocument();
      expect(screen.getByText('2 thông báo chưa đọc')).toBeInTheDocument();
      expect(screen.getByText('Tàu chuyển giờ All Aboard')).toBeInTheDocument();
      expect(screen.getByText('Đổi điểm đón xe tour Hội An')).toBeInTheDocument();
      expect(screen.getByText('KHẨN CẤP')).toBeInTheDocument();
    });
  });

  it('filters notifications by Category tab click', async () => {
    render(
      <NotificationCenterDrawer
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tàu chuyển giờ All Aboard')).toBeInTheDocument();
    });

    const criticalTab = screen.getByRole('button', { name: 'Khẩn cấp' });
    fireEvent.click(criticalTab);

    expect(passengerNotificationService.getNotifications).toHaveBeenCalledWith(
      mockPassengerId,
      'CRITICAL'
    );
  });

  it('marks a single notification as read when clicking mark read button', async () => {
    render(
      <NotificationCenterDrawer
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('mark-read-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mark-read-btn-1'));

    await waitFor(() => {
      expect(passengerNotificationService.markAsRead).toHaveBeenCalledWith(mockPassengerId, 1);
    });
  });

  it('marks all notifications as read when clicking mark all button', async () => {
    render(
      <NotificationCenterDrawer
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Đọc tất cả')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Đọc tất cả'));

    await waitFor(() => {
      expect(passengerNotificationService.markAllAsRead).toHaveBeenCalledWith(mockPassengerId);
    });
  });

  it('navigates to action url when action button is clicked', async () => {
    const mockNavigate = vi.fn();
    render(
      <NotificationCenterDrawer
        passengerId={mockPassengerId}
        isOpen={true}
        onClose={vi.fn()}
        onNavigate={mockNavigate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Xem chi tiết')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Xem chi tiết'));

    expect(mockNavigate).toHaveBeenCalledWith('/schedule');
  });
});
