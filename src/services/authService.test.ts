import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './authService';

describe('authService Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('successfully logs in with valid demo admin credentials', async () => {
    const user = await authService.login({ username: 'admin', password: 'admin123' });
    expect(user.username).toBe('admin');
    expect(user.role).toBe('SYSTEM_ADMIN');
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.isStaff()).toBe(true);
  });

  it('rejects invalid credentials with an error', async () => {
    await expect(authService.login({ username: 'admin', password: 'wrongpassword' })).rejects.toThrow(
      'Tên đăng nhập hoặc mật khẩu không chính xác.'
    );
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('correctly handles logout and clears session', async () => {
    await authService.login({ username: 'ops.manager', password: 'ops123' });
    expect(authService.isAuthenticated()).toBe(true);

    await authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.getCurrentUser()).toBe(null);
  });

  it('determines PASSENGER role is not staff', () => {
    authService.setSession('token', {
      id: 99,
      username: 'guest',
      fullName: 'John Guest',
      role: 'PASSENGER',
    });

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.isStaff()).toBe(false);
  });
});
