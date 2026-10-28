import { describe, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityModal } from './ActivityModal';

describe('Activity Form Validation Tests (KAN-142)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Required Field Validations', () => {
    const requiredFieldCases = [
      {
        field: 'title',
        label: /Tên hoạt động/i,
        val: '   ',
        expectedError: 'Tên hoạt động không được để trống',
      },
      {
        field: 'location',
        label: /Địa điểm tổ chức/i,
        val: '   ',
        setup: async (user: ReturnType<typeof userEvent.setup>) => {
          await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');
        },
        expectedError: 'Địa điểm tổ chức không được để trống',
      },
      {
        field: 'activityDate',
        label: /Ngày diễn ra/i,
        val: '',
        setup: async (user: ReturnType<typeof userEvent.setup>) => {
          await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');
          await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hát');
        },
        expectedError: 'Ngày tổ chức không được để trống',
      },
      {
        field: 'startTime',
        label: /Giờ bắt đầu/i,
        val: '',
        setup: async (user: ReturnType<typeof userEvent.setup>) => {
          await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');
          await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hát');
        },
        expectedError: 'Thời gian bắt đầu không được để trống',
      },
      {
        field: 'endTime',
        label: /Giờ kết thúc/i,
        val: '',
        setup: async (user: ReturnType<typeof userEvent.setup>) => {
          await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Trình Diễn Ảo Thuật');
          await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hát');
        },
        expectedError: 'Thời gian kết thúc không được để trống',
      },
    ];

    it.each(requiredFieldCases)(
      'shows error when $field is invalid or missing',
      async ({ label, val, setup, expectedError }) => {
        const user = userEvent.setup();
        const handleSuccess = vi.fn();

        render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={handleSuccess} />);

        if (setup) {
          await setup(user);
        }

        const input = screen.getByLabelText(label);
        await user.clear(input);
        if (val) {
          await user.type(input, val);
        }

        await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

        expect(screen.getByText(expectedError)).toBeInTheDocument();
        expect(handleSuccess).not.toHaveBeenCalled();
      }
    );
  });

  describe('Business Rule Validations', () => {
    it.each([
      {
        scenario: 'end time equals start time',
        start: '20:00',
        end: '20:00',
      },
      {
        scenario: 'end time precedes start time',
        start: '21:30',
        end: '20:00',
      },
    ])('validates timing: $scenario', async ({ start, end }) => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Xem Phim Dưới Sao');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Boong Chiếu Phim');

      const startTimeInput = screen.getByLabelText(/Giờ bắt đầu/i);
      await user.clear(startTimeInput);
      await user.type(startTimeInput, start);

      const endTimeInput = screen.getByLabelText(/Giờ kết thúc/i);
      await user.clear(endTimeInput);
      await user.type(endTimeInput, end);

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Thời gian kết thúc phải sau thời gian bắt đầu')).toBeInTheDocument();
    });

    it('validates capacity: capacity must be greater than zero', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Bắn Cung');
      await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Sân Boong');

      const capacityInput = screen.getByLabelText(/Sức chứa tối đa/i);
      await user.clear(capacityInput);
      await user.type(capacityInput, '0');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

      expect(screen.getByText('Sức chứa tối đa phải lớn hơn 0')).toBeInTheDocument();
    });

    it('validates pricing: paid activity requires price > 0 or 0 when included', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      // Switch to paid
      const includedCheckbox = screen.getByLabelText(/Bao gồm trong tour/i);
      await user.click(includedCheckbox);

      const priceInput = screen.getByLabelText(/Mức phí tham gia/i);
      await user.clear(priceInput);
      await user.type(priceInput, '0');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));
      expect(screen.getByText('Hoạt động trả phí phải có mức giá lớn hơn 0')).toBeInTheDocument();

      // Check again to make it free
      await user.click(includedCheckbox);
      expect(screen.queryByText('Hoạt động trả phí phải có mức giá lớn hơn 0')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Error Clearing on User Input', () => {
    it.each([
      {
        field: 'title',
        inputLabel: /Tên hoạt động/i,
        val: 'Đêm Nhạc Acoustic',
        errorMessage: 'Tên hoạt động không được để trống',
      },
      {
        field: 'location',
        inputLabel: /Địa điểm tổ chức/i,
        val: 'Sảnh Hoàng Gia',
        errorMessage: 'Địa điểm tổ chức không được để trống',
      },
    ])('clears $field error when typing into input', async ({ inputLabel, val, errorMessage }) => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));
      expect(screen.getByText(errorMessage)).toBeInTheDocument();

      await user.type(screen.getByLabelText(inputLabel), val);
      expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
    });

    it('clears timing error when valid end time is selected', async () => {
      const user = userEvent.setup();

      render(<ActivityModal isOpen={true} onClose={vi.fn()} onSuccess={vi.fn()} />);

      const startTimeInput = screen.getByLabelText(/Giờ bắt đầu/i);
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '15:00');

      const endTimeInput = screen.getByLabelText(/Giờ kết thúc/i);
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '14:00');

      await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));
      expect(screen.getByText('Thời gian kết thúc phải sau thời gian bắt đầu')).toBeInTheDocument();

      await user.clear(endTimeInput);
      await user.type(endTimeInput, '16:00');
      expect(screen.queryByText('Thời gian kết thúc phải sau thời gian bắt đầu')).not.toBeInTheDocument();
    });
  });
});
