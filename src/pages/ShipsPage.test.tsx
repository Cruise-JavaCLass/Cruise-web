import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShipsPage } from './ShipsPage';

describe('ShipsPage Component Tests', () => {
  it('renders page header and initial cruise ships', async () => {
    render(<ShipsPage />);

    expect(screen.getByRole('heading', { level: 2, name: /Quản Lý Đội Tàu Du Lịch/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Tàu Mới/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Halong Grand Harmony')).toBeInTheDocument();
      expect(screen.getByText('Ocean Pearl Voyager')).toBeInTheDocument();
      expect(screen.getByText('Phu Quoc Princess')).toBeInTheDocument();
    });
  });

  it('filters ships list when typing in search box', async () => {
    const user = userEvent.setup();
    render(<ShipsPage />);

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm tàu du lịch/i });
    await user.type(searchInput, 'Phu Quoc');

    await waitFor(() => {
      expect(screen.getByText('Phu Quoc Princess')).toBeInTheDocument();
      expect(screen.queryByText('Halong Grand Harmony')).not.toBeInTheDocument();
      expect(screen.queryByText('Ocean Pearl Voyager')).not.toBeInTheDocument();
    });
  });

  it('opens Create Ship Form modal when clicking "+ Thêm Tàu Mới"', async () => {
    const user = userEvent.setup();
    render(<ShipsPage />);

    const addBtn = screen.getByRole('button', { name: /Thêm Tàu Mới/i });
    await user.click(addBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Thêm Tàu Du Lịch Mới/i })).toBeInTheDocument();
  });

  it('opens Edit Ship Form modal pre-filled when clicking "Sửa" on a ship', async () => {
    const user = userEvent.setup();
    render(<ShipsPage />);

    await waitFor(() => {
      expect(screen.getByText('Halong Grand Harmony')).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Chỉnh sửa Halong Grand Harmony/i });
    await user.click(editBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Chỉnh Sửa Thông Tin Tàu/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên du thuyền/i)).toHaveValue('Halong Grand Harmony');
    expect(screen.getByLabelText(/Mã định danh tàu/i)).toHaveValue('SHIP-001');
  });

  it('filters ships by status dropdown and displays empty state when none match', async () => {
    const user = userEvent.setup();
    render(<ShipsPage />);

    const statusFilter = screen.getByRole('combobox', { name: /Lọc theo trạng thái/i });
    await user.selectOptions(statusFilter, 'DOCKED');

    expect(screen.getByText('Phu Quoc Princess')).toBeInTheDocument();
    expect(screen.queryByText('Halong Grand Harmony')).not.toBeInTheDocument();

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm tàu du lịch/i });
    await user.type(searchInput, 'XYZ_NOT_FOUND');
    expect(screen.getByText(/Không tìm thấy tàu du lịch nào phù hợp/i)).toBeInTheDocument();
  });

  it('creates a new ship and shows success toast notification', async () => {
    const user = userEvent.setup();
    render(<ShipsPage />);

    await user.click(screen.getByRole('button', { name: /Thêm Tàu Mới/i }));

    await user.type(screen.getByLabelText(/Tên du thuyền/i), 'Sea Pearl Horizon');
    await user.type(screen.getByLabelText(/Mã định danh tàu/i), 'SHIP-SPH');
    await user.type(screen.getByLabelText(/Đơn vị khai thác/i), 'Pearl Cruises');
    await user.type(screen.getByLabelText(/Khách tối đa/i), '1000');
    await user.type(screen.getByLabelText(/Thủy thủ đoàn/i), '300');
    await user.type(screen.getByLabelText(/Tổng cabin/i), '500');
    await user.type(screen.getByLabelText(/Số tầng\/boong/i), '8');

    await user.click(screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i }));

    await waitFor(() => {
      expect(screen.getByText(/Đã tạo mới du thuyền Sea Pearl Horizon/i)).toBeInTheDocument();
      expect(screen.getByText('Sea Pearl Horizon')).toBeInTheDocument();
    });
  });

  it('edits a ship and allows closing modal with cancel button', async () => {
    const user = userEvent.setup();
    render(<ShipsPage />);

    await waitFor(() => expect(screen.getByText('Halong Grand Harmony')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa Halong Grand Harmony/i }));
    const nameInput = screen.getByLabelText(/Tên du thuyền/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Halong Grand Harmony VIP');
    await user.click(screen.getByRole('button', { name: /Lưu Thay Đổi/i }));

    await waitFor(() => {
      expect(screen.getByText(/Đã cập nhật thông tin tàu Halong Grand Harmony VIP/i)).toBeInTheDocument();
      expect(screen.getByText('Halong Grand Harmony VIP')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Thêm Tàu Mới/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Hủy bỏ/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

