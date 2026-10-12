import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityModal } from './ActivityModal';
import * as activityService from '../../services/activityService';

const mockActivityToEdit: activityService.OnboardActivity = {
  id: 101,
  tourId: 1,
  dayNumber: 2,
  title: 'Thưởng Thức Trà Chiều Hoàng Gia',
  category: 'Dining & Dạ Tiệc',
  location: 'Tầng 10 - Grand Lounge',
  activityDate: '2026-11-02',
  startTime: '15:00',
  endTime: '16:30',
  maxCapacity: 25,
  currentParticipants: 10,
  price: 150000,
  isIncluded: false,
  status: 'SCHEDULED',
  description: 'Trà chiều kiểu Anh và bánh ngọt thủ công',
  active: true,
};

describe('ActivityModal Component Tests (KAN-140)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ActivityModal
        isOpen={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly in Create mode with default values', () => {
    render(
      <ActivityModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Tạo Hoạt Động Du Thuyền Mới/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tạo Mới/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/Tên hoạt động/i)).toHaveValue('');
    expect(screen.getByLabelText(/Địa điểm tổ chức/i)).toHaveValue('');
    expect(screen.getByLabelText(/Danh mục/i)).toHaveValue('Wellness & Sức Khỏe');
    expect(screen.getByLabelText(/Ngày số trong Tour/i)).toHaveValue(1);
    expect(screen.getByLabelText(/Sức chứa tối đa/i)).toHaveValue(30);
    expect(screen.getByLabelText(/Bao gồm trong tour/i)).toBeChecked();
  });

  it('renders correctly in Edit mode pre-filled with activity data', () => {
    render(
      <ActivityModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        activityToEdit={mockActivityToEdit}
      />
    );

    expect(screen.getByRole('heading', { name: /Cập Nhật Hoạt Động Du Thuyền/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cập Nhật/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/Tên hoạt động/i)).toHaveValue('Thưởng Thức Trà Chiều Hoàng Gia');
    expect(screen.getByLabelText(/Địa điểm tổ chức/i)).toHaveValue('Tầng 10 - Grand Lounge');
    expect(screen.getByLabelText(/Danh mục/i)).toHaveValue('Dining & Dạ Tiệc');
    expect(screen.getByLabelText(/Ngày số trong Tour/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Sức chứa tối đa/i)).toHaveValue(25);
    expect(screen.getByLabelText(/Bao gồm trong tour/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Mức phí tham gia/i)).toHaveValue(150000);
    expect(screen.getByLabelText(/Mô tả chi tiết/i)).toHaveValue('Trà chiều kiểu Anh và bánh ngọt thủ công');
  });

  it('shows validation errors when submitting empty form in Create mode', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();

    render(
      <ActivityModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    // Click submit right away with empty title and location
    await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

    expect(screen.getByText('Tên hoạt động không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Địa điểm tổ chức không được để trống')).toBeInTheDocument();
    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('validates business rule: end time must be after start time', async () => {
    const user = userEvent.setup();

    render(
      <ActivityModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Buổi Hòa Nhạc');
    await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Nhà Hát');

    // Set end time earlier than start time
    await user.clear(screen.getByLabelText(/Giờ bắt đầu/i));
    await user.type(screen.getByLabelText(/Giờ bắt đầu/i), '14:00');
    await user.clear(screen.getByLabelText(/Giờ kết thúc/i));
    await user.type(screen.getByLabelText(/Giờ kết thúc/i), '13:00');

    await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

    expect(screen.getByText('Thời gian kết thúc phải sau thời gian bắt đầu')).toBeInTheDocument();
  });

  it('validates business rule: paid activity must have price > 0', async () => {
    const user = userEvent.setup();

    render(
      <ActivityModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Tour Lặn Biển');
    await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Boong Lặn');

    // Uncheck "Bao gồm trong tour" to make it paid
    const checkbox = screen.getByLabelText(/Bao gồm trong tour/i);
    await user.click(checkbox);

    // Set price to 0
    const priceInput = screen.getByLabelText(/Mức phí tham gia/i);
    await user.clear(priceInput);
    await user.type(priceInput, '0');

    await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

    expect(screen.getByText('Hoạt động trả phí phải có mức giá lớn hơn 0')).toBeInTheDocument();
  });

  it('successfully creates an activity and invokes onSuccess & onClose', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const createdMock: activityService.OnboardActivity = {
      id: 202,
      tourId: 1,
      dayNumber: 1,
      title: 'Học Pha Chế Cocktail',
      category: 'Culinary & Ẩm Thực',
      location: 'Tầng 8 - Skyline Bar',
      activityDate: '2026-11-01',
      startTime: '16:00',
      endTime: '17:30',
      maxCapacity: 20,
      currentParticipants: 0,
      price: 0,
      isIncluded: true,
      status: 'SCHEDULED',
      active: true,
    };

    const spyCreate = vi.spyOn(activityService, 'createActivity').mockResolvedValueOnce(createdMock);

    render(
      <ActivityModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        defaultTourId={1}
      />
    );

    await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Học Pha Chế Cocktail');
    await user.selectOptions(screen.getByLabelText(/Danh mục/i), 'Culinary & Ẩm Thực');
    await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Tầng 8 - Skyline Bar');

    await user.clear(screen.getByLabelText(/Giờ bắt đầu/i));
    await user.type(screen.getByLabelText(/Giờ bắt đầu/i), '16:00');
    await user.clear(screen.getByLabelText(/Giờ kết thúc/i));
    await user.type(screen.getByLabelText(/Giờ kết thúc/i), '17:30');

    await user.clear(screen.getByLabelText(/Sức chứa tối đa/i));
    await user.type(screen.getByLabelText(/Sức chứa tối đa/i), '20');

    await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

    await waitFor(() => {
      expect(spyCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          tourId: 1,
          title: 'Học Pha Chế Cocktail',
          category: 'Culinary & Ẩm Thực',
          location: 'Tầng 8 - Skyline Bar',
          startTime: '16:00',
          endTime: '17:30',
          maxCapacity: 20,
          isIncluded: true,
          price: 0,
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(createdMock);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('successfully updates an existing activity in Edit mode', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const updatedMock: activityService.OnboardActivity = {
      ...mockActivityToEdit,
      title: 'Thưởng Thức Trà Chiều Cung Đình',
      maxCapacity: 40,
    };

    const spyUpdate = vi.spyOn(activityService, 'updateActivity').mockResolvedValueOnce(updatedMock);

    render(
      <ActivityModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
        activityToEdit={mockActivityToEdit}
      />
    );

    const titleInput = screen.getByLabelText(/Tên hoạt động/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Thưởng Thức Trà Chiều Cung Đình');

    const capacityInput = screen.getByLabelText(/Sức chứa tối đa/i);
    await user.clear(capacityInput);
    await user.type(capacityInput, '40');

    await user.click(screen.getByRole('button', { name: /Cập Nhật/i }));

    await waitFor(() => {
      expect(spyUpdate).toHaveBeenCalledWith(
        mockActivityToEdit.id,
        expect.objectContaining({
          title: 'Thưởng Thức Trà Chiều Cung Đình',
          maxCapacity: 40,
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(updatedMock);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully on save failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityService, 'createActivity').mockRejectedValueOnce(
      new Error('Máy chủ đang bảo trì, vui lòng thử lại sau.')
    );

    render(
      <ActivityModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText(/Tên hoạt động/i), 'Hoạt Động Thử Nghiệm');
    await user.type(screen.getByLabelText(/Địa điểm tổ chức/i), 'Sân Boong');

    await user.click(screen.getByRole('button', { name: /Tạo Mới/i }));

    await waitFor(() => {
      expect(screen.getByText('Máy chủ đang bảo trì, vui lòng thử lại sau.')).toBeInTheDocument();
    });
  });

  it('closes when clicking close or cancel button', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ActivityModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Hủy bỏ/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
