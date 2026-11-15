// KAN-86: Test Login Failure and Session Expiration
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { AdminAuthGuard } from '../components/auth/AdminAuthGuard';
import { authService } from '../services/authService';
import { apiClient } from '../services/api';

vi.mock('../services/api', () => ({
  apiClient: { post: vi.fn(), get: vi.fn() },
}));

const postMock = vi.mocked(apiClient.post);

function backendReplies(user: Record<string, unknown>, token = 'backend-token') {
  postMock.mockResolvedValue({ data: { success: true, data: { token, user } } });
}

function renderApp(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route element={<AdminAuthGuard />}>
          <Route path="/ships" element={<div>Ships Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

async function signIn(user: ReturnType<typeof userEvent.setup>, username: string, password: string) {
  await user.type(screen.getByLabelText(/Tên đăng nhập/i), username);
  await user.type(screen.getByLabelText('Mật khẩu xác thực'), password);
  await user.click(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i }));
}

const startSession = () =>
  authService.setSession('token', { id: 1, username: 'u', fullName: 'U', role: 'SYSTEM_ADMIN' });

describe('KAN-86 Test Login Failure and Session Expiration: login failure', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    postMock.mockReset();
    // default: backend is not running, so only demo accounts can sign in
    postMock.mockRejectedValue(new Error('Network Error'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an error and creates no session on a wrong password', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'admin', 'wrong-password');

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/Tên đăng nhập hoặc mật khẩu không chính xác/i)
    );
    expect(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i })).toBeEnabled();
    expect(authService.isAuthenticated()).toBe(false);
    expect(screen.queryByText('Home Page')).not.toBeInTheDocument();
  });

  it('rejects an unknown username', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'nobody', 'whatever');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/không chính xác/i));
  });

  it('treats the password as case sensitive', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'admin', 'ADMIN123');

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('shows an error when the backend answers 401', async () => {
    postMock.mockRejectedValue({ response: { status: 401 } });
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'admin', 'wrong');

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/không chính xác/i));
  });

  it('does not create a session when the backend returns no user', async () => {
    postMock.mockResolvedValue({ data: { success: true, data: { token: 'abc' } } });
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'nobody', 'whatever');

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('rejects passenger accounts with their own message', async () => {
    backendReplies({ id: 9, username: 'guest', fullName: 'Guest', role: 'PASSENGER' });
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'guest', 'guest123');

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/hành khách không có quyền truy cập/i)
    );
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('clears the error when a demo account is picked', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'x', 'y');
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Ops Manager/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('allows signing in again after a failed attempt', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'admin', 'wrong');
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Admin Toàn Quyền/i }));
    await user.click(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i }));

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument());
    expect(authService.getCurrentUser()?.username).toBe('admin');
  });

  it('stores the token and user returned by the backend', async () => {
    backendReplies({ id: 5, username: 'crew', fullName: 'Crew', role: 'POS_STAFF' });
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, 'crew', 'password');

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument());
    expect(localStorage.getItem('authToken')).toBe('backend-token');
    expect(authService.getCurrentUser()?.role).toBe('POS_STAFF');
  });

  it('trims and lowercases the username before signing in', async () => {
    const user = userEvent.setup();
    renderApp('/login');

    await signIn(user, '  ADMIN  ', 'admin123');

    await waitFor(() => expect(screen.getByText('Home Page')).toBeInTheDocument());
    expect(authService.getCurrentUser()?.username).toBe('admin');
  });
});

describe('KAN-86 Test Login Failure and Session Expiration: session expiration', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    postMock.mockReset();
    postMock.mockRejectedValue(new Error('Network Error'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logout clears the token and user from both storages', async () => {
    startSession();
    sessionStorage.setItem('authToken', 'other-token');
    sessionStorage.setItem('currentUser', '{}');
    postMock.mockResolvedValue({});

    await authService.logout();

    expect(postMock).toHaveBeenCalledWith('/auth/logout');
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(sessionStorage.getItem('authToken')).toBeNull();
    expect(sessionStorage.getItem('currentUser')).toBeNull();
  });

  it('logout still clears the session when the server is unreachable', async () => {
    startSession();

    await expect(authService.logout()).resolves.toBeUndefined();

    expect(authService.isAuthenticated()).toBe(false);
  });

  it('is not authenticated once the token or the user is gone', () => {
    startSession();
    localStorage.removeItem('authToken');
    expect(authService.isAuthenticated()).toBe(false);

    startSession();
    localStorage.removeItem('currentUser');
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('returns null instead of crashing when the stored user is corrupted', () => {
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('currentUser', '{not-json');

    expect(authService.getCurrentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('sends a signed-out user to login, then back to the page they wanted', async () => {
    const user = userEvent.setup();
    renderApp('/ships?tab=1');

    expect(screen.getByText('CRUISE MANAGER')).toBeInTheDocument();
    expect(screen.queryByText('Ships Page')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Admin Toàn Quyền/i }));
    await user.click(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i }));

    await waitFor(() => expect(screen.getByText('Ships Page')).toBeInTheDocument());
  });

  it('blocks a protected page after the session is removed', () => {
    startSession();
    const first = renderApp('/ships');
    expect(screen.getByText('Ships Page')).toBeInTheDocument();
    first.unmount();

    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    renderApp('/ships');

    expect(screen.getByText('CRUISE MANAGER')).toBeInTheDocument();
    expect(screen.queryByText('Ships Page')).not.toBeInTheDocument();
  });
});
