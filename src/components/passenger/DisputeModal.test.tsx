import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DisputeModal } from './DisputeModal';
import type { FolioTransaction } from '../../services/passengerFolioService';

describe('DisputeModal Component', () => {
  const mockTransaction: FolioTransaction = {
    id: 1,
    transactionUuid: 'TX-UUID-123456',
    time: '2026-10-21T10:00:00Z',
    locationCounter: 'Deck 9 Ocean Bar',
    posCode: 'POS-01',
    swipedBy: 'Nguyễn Văn An',
    amount: 75.5,
    currency: 'USD',
    category: 'FOOD_AND_BEVERAGE',
    complimentary: false,
    status: 'COMPLETED',
    items: [],
  };

  it('renders modal when open with transaction details', () => {
    render(
      <DisputeModal
        isOpen={true}
        onClose={vi.fn()}
        transaction={mockTransaction}
        onSubmitDispute={vi.fn()}
      />
    );

    expect(screen.getByText('Khiếu nại giao dịch')).toBeDefined();
    expect(screen.getByText('TX-UUID-123456')).toBeDefined();
    expect(screen.getByText('Deck 9 Ocean Bar')).toBeDefined();
    expect(screen.getByText('$75.50')).toBeDefined();
  });

  it('validates amount exceeding original transaction amount', async () => {
    const onSubmitDispute = vi.fn();
    render(
      <DisputeModal
        isOpen={true}
        onClose={vi.fn()}
        transaction={mockTransaction}
        onSubmitDispute={onSubmitDispute}
      />
    );

    const amountInput = screen.getByPlaceholderText('Nhập số tiền yêu cầu hoàn / điều chỉnh');
    const noteInput = screen.getByPlaceholderText('Cung cấp lý do cụ thể để bộ phận Lễ tân & Kế toán kiểm tra...');

    fireEvent.change(amountInput, { target: { value: '100.00' } });
    fireEvent.change(noteInput, { target: { value: 'Tính tiền sai' } });

    const submitBtn = screen.getByText('Gửi khiếu nại đến Lễ tân');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Số tiền khiếu nại không thể vượt quá \$75\.50/i)).toBeDefined();
    });
    expect(onSubmitDispute).not.toHaveBeenCalled();
  });

  it('successfully submits valid dispute', async () => {
    const onSubmitDispute = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <DisputeModal
        isOpen={true}
        onClose={onClose}
        transaction={mockTransaction}
        onSubmitDispute={onSubmitDispute}
      />
    );

    const amountInput = screen.getByPlaceholderText('Nhập số tiền yêu cầu hoàn / điều chỉnh');
    const noteInput = screen.getByPlaceholderText('Cung cấp lý do cụ thể để bộ phận Lễ tân & Kế toán kiểm tra...');

    fireEvent.change(amountInput, { target: { value: '25.00' } });
    fireEvent.change(noteInput, { target: { value: 'Bị tính 2 ly cocktail' } });

    const submitBtn = screen.getByText('Gửi khiếu nại đến Lễ tân');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitDispute).toHaveBeenCalledWith({
        reason: 'INCORRECT_AMOUNT',
        disputeAmount: 25,
        disputeNote: 'Bị tính 2 ly cocktail',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
