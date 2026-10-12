import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityModal } from './ActivityModal';
import * as activityService from '../../services/activityService';

describe('Activity Form Validation Tests (KAN-142)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Required Field Validations', () => {
    it('shows error when activity title is empty or only whitespace', async () => {
      const user = userEvent.setup();
      const handleSuccess = vi.fn();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={handleSuccess} />);

      const titleInput = screen.getByLabelText(/Tên hoạt động/i);
      await user.clear(titleInput);
      await user.type(titleInput, '   ');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Tên hoạt động không được để trống')).toBeInTheDocument();
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('shows error when location is empty or only whitespace', async () => {
      const user = userEvent.setup();
      const handleSuccess = vi.fn();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={handleSuccess} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');

      const locationInput = screen.getByLabelText(/Địa điểm tổ chức/i);
      await user.clear(locationInput);
      await user.type(locationInput, '   ');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Địa điểm tổ chức không được để trống')).toBeInTheDocument();
      expect(handleSuccess).not.toHaveBeenCalled();
    });

    it('shows error when activity date is missing', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hát');

      const dateInput = screen.getByLabelText(/Ngày diễn ra/i);
      await user.clear(dateInput);

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Ngày tổ chức không được để trống')).toBeInTheDocument();
    });

    it('shows error when start time is missing', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hát');

      const startTimeInput = screen.getByLabelText(/Giờ bắt đầu/i);
      await user.clear(startTimeInput);

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Thời gian bắt đầu không được để trống')).toBeInTheDocument();
    });

    it('shows error when end time is missing', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hát');

      const endTimeInput = screen.getByLabelText(/Giờ kết thúc/i);
      await user.clear(endTimeInput);

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Thời gian kết thúc không được để trống')).toBeInTheDocument();
    });
  });

  describe('Business Rule Validations', () => {
    it('validates timing: end time must not be equal to start time', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Xem Phim Dưới Sao');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Boong Chiếu Phim');

      const startTimeInput = screen.getByLabelText(/Giờ bắt đầu/i);
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '20:00');

      const endTimeInput = screen.getByLabelText(/Giờ kết thúc/i);
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '20:00');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Thời gian kết thúc phải sau thời gian bắt đầu')).toBeInTheDocument();
    });

    it('validates timing: end time must not precede start time', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Xem Phim Dưới Sao');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Boong Chiếu Phim');

      const startTimeInput = screen.getByLabelText(/Giờ bắt đầu/i);
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '21:30');

      const endTimeInput = screen.getByLabelText(/Giờ kết thúc/i);
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '20:00');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Thời gian kết thúc phải sau thời gian bắt đầu')).toBeInTheDocument();
    });

    it('validates capacity: capacity must be greater than zero', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trò Chơi Bắn Cung');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Boong Thể Thao');

      const capacityInput = screen.getByLabelText(/Sức chứa tối đa/i);
      await user.clear(capacityInput);
      await user.type(capacityInput, '0');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Sức chứa tối đa phải lớn hơn 0')).toBeInTheDocument();
    });

    it('validates pricing: paid activity cannot have zero price', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Bữa Tối Lãng Mạn');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hàng VIP');

      // Make activity paid
      await user.click(screen.getByLabelText(/Bao gồm trong tour/i));

      const priceInput = screen.getByLabelText(/Mức phí tham gia/i);
      await user.clear(priceInput);
      await user.type(priceInput, '0');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Hoạt động trả phí phải có mức giá lớn hơn 0')).toBeInTheDocument();
    });

    it('allows price 0 when activity is included in tour package', async () => {
      const user = userEvent.setup();
      const spyCreate = vi.spyOn(activityService, 'createActivity').mockResolvedValueOnce({
        id: 999,
        tourId: 1,
        dayNumber: 1,
        title: 'Hoạt Động Miễn Phí',
        category: 'Wellness & Sức Khỏe',
        location: 'Khu Spa',
        activityDate: '2026-11-01',
        startTime: '09:00',
        endTime: '10:00',
        maxCapacity: 15,
        currentParticipants: 0,
        price: 0,
        isIncluded: true,
        status: 'SCHEDULED',
        active: true,
      });

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Hoạt Động Miễn Phí');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Khu Spa');

      // isIncluded is checked by default
      expect(screen.getByLabelText(/Bao gồm trong tour/i)).toBeChecked();

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      await waitFor(() => {
        expect(spyCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            isIncluded: true,
            price: 0,
          })
        );
      });
    });
  });

  describe('Real-time Error Clearing on User Input', () => {
    it('clears title validation error when user begins typing', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      // Trigger empty validation error
      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));
      expect(screen.getByText('Tên hoạt động không được để trống')).toBeInTheDocument();

      // Type title
      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Đêm Nhạc Jazz');

      // Error message should disappear
      expect(screen.queryByText('Tên hoạt động không được để trống')).not.toBeInTheDocument();
    });

    it('clears location validation error when user types into location input', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));
      expect(screen.getByText('Địa điểm tổ chức không được để trống')).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Phòng Hòa Nhạc');

      expect(screen.queryByText('Địa điểm tổ chức không được để trống')).not.toBeInTheDocument();
    });

    it('clears end time validation error when valid end time is selected', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Yoga Chiều');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Sân Thượng');

      const startTimeInput = screen.getByLabelText(/Giờ bắt đầu/i);
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '17:00');

      const endTimeInput = screen.getByLabelText(/Giờ kết thúc/i);
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '16:00');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));
      expect(screen.getByText('Thời gian kết thúc phải sau thời gian bắt đầu')).toBeInTheDocument();

      // Change end time to valid time
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '18:30');

      expect(screen.queryByText('Thời gian kết thúc phải sau thời gian bắt đầu')).not.toBeInTheDocument();
    });
  });
});
