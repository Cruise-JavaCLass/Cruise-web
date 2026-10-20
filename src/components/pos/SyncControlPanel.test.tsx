import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncControlPanel } from './SyncControlPanel';
import { offlineSyncManager } from '../../services/offlineSyncService';
import { posService } from '../../services/posService';

vi.mock('../../services/posService', () => ({
  posService: {
    syncOfflineBatch: vi.fn(),
  },
}));

describe('SyncControlPanel & Retry Logic Tests (KAN-257 & KAN-258)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders empty queue and empty sync history initially', () => {
    render(<SyncControlPanel />);

    expect(screen.getByText('Hàng Đợi Ngoại Tuyến')).toBeInTheDocument();
    expect(screen.getByText('Lịch Sử Đợt Đồng Bộ')).toBeInTheDocument();
    expect(screen.getByText('Exponential Backoff')).toBeInTheDocument();
    expect(screen.getByText(/Hàng đợi ngoại tuyến trống/i)).toBeInTheDocument();
    expect(screen.getByText(/Chưa có nhật ký đồng bộ nào/i)).toBeInTheDocument();
  });

  it('allows enqueueing mock offline transaction and displays it in the queue list', async () => {
    const user = userEvent.setup();
    render(<SyncControlPanel />);

    const addMockBtn = screen.getByRole('button', { name: /\+ Giả Lập Giao Dịch Offline/i });
    await user.click(addMockBtn);

    expect(screen.getByText('1 GD')).toBeInTheDocument();
    expect(screen.getByText('1 Đang Chờ')).toBeInTheDocument();
    expect(screen.getByText(/CABIN-7012/i)).toBeInTheDocument();
    expect(screen.getByText(/\$25\.00/i)).toBeInTheDocument();
  });

  it('triggers manual sync successfully and records success in history', async () => {
    const user = userEvent.setup();
    offlineSyncManager.enqueueTransaction({
      transactionUuid: 'TX-TEST-001',
      stationId: 'BAR-DECK-9',
      cashierId: 'CASHIER-1',
      subtotal: 30,
      paymentMethod: 'CASH',
      items: [{ itemCode: 'ITEM-1', itemName: 'Beer', quantity: 1, unitPrice: 30 }],
    });

    vi.mocked(posService.syncOfflineBatch).mockResolvedValueOnce({
      deviceId: 'POS-TERMINAL-DECK-9',
      totalReceived: 1,
      successfullyProcessed: 1,
      duplicateCount: 0,
      failedCount: 0,
      processedUuids: ['TX-TEST-001'],
      failedReasons: [],
    });

    render(<SyncControlPanel />);

    expect(screen.getByText('1 GD')).toBeInTheDocument();

    const syncBtn = screen.getByRole('button', { name: /Đồng Bộ Thủ Công Ngay/i });
    await user.click(syncBtn);

    await waitFor(() => {
      expect(screen.getByText(/Đồng bộ thành công!/i)).toBeInTheDocument();
    });

    expect(posService.syncOfflineBatch).toHaveBeenCalledTimes(1);
    expect(screen.getByText('0 GD')).toBeInTheDocument();
    expect(screen.getByText('1 Lần')).toBeInTheDocument();
  });

  it('retries with backoff on failure and reports error when server unreachable', async () => {
    const user = userEvent.setup();
    offlineSyncManager.enqueueTransaction({
      transactionUuid: 'TX-ERR-001',
      stationId: 'BAR-DECK-9',
      cashierId: 'CASHIER-1',
      subtotal: 15,
      paymentMethod: 'CASH',
      items: [{ itemCode: 'ITEM-2', itemName: 'Juice', quantity: 1, unitPrice: 15 }],
    });

    vi.mocked(posService.syncOfflineBatch).mockRejectedValue(new Error('Network Connection Refused'));

    render(<SyncControlPanel />);

    const syncBtn = screen.getByRole('button', { name: /Đồng Bộ Thủ Công Ngay/i });
    await user.click(syncBtn);

    await waitFor(
      () => {
        expect(screen.getByText(/Network Connection Refused/i)).toBeInTheDocument();
      },
      { timeout: 8000 }
    );

    // Verify retries happened (3 attempts)
    expect(posService.syncOfflineBatch).toHaveBeenCalledTimes(3);
    // Queue is kept intact on failure
    expect(screen.getByText('1 GD')).toBeInTheDocument();
  });
});
