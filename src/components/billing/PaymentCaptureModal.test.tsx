import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PaymentCaptureModal } from './PaymentCaptureModal';
import { makePreview } from '../../test/fixtures/settlement';

describe('PaymentCaptureModal', () => {
  const setup = (submitting = false) => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <PaymentCaptureModal
        open={true}
        preview={makePreview()}
        submitting={submitting}
        errorMessage={null}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    return { onConfirm, onClose };
  };

  it('defaults the tendered amount to the net amount due and computes change', async () => {
    const user = userEvent.setup({ delay: null });
    setup();

    const amountInput = screen.getByLabelText(/Số tiền nhận/i);
    expect(amountInput).toHaveValue(309);
    expect(screen.getByText('$0.00')).toBeInTheDocument();

    await user.clear(amountInput);
    await user.type(amountInput, '400');

    expect(screen.getByText('$91.00')).toBeInTheDocument();
  });

  it('only calls onConfirm once even when the confirm button is clicked three times', async () => {
    const user = userEvent.setup({ delay: null });
    const { onConfirm } = setup();

    const confirmButton = screen.getByRole('button', { name: /Xác nhận tất toán/i });
    await user.click(confirmButton);
    await user.click(confirmButton);
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      paymentMethod: 'CASH',
      amountTendered: 309,
      notes: undefined,
    });
    expect(confirmButton).toBeDisabled();
  });

  it('shows an inline validation error and does not confirm when the tender is insufficient', async () => {
    const user = userEvent.setup({ delay: null });
    const { onConfirm } = setup();

    const amountInput = screen.getByLabelText(/Số tiền nhận/i);
    await user.clear(amountInput);
    await user.type(amountInput, '100');
    await user.click(screen.getByRole('button', { name: /Xác nhận tất toán/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/Số tiền nhận chưa đủ/i);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('disables the confirm button while submitting', () => {
    setup(true);

    expect(screen.getByRole('button', { name: /Xác nhận tất toán/i })).toBeDisabled();
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    const { onClose } = setup();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });
});
