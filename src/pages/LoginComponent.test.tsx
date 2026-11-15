// KAN-84: Write Login Component Tests
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { authService, type AuthUser } from '../services/authService';

const adminUser: AuthUser = {
  id: 1,
  username: 'admin',
  fullName: 'Admin Test',
  role: 'SYSTEM_ADMIN',
};

function renderLogin(entry = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/pos" element={<div>POS Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const usernameInput = () => screen.getByLabelText(/Tên đăng nhập/i);
const passwordInput = () => screen.getByLabelText('Mật khẩu xác thực');
const submitButton = () => screen.getByRole('button', { name: /Đăng nhập Vận Hành/i });

describe('KAN-84 Write Login Component Tests: LoginPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();

    expect(passwordInput()).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiển thị mật khẩu' }));
    expect(passwordInput()).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ẩn mật khẩu' }));
    expect(passwordInput()).toHaveAttribute('type', 'password');
  });

  it.each([
    { name: 'empty form', username: '', password: '' },
    { name: 'missing password', username: 'admin', password: '' },
    { name: 'missing username', username: '', password: 'admin123' },
    { name: 'blank username', username: '   ', password: 'admin123' },
  ])('shows a validation error and skips login: $name', async ({ username, password }) => {
    const user = userEvent.setup();
    const loginSpy = vi.spyOn(authService, 'login');
    renderLogin();

    if (username) await user.type(usernameInput(), username);
    if (password) await user.type(passwordInput(), password);
    await user.click(submitButton());

    expect(screen.getByRole('alert')).toHaveTextContent(/Vui lòng nhập đầy đủ/i);
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('submits the typed credentials and goes to the home page', async () => {
    const user = userEvent.setup();
    const loginSpy = vi.spyOn(authService, 'login').mockResolvedValue(adminUser);
    renderLogin();

    await user.type(usernameInput(), 'admin');
    await user.type(passwordInput(), 'admin123');
    await user.click(submitButton());

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument());
    expect(loginSpy).toHaveBeenCalledWith({ username: 'admin', password: 'admin123' });
  });

  it('returns to the redirect target after login', async () => {
    const user = userEvent.setup();
    vi.spyOn(authService, 'login').mockResolvedValue(adminUser);
    renderLogin('/login?redirect=/pos');

    await user.click(screen.getByRole('button', { name: /Admin Toàn Quyền/i }));
    await user.click(submitButton());

    await waitFor(() => expect(screen.getByText('POS Page')).toBeInTheDocument());
  });

  it('disables the form while signing in', async () => {
    const user = userEvent.setup();
    let finish!: (u: AuthUser) => void;
    vi.spyOn(authService, 'login').mockImplementation(
      () =>
        new Promise<AuthUser>((resolve) => {
          finish = resolve;
        })
    );
    renderLogin();

    await user.click(screen.getByRole('button', { name: /Admin Toàn Quyền/i }));
    await user.click(submitButton());

    expect(usernameInput()).toBeDisabled();
    expect(passwordInput()).toBeDisabled();

    finish(adminUser);
    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument());
  });
});
