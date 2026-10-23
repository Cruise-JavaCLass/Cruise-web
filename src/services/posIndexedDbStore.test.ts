import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transactionQueueEngine } from '../services/transactionQueueEngine';
import { posIndexedDb } from '../services/posIndexedDbStore';
import { posService } from '../services/posService';

vi.mock('../services/posService');

describe('Transaction FIFO Queue Engine & Storage Resilience (KAN-254, KAN-255, KAN-433)', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await transactionQueueEngine.clearAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it('rejects conflicting transaction UUIDs and returns existing record on identical retry', async () => {
    const item1 = await transactionQueueEngine.enqueue(
      { transactionUuid: 'TX-IDEMPOTENT-01', notes: 'First submission' },
      75.0,
      'BAR-DECK-9',
      'CASHIER-01'
    );

    // Identical retry: returns existing record
    const itemRetry = await transactionQueueEngine.enqueue(
      { transactionUuid: 'TX-IDEMPOTENT-01', notes: 'Retry identical' },
      75.0,
      'BAR-DECK-9',
      'CASHIER-01'
    );
    expect(itemRetry.id).toBe(item1.id);
    expect(transactionQueueEngine.getPendingCount()).toBe(1);

    // Conflicting submission with different total amount
    await expect(
      transactionQueueEngine.enqueue(
        { transactionUuid: 'TX-IDEMPOTENT-01', notes: 'Conflicting amount' },
        999.0,
        'BAR-DECK-9',
        'CASHIER-01'
      )
    ).rejects.toThrow(/Conflicting transaction enqueue/i);
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

  it('surfaces persistent storage failure during dequeue and marks SYNCED when markSyncedOnFailure is set', async () => {
    const item = await transactionQueueEngine.enqueue({ notes: 'Storage Test' }, 50.0, 'BAR-DECK-9', 'CASHIER-01');

    vi.spyOn(posIndexedDb, 'isSupported').mockReturnValue(true);
    vi.spyOn(posIndexedDb, 'deleteTransaction').mockRejectedValueOnce(new Error('IndexedDB I/O failure'));

    await expect(transactionQueueEngine.dequeue(item.id, { markSyncedOnFailure: true })).rejects.toThrow(/IndexedDB I\/O failure/i);

    const queue = transactionQueueEngine.getQueue();
    const target = queue.find((t) => t.id === item.id);
    expect(target).toBeDefined();
    expect(target?.status).toBe('SYNCED');
  });

  it('keeps original status on manual dequeue failure without markSyncedOnFailure', async () => {
    const item = await transactionQueueEngine.enqueue({ notes: 'Manual Cancel' }, 50.0, 'BAR-DECK-9', 'CASHIER-01');

    vi.spyOn(posIndexedDb, 'isSupported').mockReturnValue(true);
    vi.spyOn(posIndexedDb, 'deleteTransaction').mockRejectedValueOnce(new Error('IndexedDB I/O failure'));

    await expect(transactionQueueEngine.dequeue(item.id)).rejects.toThrow(/IndexedDB I\/O failure/i);

    const queue = transactionQueueEngine.getQueue();
    const target = queue.find((t) => t.id === item.id);
    expect(target).toBeDefined();
    expect(target?.status).toBe('PENDING');
  });

  it('resets recovered SYNCING status to PENDING in fallback storage', async () => {
    localStorage.setItem(
      'CRUISE_POS_OFFLINE_QUEUE',
      JSON.stringify([
        {
          id: 'TX-SYNCING-01',
          createdAt: new Date().toISOString(),
          status: 'SYNCING',
          retryCount: 0,
          totalAmount: 30.0,
          payload: { totalAmount: 30.0, stationId: 'STATION-1' },
        },
      ])
    );

    await transactionQueueEngine.initialize(true);
    const queue = transactionQueueEngine.getQueue();
    const restored = queue.find((q) => q.id === 'TX-SYNCING-01');
    expect(restored).toBeDefined();
    expect(restored?.status).toBe('PENDING');
  });

  it('recovers queue from fallback storage if IndexedDB is unavailable and skips null entries safely', async () => {
    localStorage.setItem(
      'CRUISE_POS_OFFLINE_QUEUE',
      JSON.stringify([
        null,
        'not_an_object',
        {
          id: 'TX-RESTORED-01',
          createdAt: new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
          totalAmount: 'invalid_number',
          payload: { totalAmount: 45.0, stationId: 'RESTORE-STATION' },
        },
      ])
    );

    await transactionQueueEngine.initialize(true);
    const queue = transactionQueueEngine.getQueue();
    const restored = queue.find((q) => q.id === 'TX-RESTORED-01');
    expect(restored).toBeDefined();
    expect(typeof restored?.totalAmount).toBe('number');
    expect(restored?.totalAmount).toBe(45.0);
  });
});
