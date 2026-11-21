import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QrScannerModal } from './QrScannerModal';
import * as scanner from '../../services/excursionScanner';

vi.mock('../../services/excursionScanner', async (load) => ({ ...await load<typeof scanner>(), startQrCamera: vi.fn(), startNfcReader: vi.fn(), supportsNfc: () => false }));
const result = { excursionPassengerId: 42, excursionId: 7, passengerName: 'Nguyễn An', cabinNumber: '401', ticketCode: 'EXC-42', previousStatus: 'REGISTERED', currentStatus: 'CHECKED_IN', message: 'Đã xác nhận' };
const props = () => ({ isOpen: true, onClose: vi.fn(), onScanSubmit: vi.fn().mockResolvedValue(result), targetStatus: 'CHECKED_IN' as const });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(scanner.startQrCamera).mockResolvedValue({ stop: vi.fn() }); });

describe('excursion scanner interactions', () => {
  it('disables unsupported NFC and keeps manual RFID/external reader input usable', async () => {
    const p = props(); render(<QrScannerModal {...p} />);
    expect(screen.getByRole('button', { name: 'Chạm thẻ NFC' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Loại mã điểm danh'), { target: { value: 'RFID' } });
    fireEvent.change(screen.getByLabelText('Mã điểm danh'), { target: { value: ' 04:aa:bb ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Xác nhận Điểm Danh' }).closest('form')!);
    await waitFor(() => expect(p.onScanSubmit).toHaveBeenCalledWith({ rfidTag: '04:aa:bb', targetStatus: 'CHECKED_IN' }));
  });
  it('submits only once for repeated frames and aborts the camera before the API call', async () => {
    const p = props(); render(<QrScannerModal {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mở camera QR' }));
    const [, callback, signal] = vi.mocked(scanner.startQrCamera).mock.calls[0];
    await act(async () => { callback('EXC-42'); callback('EXC-42'); });
    expect(signal.aborted).toBe(true); expect(p.onScanSubmit).toHaveBeenCalledTimes(1);
    expect(p.onScanSubmit).toHaveBeenCalledWith({ ticketCode: 'EXC-42', targetStatus: 'CHECKED_IN' });
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
  });
  it('shows server failure without a success message and permits an explicit retry', async () => {
    const p = props(); p.onScanSubmit.mockRejectedValueOnce(new Error('Không tìm thấy vé'));
    render(<QrScannerModal {...p} />);
    fireEvent.change(screen.getByLabelText('Mã điểm danh'), { target: { value: 'unknown' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận Điểm Danh' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy vé');
    expect(screen.queryByText('Đã xác nhận')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận Điểm Danh' }));
    expect(await screen.findByText('Đã xác nhận')).toBeInTheDocument();
  });
  it('explains permission denial and still allows typing', async () => {
    vi.mocked(scanner.startQrCamera).mockRejectedValue(new DOMException('denied', 'NotAllowedError'));
    render(<QrScannerModal {...props()} />); fireEvent.click(screen.getByText('Mở camera QR'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa được cấp quyền');
    expect(screen.getByLabelText('Mã điểm danh')).toBeEnabled();
  });
  it('aborts when closed and starts a clean session on reopening', () => {
    const p = props(); const view = render(<QrScannerModal {...p} />);
    fireEvent.click(screen.getByText('Mở camera QR'));
    const signal = vi.mocked(scanner.startQrCamera).mock.calls[0][2];
    fireEvent.change(screen.getByLabelText('Mã điểm danh'), { target: { value: 'old' } });
    view.rerender(<QrScannerModal {...p} isOpen={false} />); expect(signal.aborted).toBe(true);
    view.rerender(<QrScannerModal {...p} />); expect(screen.getByLabelText('Mã điểm danh')).toHaveValue('');
  });
  it('stops reading on page hide or loss of network', () => {
    const view = render(<QrScannerModal {...props()} />); fireEvent.click(screen.getByText('Mở camera QR'));
    const signal = vi.mocked(scanner.startQrCamera).mock.calls[0][2];
    act(() => window.dispatchEvent(new Event('offline'))); expect(signal.aborted).toBe(true);
    view.unmount();
  });
});
