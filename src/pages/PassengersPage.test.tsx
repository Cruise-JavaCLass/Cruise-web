import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassengersPage } from './PassengersPage';

describe('PassengersPage (Component & User Interaction Tests)', () => {
  it('renders passenger table header and all initial passengers', () => {
    render(<PassengersPage />);

    expect(screen.getByRole('heading', { level: 2, name: /Danh Sách Hành Khách/i })).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Thu Thảo')).toBeInTheDocument();
    expect(screen.getByText('Lê Hoàng Nam')).toBeInTheDocument();
    expect(screen.getByText('Phạm Hồng Ánh')).toBeInTheDocument();
    expect(screen.getByText('Đỗ Quốc Bảo')).toBeInTheDocument();
  });

  it('filters passengers when user types in the search input', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm hành khách/i });

    // Type passenger name
    await user.type(searchInput, 'Nguyễn');

    expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    expect(screen.queryByText('Trần Thị Thu Thảo')).not.toBeInTheDocument();
    expect(screen.queryByText('Lê Hoàng Nam')).not.toBeInTheDocument();
  });

  it('filters passengers by cabin number or RFID code', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm hành khách/i });

    // Search by cabin number
    await user.type(searchInput, '718');
    expect(screen.getByText('Trần Thị Thu Thảo')).toBeInTheDocument();
    expect(screen.getByText('718 (Suite)')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();

    // Clear and search by RFID
    await user.clear(searchInput);
    await user.type(searchInput, 'RFID-88102');
    expect(screen.getByText('Lê Hoàng Nam')).toBeInTheDocument();
    expect(screen.queryByText('Trần Thị Thu Thảo')).not.toBeInTheDocument();
  });

  it('displays empty state message when no passengers match search query', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm hành khách/i });

    await user.type(searchInput, 'Không tồn tại 9999');

    expect(
      screen.getByText(/Không tìm thấy hành khách nào phù hợp với từ khóa/i)
    ).toBeInTheDocument();
  });

  it('restores full list when search query is cleared', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm hành khách/i });

    await user.type(searchInput, 'Bảo');
    expect(screen.getByText('Đỗ Quốc Bảo')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();

    await user.clear(searchInput);
    expect(await screen.findByText('Nguyễn Văn Minh')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Thu Thảo')).toBeInTheDocument();
    expect(screen.getByText('Đỗ Quốc Bảo')).toBeInTheDocument();
  });

  it('filters passengers by RegistrationStatus buttons', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    // Click 'Chờ duyệt'
    const pendingBtn = screen.getByRole('button', { name: 'Chờ duyệt' });
    await user.click(pendingBtn);

    await waitFor(() => {
      expect(screen.getByText('Phạm Hồng Ánh')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();
    });

    // Click 'Đã hủy'
    const cancelledBtn = screen.getByRole('button', { name: 'Đã hủy' });
    await user.click(cancelledBtn);

    await waitFor(() => {
      expect(screen.getByText('Đỗ Quốc Bảo')).toBeInTheDocument();
      expect(screen.queryByText('Phạm Hồng Ánh')).not.toBeInTheDocument();
    });

    // Click 'Tất cả'
    const allBtn = screen.getByRole('button', { name: 'Tất cả' });
    await user.click(allBtn);

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
      expect(screen.getByText('Phạm Hồng Ánh')).toBeInTheDocument();
    });
  });

  it('opens Register Passenger modal when clicking Đăng Ký Khách', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const openModalBtn = screen.getByRole('button', { name: /Đăng Ký Khách/i });
    await user.click(openModalBtn);

    expect(screen.getByRole('heading', { level: 3, name: /Đăng Ký Hành Khách Mới/i })).toBeInTheDocument();
  });

  it('toggles check-in status when clicking check-in button', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const checkInBtns = screen.getAllByRole('button', { name: /Đã lên tàu|Chưa check-in/i });
    expect(checkInBtns.length).toBeGreaterThan(0);

    // Click on the first check-in button (Nguyễn Văn Minh - Đã lên tàu)
    await user.click(checkInBtns[0]);

    // Toast appears
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('triggers CSV export when clicking Xuất CSV button', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const exportBtn = screen.getByRole('button', { name: /Xuất CSV/i });
    await user.click(exportBtn);

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(createObjectURLMock).toHaveBeenCalled();
  });
});
