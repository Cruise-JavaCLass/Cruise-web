import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { UsersPage } from './UsersPage';
import * as userService from '../services/userService';
import type { User } from '../services/userService';

vi.mock('../services/userService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/userService')>();
  return {
    ...actual,
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    setUserActive: vi.fn(),
  };
});

const users: User[] = [
  { id: 1, username: 'an.nguyen', fullName: 'An Nguyễn', email: 'an@cruise.vn', role: 'SYSTEM_ADMIN', active: true },
  { id: 2, username: 'binh.tran', fullName: 'Bình Trần', email: 'binh@cruise.vn', role: 'POS_STAFF', active: false },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>
  );
}

describe('UsersPage component tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders the header and users returned by the API', async () => {
    vi.mocked(userService.getUsers).mockResolvedValue(users);
    renderPage();

    expect(screen.getByRole('heading', { level: 2, name: /Quản Lý Người Dùng/i })).toBeInTheDocument();
    expect(await screen.findByText('An Nguyễn')).toBeInTheDocument();
    expect(screen.getByText('binh@cruise.vn')).toBeInTheDocument();
    expect(screen.getByText('Hoạt động')).toBeInTheDocument();
    expect(screen.getByText('Vô hiệu hóa')).toBeInTheDocument();
  });

  it('filters users by search term and by role', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getUsers).mockResolvedValue(users);
    renderPage();
    await screen.findByText('An Nguyễn');

    await user.type(screen.getByRole('searchbox', { name: /Tìm kiếm người dùng/i }), 'binh');
    expect(screen.queryByText('An Nguyễn')).not.toBeInTheDocument();
    expect(screen.getByText('Bình Trần')).toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.selectOptions(screen.getByLabelText(/Lọc theo vai trò/i), 'SYSTEM_ADMIN');
    expect(screen.getByText('An Nguyễn')).toBeInTheDocument();
    expect(screen.queryByText('Bình Trần')).not.toBeInTheDocument();
  });

  it('opens the create modal, and the edit modal pre-filled', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getUsers).mockResolvedValue(users);
    renderPage();
    await screen.findByText('An Nguyễn');

    await user.click(screen.getByRole('button', { name: /Thêm Người Dùng/i }));
    expect(screen.getByRole('heading', { name: /Thêm Người Dùng Mới/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hủy' }));

    await user.click(screen.getByRole('button', { name: /Chỉnh sửa An Nguyễn/i }));
    expect(screen.getByRole('heading', { name: /Chỉnh Sửa Người Dùng/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ và tên/i)).toHaveValue('An Nguyễn');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('an@cruise.vn');
  });

  it('deactivates an active account after confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getUsers).mockResolvedValue(users);
    vi.mocked(userService.setUserActive).mockResolvedValue({ ...users[0], active: false });
    renderPage();
    await screen.findByText('An Nguyễn');

    await user.click(screen.getByRole('button', { name: /Vô hiệu hóa An Nguyễn/i }));
    await user.click(screen.getByRole('button', { name: 'Vô hiệu hóa' }));

    await waitFor(() => expect(userService.setUserActive).toHaveBeenCalledWith(1, false));
    expect(await screen.findByRole('status')).toHaveTextContent(/Đã vô hiệu hóa tài khoản an.nguyen/);
  });
});

describe('UsersPage status modal error isolation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does not show a previous error when opening the modal for another user', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getUsers).mockResolvedValue(users);
    vi.mocked(userService.setUserActive).mockRejectedValue(new Error('Lỗi máy chủ'));
    renderPage();
    await screen.findByText('An Nguyễn');

    await user.click(screen.getByRole('button', { name: /Vô hiệu hóa An Nguyễn/i }));
    await user.click(screen.getByRole('button', { name: 'Vô hiệu hóa' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Lỗi máy chủ');

    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    await user.click(screen.getByRole('button', { name: /Kích hoạt Bình Trần/i }));

    expect(screen.queryByText('Lỗi máy chủ')).not.toBeInTheDocument();
  });
});

describe('UsersPage loading, empty and error states', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows a loading indicator while fetching', () => {
    vi.mocked(userService.getUsers).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(/Đang tải danh sách người dùng/);
  });

  it('shows an empty state when there are no users', async () => {
    vi.mocked(userService.getUsers).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/Chưa có người dùng nào/)).toBeInTheDocument();
  });

  it('shows an error state and recovers on retry', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getUsers)
      .mockRejectedValueOnce(new Error('Mất kết nối máy chủ'))
      .mockResolvedValueOnce(users);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối máy chủ');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('An Nguyễn')).toBeInTheDocument();
  });
});
