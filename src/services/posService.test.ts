import { describe, it, expect, vi, beforeEach } from 'vitest';
import { posService, CreateTransactionRequest, VoidTransactionRequest, RefundTransactionRequest } from './posService';
import { apiClient } from './api';

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('posService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTransaction sends POST with Idempotency-Key header', async () => {
    const mockTx = { id: 1, transactionUuid: 'TX-100', totalAmount: 45.0, status: 'COMPLETED' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, data: mockTx } });

    const req: CreateTransactionRequest = {
      stationId: 'BAR-DECK-9',
      cashierId: 'CASHIER-01',
      paymentMethod: 'CABIN_FOLIO',
      items: [{ itemCode: 'BEV-01', itemName: 'Mojito', category: 'BEVERAGE', quantity: 2, unitPrice: 15.0 }],
    };

    const result = await posService.createTransaction(req, 'IDEM-KEY-123');

    expect(apiClient.post).toHaveBeenCalledWith(
      '/pos/transactions',
      req,
      { headers: { 'Idempotency-Key': 'IDEM-KEY-123' } }
    );
    expect(result.id).toBe(1);
    expect(result.status).toBe('COMPLETED');
  });

  it('voidTransaction sends POST to /{id}/void', async () => {
    const mockTx = { id: 1, status: 'VOIDED', voidReason: 'Khách hủy' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, data: mockTx } });

    const voidReq: VoidTransactionRequest = { voidReason: 'Khách hủy', performedBy: 'CASHIER-01' };
    const result = await posService.voidTransaction(1, voidReq);

    expect(apiClient.post).toHaveBeenCalledWith('/pos/transactions/1/void', voidReq);
    expect(result.status).toBe('VOIDED');
  });

  it('refundTransaction sends POST to /{id}/refund', async () => {
    const mockTx = { id: 1, status: 'PARTIALLY_REFUNDED', refundedAmount: 20.0 };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, data: mockTx } });

    const refundReq: RefundTransactionRequest = {
      refundAmount: 20.0,
      refundReason: 'Đổi ý',
      performedBy: 'CASHIER-01',
      managerPin: '8888',
    };
    const result = await posService.refundTransaction(1, refundReq);

    expect(apiClient.post).toHaveBeenCalledWith('/pos/transactions/1/refund', refundReq);
    expect(result.status).toBe('PARTIALLY_REFUNDED');
  });

  it('getFolio sends GET to /pos/folios/{cabinNumber}', async () => {
    const mockFolio = { id: 1, cabinNumber: 'CABIN-7012', availableLimit: 1200.0 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { success: true, data: mockFolio } });

    const result = await posService.getFolio('CABIN-7012');

    expect(apiClient.get).toHaveBeenCalledWith('/pos/folios/CABIN-7012');
    expect(result.cabinNumber).toBe('CABIN-7012');
  });
});
