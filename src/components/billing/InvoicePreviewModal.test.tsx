import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { InvoicePreviewModal } from './InvoicePreviewModal';

describe('InvoicePreviewModal', () => {
  const createObjectURL = vi.fn(() => 'blob:mock-invoice');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the PDF iframe and a download link for the object URL', () => {
    render(
      <InvoicePreviewModal
        open={true}
        blob={new Blob(['%PDF-1.7'], { type: 'application/pdf' })}
        fileName="INV-2026-000241.pdf"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTitle('Hoá đơn PDF')).toHaveAttribute('src', 'blob:mock-invoice');
    expect(screen.getByRole('link', { name: /Tải xuống/i })).toHaveAttribute(
      'download',
      'INV-2026-000241.pdf',
    );
    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('revokes the object URL when unmounted', () => {
    const { unmount } = render(
      <InvoicePreviewModal
        open={true}
        blob={new Blob(['%PDF-1.7'], { type: 'application/pdf' })}
        fileName="INV-2026-000241.pdf"
        onClose={vi.fn()}
      />,
    );

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-invoice');
  });

  it('renders nothing when closed', () => {
    render(
      <InvoicePreviewModal open={false} blob={null} fileName="" onClose={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
