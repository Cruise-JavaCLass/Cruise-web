import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionQueueEngine } from '../services/transactionQueueEngine';
import { posService } from '../services/posService';
import { posIndexedDb } from '../services/posIndexedDbStore';

vi.mock('../services/posService');

describe('Transaction FIFO Queue Engine & Storage Resilience (KAN-254, KAN-255, KAN-433)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await transactionQueueEngine.clearAll();
  });

  it('enqueues transactions with monotonic sequence and notifies subscribers', async () => {
    const listener = vi.fn();
    const unsub = transactionQueueEngine.subscribe(listener);

    const item1 = await transactionQueueEngine.enqueue(
      { notes: 'Order 1' },
      50.0,
      'BAR-DECK-9',
      'CASHIER-01'
    );

    const item2 = await transactionQueueEngine.enqueue(
      { notes: 'Order 2' },
      30.0,
      'BAR-DECK-9',
      'CASHIER-01'
    );

    expect(item1.seq).toBe(1);
    expect(item2.seq).toBe(2);
    expect(transactionQueueEngine.getPendingCount()).toBe(2);
    expect(listener).toHaveBeenCalled();

    unsub();
  });

  it('flushes pending queue in FIFO order to backend posService', async () => {
    await transactionQueueEngine.enqueue({ notes: 'First Order' }, 25.0, 'BAR-DECK-9', 'CASHIER-01');
    await transactionQueueEngine.enqueue({ notes: 'Second Order' }, 40.0, 'BAR-DECK-9', 'CASHIER-01');

    vi.mocked(posService.createTransaction).mockResolvedValue({
      id: 101,
      transactionUuid: 'TX-RESOLVED',
      stationId: 'BAR-DECK-9',
      cashierId: 'CASHIER-01',
      paymentMethod: 'CABIN_FOLIO',
      type: 'CHARGE',
      status: 'COMPLETED',
      subtotal: 25.0,
      tax: 0,
      gratuity: 0,
      discount: 0,
      totalAmount: 25.0,
      refundedAmount: 0,
      remainingRefundableAmount: 25.0,
      currency: 'USD',
      settled: false,
      createdAt: new Date().toISOString(),
      items: [],
    });

    const result = await transactionQueueEngine.flushQueue();

    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(transactionQueueEngine.getPendingCount()).toBe(0);
    expect(posService.createTransaction).toHaveBeenCalledTimes(2);
  });

  it('handles backend sync failure, increments retry count, and marks FAILED', async () => {
    await transactionQueueEngine.enqueue({ notes: 'Faulty Order' }, 100.0, 'BAR-DECK-9', 'CASHIER-01');

    vi.mocked(posService.createTransaction).mockRejectedValueOnce(
      new Error('Mạng ngắt kết nối giữa biển')
    );

    const result = await transactionQueueEngine.flushQueue();

    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.errors[0]).toContain('Mạng ngắt kết nối giữa biển');

    const queue = transactionQueueEngine.getQueue();
    expect(queue[0].status).toBe('FAILED');
    expect(queue[0].retryCount).toBe(1);
  });

  it('recovers queue from fallback storage if IndexedDB is unavailable', async () => {
    localStorage.setItem(
      'CRUISE_POS_OFFLINE_QUEUE',
      JSON.stringify([
        {
          id: 'TX-RESTORED-01',
          createdAt: new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
          payload: { totalAmount: 45.0, stationId: 'RESTORE-STATION' },
        },
      ])
    );

    await transactionQueueEngine.initialize(true);
    const queue = transactionQueueEngine.getQueue();
    expect(queue.some((q) => q.id === 'TX-RESTORED-01')).toBe(true);
  });
});
