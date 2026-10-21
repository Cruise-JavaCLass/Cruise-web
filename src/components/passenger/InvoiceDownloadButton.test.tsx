import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { InvoiceDownloadButton } from './InvoiceDownloadButton';
import { downloadInvoiceWithFileName } from '../../services/settlementService';

vi.mock('../../services/settlementService', () => ({
  downloadInvoiceWithFileName: vi.fn(),
}));

describe('InvoiceDownloadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads the invoice for the cabin and exposes an accessible label', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(downloadInvoiceWithFileName).mockResolvedValue({
      blob: new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      fileName: 'INV-2026-000241.pdf',
    });

    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
    const revokeObjectURLMock = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    try {
      render(<InvoiceDownloadButton cabinNumber="CABIN-7012" invoiceNumber="INV-2026-000241" />);

      const button = screen.getByRole('button', {
        name: 'Tải hoá đơn PDF cho cabin CABIN-7012',
      });
      expect(button).toHaveTextContent(/INV-2026-000241/);

      await user.click(button);

      await waitFor(() => {
        expect(downloadInvoiceWithFileName).toHaveBeenCalledWith('CABIN-7012');
      });
      await waitFor(() => {
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/mock-url');
      });
      await waitFor(() => {
        expect(button).toBeEnabled();
      });
    } finally {
      clickSpy.mockRestore();
      vi.unstubAllGlobals();
    }
  });

  it('silently disables the button on a 403 response', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(downloadInvoiceWithFileName).mockRejectedValue({
      response: { status: 403 },
    });

    render(<InvoiceDownloadButton cabinNumber="CABIN-7012" />);

    const button = screen.getByRole('button', {
      name: 'Tải hoá đơn PDF cho cabin CABIN-7012',
    });
    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<InvoiceDownloadButton cabinNumber="CABIN-7012" disabled={true} />);

    expect(
      screen.getByRole('button', { name: 'Tải hoá đơn PDF cho cabin CABIN-7012' })
    ).toBeDisabled();
  });
});
