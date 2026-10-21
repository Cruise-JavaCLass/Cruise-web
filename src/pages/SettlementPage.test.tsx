import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { SettlementPage } from './SettlementPage';
import {
  downloadInvoiceWithFileName,
  getSettlementPreview,
  newIdempotencyKey,
  settleFolio,
} from '../services/settlementService';
import { makePreview, makeSettlement } from '../test/fixtures/settlement';

vi.mock('../services/settlementService', () => ({
  getSettlementPreview: vi.fn(),
  settleFolio: vi.fn(),
  downloadInvoiceWithFileName: vi.fn(),
  newIdempotencyKey: vi.fn(() => 'test-idempotency-key'),
}));

describe('SettlementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const loadFolio = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/Số cabin/i), 'CABIN-7012');
    await user.click(screen.getByRole('button', { name: /Tải folio/i }));
  };

  it('settles the folio, downloads the invoice and keeps the idempotency key stable', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(getSettlementPreview).mockResolvedValue(makePreview());
    vi.mocked(settleFolio).mockResolvedValue(makeSettlement());
    vi.mocked(downloadInvoiceWithFileName).mockResolvedValue({
      blob: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      fileName: 'INV-2026-000241.pdf',
    });

    render(<SettlementPage />);
    await loadFolio(user);

    expect(await screen.findByText('$309.00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Tất toán$/i }));
    const dialog = screen.getByRole('dialog', { name: /Xác nhận tất toán folio/i });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /Xác nhận tất toán/i }));

    await waitFor(() => {
      expect(settleFolio).toHaveBeenCalledTimes(1);
    });
    expect(settleFolio).toHaveBeenCalledWith(
      'CABIN-7012',
      { paymentMethod: 'CASH', amountTendered: 309, forceWithHold: false },
      'test-idempotency-key',
    );
    expect(newIdempotencyKey).toHaveBeenCalledTimes(1);
    expect(downloadInvoiceWithFileName).toHaveBeenCalledWith('CABIN-7012');
    expect(
      await screen.findByText(/Đã tất toán cabin CABIN-7012 thành công/i),
    ).toBeInTheDocument();
  });

  it('reuses the same idempotency key when the modal is reopened before settling', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(getSettlementPreview).mockResolvedValue(makePreview());
    vi.mocked(settleFolio).mockResolvedValue(makeSettlement());
    vi.mocked(downloadInvoiceWithFileName).mockResolvedValue({
      blob: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      fileName: 'INV-2026-000241.pdf',
    });

    render(<SettlementPage />);
    await loadFolio(user);

    const settleButton = await screen.findByRole('button', { name: /^Tất toán$/i });
    await user.click(settleButton);
    await user.click(screen.getByRole('button', { name: /^Hủy$/i }));
    await user.click(settleButton);
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: /Xác nhận tất toán/i }),
    );

    await waitFor(() => {
      expect(settleFolio).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(settleFolio).mock.calls[0][2]).toBe('test-idempotency-key');
    expect(newIdempotencyKey).toHaveBeenCalledTimes(1);
  });

  it('shows the Vietnamese message for a 409 FOLIO_ALREADY_SETTLED error', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(getSettlementPreview).mockResolvedValue(makePreview());
    vi.mocked(settleFolio).mockRejectedValue({
      response: { status: 409, data: { message: 'FOLIO_ALREADY_SETTLED' } },
    });

    render(<SettlementPage />);
    await loadFolio(user);
    await user.click(await screen.findByRole('button', { name: /^Tất toán$/i }));

    const dialog = screen.getByRole('dialog', { name: /Xác nhận tất toán folio/i });
    await user.click(within(dialog).getByRole('button', { name: /Xác nhận tất toán/i }));

    expect(await within(dialog).findByText('Cabin đã tất toán')).toBeInTheDocument();
    expect(downloadInvoiceWithFileName).not.toHaveBeenCalled();
  });

  it('shows the empty state for a 404 folio lookup', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(getSettlementPreview).mockRejectedValue({
      response: { status: 404, data: { message: 'Folio not found' } },
    });

    render(<SettlementPage />);
    await loadFolio(user);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Không tìm thấy folio cho cabin này');
    expect(screen.queryByRole('button', { name: /^Tất toán$/i })).not.toBeInTheDocument();
  });
});
