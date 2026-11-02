import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from './api';
import { authService } from './authService';

describe('KAN-71 authenticated API transport', () => {
  const originalAdapter = apiClient.defaults.adapter;
  let seen: InternalAxiosRequestConfig | undefined;
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    seen = undefined;
    const adapter: AxiosAdapter = async config => {
      seen = config;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };
    apiClient.defaults.adapter = adapter;
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it('sends no Authorization header for an anonymous session', async () => {
    await apiClient.get('/auth/roles');
    expect(seen?.headers.get('Authorization')).toBeUndefined();
  });
  it('attaches a current local session token', async () => {
    localStorage.setItem('authToken', 'local-access-token');
    await apiClient.get('/auth/roles');
    expect(seen?.headers.get('Authorization')).toBe('Bearer local-access-token');
  });
  it('uses session storage and stops attaching the token after logout', async () => {
    sessionStorage.setItem('authToken', 'session-access-token');
    await apiClient.get('/auth/roles');
    expect(seen?.headers.get('Authorization')).toBe('Bearer session-access-token');
    await authService.logout();
    await apiClient.get('/auth/roles');
    expect(seen?.headers.get('Authorization')).toBeUndefined();
  });

  it('uses the backend login request and response contract', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true, data: {
      accessToken: 'real-access-token', user: { id: 3, username: 'guide', fullName: 'Guide', role: 'SHORE_EXCURSION_MANAGER' },
    } } });
    await authService.login({ username: 'guide', password: 'Password#123' });
    expect(post).toHaveBeenCalledWith('/auth/login', { usernameOrEmail: 'guide', password: 'Password#123' });
    expect(localStorage.getItem('authToken')).toBe('real-access-token');
  });
  it('rejects an unknown role returned by a backend response', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: { success: true, data: {
      accessToken: 'token', user: { id: 3, username: 'rogue', fullName: 'Rogue', role: 'ADMIN' },
    } } });
    await expect(authService.login({ username: 'rogue', password: 'Password#123' })).rejects.toThrow();
    expect(authService.isStaff()).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});
