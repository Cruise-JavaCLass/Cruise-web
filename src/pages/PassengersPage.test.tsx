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
    await waitFor(() => {
      expect(screen.getByText('Đỗ Quốc Bảo')).toBeInTheDocument();
      expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();
    });

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

  it('displays registration and check-in KPI summary cards correctly (KAN-152)', () => {
    render(<PassengersPage />);

    expect(screen.getByText('Tổng Đăng Ký')).toBeInTheDocument();
    expect(screen.getByText('Đã Xác Nhận')).toBeInTheDocument();
    expect(screen.getByText('Chờ Duyệt')).toBeInTheDocument();
    expect(screen.getByText('Đã Lên Tàu')).toBeInTheDocument();
  });

  it('updates registration status via row dropdown selector (KAN-152)', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const statusSelect = screen.getByRole('combobox', {
      name: /Đổi trạng thái đăng ký của Nguyễn Văn Minh/i,
    });
    expect(statusSelect).toBeInTheDocument();

    await user.selectOptions(statusSelect, 'CANCELLED');

    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('clears search input when clicking clear button (KAN-153)', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm hành khách/i });
    await user.type(searchInput, 'Minh');
    expect(searchInput).toHaveValue('Minh');

    const clearBtn = screen.getByRole('button', { name: /Xóa tìm kiếm/i });
    expect(clearBtn).toBeInTheDocument();
    await user.click(clearBtn);

    expect(searchInput).toHaveValue('');
    expect(await screen.findByText('Trần Thị Thu Thảo')).toBeInTheDocument();
  });

  it('resets all filters when clicking Đặt lại button (KAN-153)', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    // Select status filter
    const pendingBtn = screen.getByRole('button', { name: 'Chờ duyệt' });
    await user.click(pendingBtn);

    const searchInput = screen.getByRole('searchbox', { name: /Tìm kiếm hành khách/i });
    await user.type(searchInput, 'Phạm');

    const resetBtn = screen.getByRole('button', { name: /Đặt lại/i });
    expect(resetBtn).toBeInTheDocument();

    await user.click(resetBtn);

    expect(searchInput).toHaveValue('');
    expect(await screen.findByText('Nguyễn Văn Minh')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị Thu Thảo')).toBeInTheDocument();
  });

  it('switches tour and updates passenger list accordingly (KAN-154)', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const tourSelect = screen.getByRole('combobox', { name: /Chọn Tour/i });
    expect(tourSelect).toBeInTheDocument();

    // Select Tour 2 (CRUISE-HL-02)
    await user.selectOptions(tourSelect, '2');

    await waitFor(() => {
      // Tour 2 in initial data has passengers for tourId 2
      expect(screen.queryByText('Nguyễn Văn Minh')).not.toBeInTheDocument();
    });
  });

  it('triggers manual refresh when clicking RefreshCw button (KAN-154)', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const refreshBtn = screen.getByRole('button', { name: /Tải lại danh sách/i });
    expect(refreshBtn).toBeInTheDocument();

    await user.click(refreshBtn);

    expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
  });

  it('handles passenger registration modal success callback and refreshes list (KAN-154)', async () => {
    const user = userEvent.setup();
    render(<PassengersPage />);

    const registerBtn = screen.getByRole('button', { name: /Đăng Ký Khách/i });
    await user.click(registerBtn);

    // Modal is opened
    expect(screen.getByRole('heading', { level: 3, name: /Đăng Ký Hành Khách Mới/i })).toBeInTheDocument();

    // Fill form
    await user.type(screen.getByLabelText(/Họ và tên hành khách/i), 'Vũ Đình Trọng');
    await user.type(screen.getByLabelText(/Số cabin/i), '999');
    await user.type(screen.getByLabelText(/Mã thẻ RFID/i), 'RFID-99999');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Lưu Hành Khách/i });
    await user.click(submitBtn);

    // Toast alert should display success
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });
});
