import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityFormModal } from './ActivityFormModal';
import type { DailyActivityItem } from '../../services/dailyItineraryService';

describe('ActivityFormModal Component Tests (KAN-121)', () => {
  const sampleActivity: DailyActivityItem = {
    id: 501,
    time: '14:30',
    title: 'Hội thảo Rượu Vang Hoàng Gia',
    location: 'Tầng 5 - Sunset Lounge',
    category: 'DINING',
    isIncluded: false,
    price: 450000,
    currency: 'VND',
    capacity: 50,
    enrolledCount: 20,
    description: 'Thử nếm rượu cùng sommelier',
  };

  it('renders correctly in Create mode with default fields and validates required inputs', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ActivityFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        dayNumber={2}
        dayTitle="Hải trình trên vịnh"
      />
    );

    expect(screen.getByText('Thêm Hoạt Động Vào Lịch Trình')).toBeInTheDocument();
    expect(screen.getByText(/Ngày 2: Hải trình trên vịnh/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Vui lòng nhập tên hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập vị trí/địa điểm')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates price when activity is marked as not included (fee required)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ActivityFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        dayNumber={1}
        dayTitle="Khởi hành"
      />
    );

    const titleInput = screen.getByPlaceholderText(/Gala Dinner Thuyền Trưởng/i);
    const locationInput = screen.getByPlaceholderText(/Tầng 7 - Grand Ballroom/i);
    fireEvent.change(titleInput, { target: { value: 'Tour Thuyền Kayak Hang Luồn' } });
    fireEvent.change(locationInput, { target: { value: 'Cầu tàu tầng 1' } });

    // Uncheck "isIncluded"
    const includedCheckbox = screen.getByRole('checkbox');
    fireEvent.click(includedCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Thêm Vào Lịch Trình/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Vui lòng nhập mức phí dịch vụ phát sinh (> 0)')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    // Fill valid price and submit
    const priceInput = screen.getByPlaceholderText('Vd: 350000');
    fireEvent.change(priceInput, { target: { value: '250000' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Tour Thuyền Kayak Hang Luồn',
          location: 'Cầu tàu tầng 1',
          isIncluded: false,
          price: 250000,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('populates initial data in Edit mode and submits updated activity', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ActivityFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        dayNumber={2}
        dayTitle="Hải trình trên vịnh"
        initialData={sampleActivity}
      />
    );

    expect(screen.getByText('Cập Nhật Hoạt Động Lịch Trình')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hội thảo Rượu Vang Hoàng Gia')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tầng 5 - Sunset Lounge')).toBeInTheDocument();
    expect(screen.getByDisplayValue('14:30')).toBeInTheDocument();

    const titleInput = screen.getByDisplayValue('Hội thảo Rượu Vang Hoàng Gia');
    fireEvent.change(titleInput, { target: { value: 'Hội thảo Rượu Vang Pháp & Phô Mai' } });

    const saveBtn = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Hội thảo Rượu Vang Pháp & Phô Mai',
          location: 'Tầng 5 - Sunset Lounge',
          time: '14:30',
          price: 450000,
        })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('closes modal when clicking close or cancel buttons', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ActivityFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        dayNumber={1}
        dayTitle="Khởi hành"
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Hủy/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeIconBtn = screen.getByLabelText(/Đóng/i);
    fireEvent.click(closeIconBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
