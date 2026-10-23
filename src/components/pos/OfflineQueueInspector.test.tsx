import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OfflineStatusBadge } from './OfflineStatusBadge';
import { PendingQueueInspectorModal } from './PendingQueueInspectorModal';
import { transactionQueueEngine } from '../../services/transactionQueueEngine';

vi.mock('../../services/transactionQueueEngine', () => {
  let mockQueue: any[] = [];
  const listeners = new Set<(q: any[]) => void>();

  return {
    transactionQueueEngine: {
      getQueue: vi.fn(() => [...mockQueue]),
      getPendingCount: vi.fn(() => mockQueue.length),
      subscribe: vi.fn((cb) => {
        listeners.add(cb);
        cb([...mockQueue]);
        return () => listeners.delete(cb);
      }),
      enqueue: vi.fn(async (payload, amt, station, cashier) => {
        const item = {
          id: 'TX-OFFLINE-TEST',
          seq: mockQueue.length + 1,
          createdAt: new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
          payload,
          totalAmount: amt,
          stationId: station,
          cashierId: cashier,
        };
        mockQueue.push(item);
        listeners.forEach((l) => l([...mockQueue]));
        return item;
      }),
      dequeue: vi.fn(async (id) => {
        mockQueue = mockQueue.filter((t) => t.id !== id);
        listeners.forEach((l) => l([...mockQueue]));
      }),
      clearAll: vi.fn(async () => {
        mockQueue = [];
        listeners.forEach((l) => l([]));
      }),
      flushQueue: vi.fn(async () => {
        const count = mockQueue.length;
        mockQueue = [];
        listeners.forEach((l) => l([]));
        return { succeeded: count, failed: 0, errors: [] };
      }),
      _setMockQueue: (q: any[]) => {
        mockQueue = [...q];
        listeners.forEach((l) => l([...mockQueue]));
      },
    },
  };
});

describe('OfflineStatusBadge & Queue Inspector Modal Tests (KAN-253, KAN-434, KAN-435)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (transactionQueueEngine as any)._setMockQueue([]);
  });

  it('renders offline status badge with reactive counter', () => {
    (transactionQueueEngine as any)._setMockQueue([
      {
        id: 'TX-1',
        seq: 1,
        status: 'PENDING',
        totalAmount: 50,
      },
    ]);

    render(<OfflineStatusBadge onOpenInspector={vi.fn()} />);

    expect(screen.getByText('Hàng đợi:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens inspector modal, displays queued transactions, and triggers flush', async () => {
    (transactionQueueEngine as any)._setMockQueue([
      {
        id: 'TX-INSPECT-01',
        seq: 1,
        createdAt: '2026-10-22T10:00:00Z',
        status: 'PENDING',
        retryCount: 0,
        payload: { item: 'Champagne' },
        totalAmount: 120.0,
        stationId: 'BAR-DECK-9',
        cashierId: 'CASHIER-01',
      },
    ]);

    const onClose = vi.fn();
    render(<PendingQueueInspectorModal isOpen={true} onClose={onClose} />);

    expect(
      screen.getByText(/Thanh Tra Hàng Đợi Giao Dịch Ngoại Tuyến/i)
    ).toBeInTheDocument();
    expect(screen.getByText('TX-INSPECT-01')).toBeInTheDocument();
    expect(screen.getByText('$120.00')).toBeInTheDocument();

    // Click flush button
    const flushBtn = screen.getByRole('button', { name: /Đẩy Hàng Đợi \(Manual Flush\)/i });
    fireEvent.click(flushBtn);

    await waitFor(() => {
      expect(transactionQueueEngine.flushQueue).toHaveBeenCalled();
      expect(screen.getByText(/Kết quả đồng bộ: Thành công 1/i)).toBeInTheDocument();
    });
  });

  it('selects a transaction with native button keyboard accessibility to view raw payload', async () => {
    (transactionQueueEngine as any)._setMockQueue([
      {
        id: 'TX-INSPECT-02',
        seq: 2,
        createdAt: '2026-10-22T10:05:00Z',
        status: 'PENDING',
        retryCount: 1,
        payload: { item: 'Caviar', guest: 'VIP Guest' },
        totalAmount: 250.0,
        stationId: 'BAR-DECK-9',
        cashierId: 'CASHIER-01',
      },
    ]);

    render(<PendingQueueInspectorModal isOpen={true} onClose={vi.fn()} />);

    const selectBtn = screen.getByRole('button', { name: /Xem chi tiết giao dịch #2 TX-INSPECT-02/i });
    expect(selectBtn).toBeInTheDocument();
    fireEvent.click(selectBtn);

    expect(screen.getByText(/Raw Transaction JSON Payload/i)).toBeInTheDocument();
    expect(screen.getByText(/"guest": "VIP Guest"/i)).toBeInTheDocument();
  });

  it('confirms individual transaction deletion before calling dequeue', async () => {
    (transactionQueueEngine as any)._setMockQueue([
      {
        id: 'TX-DELETE-01',
        seq: 5,
        createdAt: '2026-10-22T10:10:00Z',
        status: 'PENDING',
        retryCount: 0,
        payload: { item: 'Whiskey' },
        totalAmount: 85.0,
        stationId: 'BAR-DECK-9',
        cashierId: 'CASHIER-01',
      },
    ]);

    const confirmSpy = vi.spyOn(window, 'confirm');

    render(<PendingQueueInspectorModal isOpen={true} onClose={vi.fn()} />);

    const deleteBtn = screen.getByRole('button', { name: /Hủy giao dịch #5/i });
    expect(deleteBtn).toBeInTheDocument();

    // 1. User cancels confirmation
    confirmSpy.mockReturnValueOnce(false);
    fireEvent.click(deleteBtn);
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('#5 (TX-DELETE-01)'));
    expect(transactionQueueEngine.dequeue).not.toHaveBeenCalled();

    // 2. User confirms deletion
    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(deleteBtn);
    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(transactionQueueEngine.dequeue).toHaveBeenCalledWith('TX-DELETE-01');
  });
});
