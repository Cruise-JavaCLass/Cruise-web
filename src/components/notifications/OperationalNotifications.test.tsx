import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
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
    it('renders composer fields when open', () => {
      render(<OperationalBroadcastComposerModal isOpen={true} onClose={() => {}} />);
      expect(screen.getByText('Phát Thông Báo Vận Hành & Khẩn Cấp Toàn Tàu')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Cảnh báo thời tiết xấu/i)).toBeInTheDocument();
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
  });

  describe('UrgentOperationalBanner', () => {
    it('listens to SSE events and displays urgent banner', async () => {
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

      // Trigger event
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
      });

      // Close banner
      fireEvent.click(screen.getByText('Đã Nhận Tin'));
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });
});
