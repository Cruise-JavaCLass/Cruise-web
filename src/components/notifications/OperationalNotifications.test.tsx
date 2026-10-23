import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OperationalBroadcastComposerModal } from './OperationalBroadcastComposerModal';
import { UrgentOperationalBanner } from './UrgentOperationalBanner';
import { operationalNotificationService } from '../../services/operationalNotificationService';

vi.mock('../../services/operationalNotificationService', () => ({
  operationalNotificationService: {
    broadcastAlert: vi.fn(),
    createAlertEventSource: vi.fn(),
  },
}));

describe('Operational Notifications UI Tests (KAN-262 & KAN-438)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('OperationalBroadcastComposerModal', () => {
    it('renders composer fields when open and has accessible dialog semantics', () => {
      render(<OperationalBroadcastComposerModal isOpen={true} onClose={() => {}} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Phát Thông Báo Vận Hành & Khẩn Cấp Toàn Tàu')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Cảnh báo thời tiết xấu/i)).toBeInTheDocument();
    });

    it('closes on Escape key press', () => {
      const handleClose = vi.fn();
      render(<OperationalBroadcastComposerModal isOpen={true} onClose={handleClose} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalled();
    });

    it('submits broadcast payload when form is submitted', async () => {
      (operationalNotificationService.broadcastAlert as any).mockResolvedValue({
        broadcastId: 'BC-999',
        recipientCount: 120,
      });

      const handleSuccess = vi.fn();
      render(<OperationalBroadcastComposerModal isOpen={true} onClose={() => {}} onBroadcastSuccess={handleSuccess} />);

      fireEvent.change(screen.getByPlaceholderText(/Cảnh báo thời tiết xấu/i), {
        target: { value: 'Bão số 3' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Nhập nội dung thông báo cụ thể/i), {
        target: { value: 'Tàu chuyển hướng neo đậu an toàn' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Phát Thông Báo Ngay/i }));

      await waitFor(() => {
        expect(operationalNotificationService.broadcastAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Bão số 3',
            message: 'Tàu chuyển hướng neo đậu an toàn',
          })
        );
        expect(handleSuccess).toHaveBeenCalled();
      });
    });

    it('does not display failure message if onBroadcastSuccess throws', async () => {
      (operationalNotificationService.broadcastAlert as any).mockResolvedValue({
        broadcastId: 'BC-123',
        recipientCount: 50,
      });

      const failingCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback crash');
      });

      render(<OperationalBroadcastComposerModal isOpen={true} onClose={() => {}} onBroadcastSuccess={failingCallback} />);

      fireEvent.change(screen.getByPlaceholderText(/Cảnh báo thời tiết xấu/i), {
        target: { value: 'Diễn tập an toàn' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Nhập nội dung thông báo cụ thể/i), {
        target: { value: 'Tập trung tại Muster Station' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Phát Thông Báo Ngay/i }));

      await waitFor(() => {
        expect(screen.getByText(/Đã phát thông báo thành công/i)).toBeInTheDocument();
        expect(screen.queryByText(/Có lỗi xảy ra/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('UrgentOperationalBanner', () => {
    it('listens to SSE events and displays urgent banner for CRITICAL with role="alert"', async () => {
      let listenerCallback: any = null;
      const mockEventSource = {
        addEventListener: vi.fn().mockImplementation((name, cb) => {
          if (name === 'OPERATIONAL_ALERT') listenerCallback = cb;
        }),
        close: vi.fn(),
      };
      (operationalNotificationService.createAlertEventSource as any).mockReturnValue(mockEventSource);

      render(<UrgentOperationalBanner />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Trigger critical event
      if (listenerCallback) {
        listenerCallback({
          data: JSON.stringify({
            broadcastId: 'BC-1',
            title: 'Khẩn Cấp Cứu Hộ',
            message: 'Tập trung tại mạn phải',
            category: 'CRITICAL',
            scope: 'ALL',
            requireAcknowledgment: true,
          }),
        });
      }

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Khẩn Cấp Cứu Hộ')).toBeInTheDocument();
        expect(screen.getByText('Đã Nhận Tin')).toBeInTheDocument();
        // Close X button must be hidden when requireAcknowledgment is true
        expect(screen.queryByTitle('Đóng banner')).not.toBeInTheDocument();
      });

      // Acknowledge banner
      fireEvent.click(screen.getByText('Đã Nhận Tin'));
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('renders routine events with role="status" and allows dismissal via X', async () => {
      let listenerCallback: any = null;
      const mockEventSource = {
        addEventListener: vi.fn().mockImplementation((name, cb) => {
          if (name === 'OPERATIONAL_ALERT') listenerCallback = cb;
        }),
        close: vi.fn(),
      };
      (operationalNotificationService.createAlertEventSource as any).mockReturnValue(mockEventSource);

      render(<UrgentOperationalBanner />);

      // Trigger routine event
      if (listenerCallback) {
        listenerCallback({
          data: JSON.stringify({
            broadcastId: 'BC-2',
            title: 'Tiệc Buffet Tối',
            message: 'Nhà hàng mở cửa lúc 19:00',
            category: 'DINING',
            scope: 'ALL',
            requireAcknowledgment: false,
          }),
        });
      }

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(screen.getByTitle('Đóng banner')).toBeInTheDocument();
      });

      // Close banner via X
      fireEvent.click(screen.getByTitle('Đóng banner'));
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });
});
