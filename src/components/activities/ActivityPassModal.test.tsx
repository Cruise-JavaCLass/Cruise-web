import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityPassModal } from './ActivityPassModal';
import {
  activityAttendanceService,
  type ActivityPassResponse,
} from '../../services/activityAttendanceService';

describe('ActivityPassModal Component Tests (KAN-323)', () => {
  const mockPass: ActivityPassResponse = {
    token: 'eyJhbGciOiJIUzI1NiJ9.test-token.signature',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    activityId: 10,
    activityTitle: 'Dạ tiệc Khiêu vũ & Gala Âm nhạc',
    category: 'Âm nhạc & Khiêu vũ',
    venue: 'Venetian Ballroom',
    location: 'Venetian Ballroom (Deck 4 & 5)',
    deck: 'Deck 4 & 5',
    startTime: '20:00',
    endTime: '22:30',
    passengerId: 101,
    passengerName: 'Nguyễn Văn Minh',
    cabinNumber: '402',
    rfidTag: 'RFID-MINH-402',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('không render nội dung gì khi isOpen = false', () => {
    const { container } = render(
      <ActivityPassModal
        isOpen={false}
        onClose={vi.fn()}
        activityId={10}
        passengerId={101}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('tải và hiển thị thông tin thẻ tham gia hoạt động khi isOpen = true', async () => {
    vi.spyOn(activityAttendanceService, 'getActivityPass').mockResolvedValueOnce(mockPass);

    render(
      <ActivityPassModal
        isOpen={true}
        onClose={vi.fn()}
        activityId={10}
        passengerId={101}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thẻ Tham Gia Hoạt Động')).toBeInTheDocument();
      expect(screen.getByText('Dạ tiệc Khiêu vũ & Gala Âm nhạc')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
      expect(screen.getByText('402')).toBeInTheDocument();
      expect(screen.getByText('RFID-MINH-402')).toBeInTheDocument();
      expect(screen.getByText('Venetian Ballroom')).toBeInTheDocument();
      expect(screen.getByText(/20:00 - 22:30/)).toBeInTheDocument();
    });

    // Check SVG QR code presence
    const qrElement = screen.getByRole('img', { name: /Mã QR cho Nguyễn Văn Minh/i });
    expect(qrElement).toBeInTheDocument();
  });

  it('cho phép bấm nút Làm mới mã ngay để fetch lại vé mới', async () => {
    const spy = vi
      .spyOn(activityAttendanceService, 'getActivityPass')
      .mockResolvedValue(mockPass);

    render(
      <ActivityPassModal
        isOpen={true}
        onClose={vi.fn()}
        activityId={10}
        passengerId={101}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Dạ tiệc Khiêu vũ & Gala Âm nhạc')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole('button', { name: /Làm mới mã ngay/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  it('gọi hàm onClose khi bấm nút đóng hoặc nút Đóng', async () => {
    vi.spyOn(activityAttendanceService, 'getActivityPass').mockResolvedValueOnce(mockPass);
    const onCloseMock = vi.fn();

    render(
      <ActivityPassModal
        isOpen={true}
        onClose={onCloseMock}
        activityId={10}
        passengerId={101}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Thẻ Tham Gia Hoạt Động')).toBeInTheDocument();
    });

    const closeHeaderBtn = screen.getByRole('button', { name: /Đóng thẻ/i });
    fireEvent.click(closeHeaderBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);

    const closeFooterBtn = screen.getByRole('button', { name: /^Đóng$/i });
    fireEvent.click(closeFooterBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(2);
  });

  it('hiển thị thông báo lỗi khi API trả về lỗi', async () => {
    vi.spyOn(activityAttendanceService, 'getActivityPass').mockRejectedValueOnce(
      new Error('Mạng vệ tinh gián đoạn')
    );

    render(
      <ActivityPassModal
        isOpen={true}
        onClose={vi.fn()}
        activityId={10}
        passengerId={101}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Lỗi tải thẻ tham gia')).toBeInTheDocument();
      expect(screen.getByText('Mạng vệ tinh gián đoạn')).toBeInTheDocument();
    });
  });
});
