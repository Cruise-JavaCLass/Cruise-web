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
});
