import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManagerVoidRefundModal } from './ManagerVoidRefundModal';
import { posService, type PosTransaction } from '../../services/posService';

vi.mock('../../services/posService', () => ({
  posService: {
    voidTransaction: vi.fn(),
    refundTransaction: vi.fn(),
  },
}));

describe('ManagerVoidRefundModal Component Tests (KAN-391 & KAN-392)', () => {
  const mockTx: PosTransaction = {
    id: 1,
    transactionUuid: 'TX-VOID-123',
    stationId: 'BAR-DECK-9',
    cashierId: 'CASHIER-HUY',
    cabinNumber: 'CABIN-7012',
    guestName: 'Nguyễn Văn An',
    paymentMethod: 'CABIN_FOLIO',
    type: 'CHARGE',
    status: 'COMPLETED',
    subtotal: 50.0,
    tax: 4.0,
    gratuity: 5.0,
    discount: 0,
    totalAmount: 59.0,
    refundedAmount: 0,
    remainingRefundableAmount: 59.0,
    currency: 'USD',
    settled: false,
    createdAt: new Date().toISOString(),
    items: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders void modal and calls voidTransaction upon submit', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(posService.voidTransaction).mockResolvedValueOnce({ ...mockTx, status: 'VOIDED' });

    render(
      <ManagerVoidRefundModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        transaction={mockTx}
        mode="VOID"
      />
    );

    expect(screen.getByText('Ủy Quyền Hủy Giao Dịch (Void)')).toBeInTheDocument();
    expect(screen.getByText('TX-VOID-123')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/Thu ngân nhập sai/i);
    await user.type(reasonInput, 'Khách trả lại đồ uống tại quầy');

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Hủy \(Void\)/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(posService.voidTransaction).toHaveBeenCalledWith(1, {
        voidReason: 'Khách trả lại đồ uống tại quầy',
        performedBy: 'SUPERVISOR-LE',
        managerPin: '8888',
      });
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renders refund modal and calls refundTransaction upon valid PIN', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(posService.refundTransaction).mockResolvedValueOnce({ ...mockTx, status: 'PARTIALLY_REFUNDED' });

    render(
      <ManagerVoidRefundModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
        transaction={mockTx}
        mode="REFUND"
      />
    );

    expect(screen.getByText('Ủy Quyền Hoàn Tiền (Refund)')).toBeInTheDocument();

    const reasonInput = screen.getByPlaceholderText(/Khách khiếu nại chất lượng/i);
    await user.type(reasonInput, 'Khách khiếu nại chất lượng');

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Hoàn Tiền/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(posService.refundTransaction).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
