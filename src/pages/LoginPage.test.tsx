import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { authService } from '../services/authService';

describe('LoginPage Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders login header, inputs, and quick-fill demo buttons', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('CRUISE MANAGER')).toBeInTheDocument();
    expect(screen.getByText(/FLEET OPERATIONS & CREW CONSOLE/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên đăng nhập/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu xác thực')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Admin Toàn Quyền/i })).toBeInTheDocument();
  });

  it('auto-fills credentials when clicking Admin Toàn Quyền quick-fill button', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const adminChip = screen.getByRole('button', { name: /Admin Toàn Quyền/i });
    await user.click(adminChip);

    expect(screen.getByLabelText(/Tên đăng nhập/i)).toHaveValue('admin');
    expect(screen.getByLabelText('Mật khẩu xác thực')).toHaveValue('admin123');
  });

  it('shows error message when submitting invalid credentials', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/Tên đăng nhập/i), 'invalid-user');
    await user.type(screen.getByLabelText('Mật khẩu xác thực'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Tên đăng nhập hoặc mật khẩu không chính xác/i);
    });
  });

  it('successfully logs in and creates session with valid admin credentials', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /Admin Toàn Quyền/i }));
    await user.click(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i }));

    await waitFor(() => {
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()?.username).toBe('admin');
    });
  });
});
