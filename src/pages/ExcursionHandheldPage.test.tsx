import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ExcursionHandheldPage, ExcursionAttendanceEntry } from './ExcursionHandheldPage';
import { AdminAuthGuard } from '../components/auth/AdminAuthGuard';
import { authService } from '../services/authService';
import * as api from '../services/excursionService';

vi.mock('../services/excursionService', () => ({ fetchExcursions: vi.fn(), getAttendanceSummary: vi.fn(), checkInPassenger: vi.fn() }));
const excursions = [7, 9].map((id) => ({ id, title: `Tour ${id}`, code: `TOUR-${id}`, portName: 'Hạ Long', allAboardTime: '17:00', passengers: [
  { id: id * 10, passengerName: `Khách ${id}`, cabinNumber: '401', ticketCode: `EXC-${id}`, busNumber: 'BUS-1', status: 'REGISTERED' },
] })) as api.ShoreExcursion[];
const summary = (id: number) => ({ excursionId: id, totalRegistered: 1, totalCheckedIn: 0, totalOnTour: 0, totalReturnedSafe: 0, totalMissingReturn: 1 }) as api.AttendanceSummary;
const renderPage = (url = '/excursion-attendance/mobile') => render(<MemoryRouter initialEntries={[url]}><ExcursionHandheldPage /></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  vi.mocked(api.fetchExcursions).mockResolvedValue(excursions);
  vi.mocked(api.getAttendanceSummary).mockImplementation(async (id) => summary(id));
  vi.mocked(api.checkInPassenger).mockResolvedValue({ excursionPassengerId: 70, excursionId: 7, passengerName: 'Khách 7', cabinNumber: '401', ticketCode: 'EXC-7', previousStatus: 'REGISTERED', currentStatus: 'RETURNED_SAFE', message: 'Đã về tàu an toàn' });
});
afterEach(() => vi.restoreAllMocks());

describe('standalone handheld attendance', () => {
  it('uses an actual tour ID instead of assuming tour 1 and can search passengers', async () => {
    renderPage();
    expect(await screen.findByText('Khách 7')).toBeInTheDocument();
    expect(api.getAttendanceSummary).toHaveBeenCalledWith(7);
    fireEvent.change(screen.getByLabelText('Tìm khách hoặc xe'), { target: { value: 'not-found' } });
    expect(screen.getByText('Không có hành khách phù hợp.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  it('preserves the tour selected from the desktop link', async () => {
    renderPage('/excursion-attendance/mobile?excursionId=9');
    expect(await screen.findByText('Khách 9')).toBeInTheDocument();
    expect(api.getAttendanceSummary).toHaveBeenCalledWith(9);
  });
  it('changes tour without leaving an old summary or allowing scans during loading', async () => {
    renderPage(); await screen.findByText('Khách 7');
    let resolve!: (data: api.AttendanceSummary) => void;
    vi.mocked(api.getAttendanceSummary).mockImplementation((id) => id === 9 ? new Promise((done) => { resolve = done; }) : Promise.resolve(summary(id)));
    fireEvent.change(screen.getByLabelText('Tour đang điểm danh'), { target: { value: '9' } });
    expect(screen.getByRole('button', { name: 'Quét QR / Thẻ' })).toBeDisabled();
    await waitFor(() => expect(api.getAttendanceSummary).toHaveBeenCalledWith(9));
    await act(async () => resolve(summary(9)));
    expect(await screen.findByText('Khách 9')).toBeInTheDocument();
  });
  it('sends the selected return mode and refreshes only after server confirmation', async () => {
    renderPage(); await screen.findByText('Khách 7');
    fireEvent.click(screen.getByRole('button', { name: /Về tàu/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Quét QR / Thẻ' }));
    fireEvent.change(screen.getByLabelText('Mã điểm danh'), { target: { value: 'EXC-7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận Điểm Danh' }));
    expect((await screen.findAllByText('Đã về tàu an toàn')).length).toBeGreaterThan(0);
    expect(api.checkInPassenger).toHaveBeenCalledWith(7, { ticketCode: 'EXC-7', targetStatus: 'RETURNED_SAFE' });
    await waitFor(() => expect(api.fetchExcursions).toHaveBeenCalledTimes(2));
  });
  it('does not turn a confirmed write into failure when refreshing fails', async () => {
    renderPage(); await screen.findByText('Khách 7');
    // Keep the same tour while simulating the summary service going down.
    vi.mocked(api.getAttendanceSummary).mockRejectedValueOnce(new Error('Không tải được thống kê'));
    fireEvent.click(screen.getByRole('button', { name: 'Quét QR / Thẻ' }));
    fireEvent.change(screen.getByLabelText('Mã điểm danh'), { target: { value: 'EXC-7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận Điểm Danh' }));
    await waitFor(() => expect(api.checkInPassenger).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được thống kê');
    expect(screen.getAllByText('Đã về tàu an toàn').length).toBeGreaterThan(0);
    expect(api.checkInPassenger).toHaveBeenCalledTimes(1);
  });
  it('blocks scans offline and makes no mutation request', async () => {
    renderPage(); await screen.findByText('Khách 7');
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByRole('alert')).toHaveTextContent('Mất kết nối');
    expect(screen.getByRole('button', { name: 'Quét QR / Thẻ' })).toBeDisabled();
    expect(api.checkInPassenger).not.toHaveBeenCalled();
  });
  it('handles an empty tour list without calling attendance for a fabricated ID', async () => {
    vi.mocked(api.fetchExcursions).mockResolvedValue([]); renderPage();
    expect(await screen.findByText('Chưa có tour')).toBeInTheDocument();
    expect(api.getAttendanceSummary).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Quét QR / Thẻ' })).toBeDisabled();
  });
  it('does not silently switch a stale tour link to another tour', async () => {
    renderPage('/excursion-attendance/mobile?excursionId=999');
    expect(await screen.findByRole('alert')).toHaveTextContent('Tour đã chọn không còn trong danh sách');
    expect(api.getAttendanceSummary).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Quét QR / Thẻ' })).toBeDisabled();
  });
  it('shows load failures and enables explicit retry', async () => {
    vi.mocked(api.fetchExcursions).mockRejectedValueOnce(new Error('Không kết nối được máy chủ')); renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối');
    fireEvent.click(screen.getByText('Thử tải lại'));
    expect(await screen.findByText('Khách 7')).toBeInTheDocument();
  });
  it('keeps the handheld route behind the existing staff login guard', () => {
    vi.spyOn(authService, 'isStaff').mockReturnValue(false);
    render(<MemoryRouter initialEntries={['/excursion-attendance/mobile']}><Routes><Route element={<AdminAuthGuard />}><Route path="excursion-attendance/mobile" element={<ExcursionHandheldPage />} /></Route><Route path="login" element={<p>Đăng nhập trước</p>} /></Routes></MemoryRouter>);
    expect(screen.getByText('Đăng nhập trước')).toBeInTheDocument(); expect(api.fetchExcursions).not.toHaveBeenCalled();
  });
  it('automatically opens the handheld route on a phone viewport', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<MemoryRouter initialEntries={['/excursion-attendance']}><Routes><Route path="excursion-attendance" element={<ExcursionAttendanceEntry />} /><Route path="excursion-attendance/mobile" element={<p>Handheld route</p>} /></Routes></MemoryRouter>);
    expect(screen.getByText('Handheld route')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
