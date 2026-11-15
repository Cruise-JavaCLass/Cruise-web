// KAN-83: Handle Authentication Expiration
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { installAuthExpirationHandler } from './handleAuthenticationExpiration';

const failWith =
  (status: number): AxiosAdapter =>
  (config: InternalAxiosRequestConfig) => {
    const response = { data: {}, status, statusText: '', headers: {}, config } as AxiosResponse;
    return Promise.reject(new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response));
  };

const succeed: AxiosAdapter = (config) =>
  Promise.resolve({ data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse);

function setup(adapter: AxiosAdapter, location = '/pos?tab=1') {
  const client = axios.create({ adapter });
  const redirect = vi.fn();
  const remove = installAuthExpirationHandler(client, { redirect, getLocation: () => location });
  return { client, redirect, remove };
}

function startSession() {
  localStorage.setItem('authToken', 'secret-token');
  localStorage.setItem('currentUser', JSON.stringify({ username: 'admin' }));
}

describe('KAN-83 Handle Authentication Expiration: installAuthExpirationHandler', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clears the session and redirects to login with the current page on 401', async () => {
    startSession();
    const { client, redirect } = setup(failWith(401));

    await expect(client.get('/ships')).rejects.toBeDefined();

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(redirect).toHaveBeenCalledTimes(1);
    const target = String(redirect.mock.calls[0][0]);
    expect(target).toContain('/login?reason=expired');
    expect(target).toContain(encodeURIComponent('/pos?tab=1'));
  });

  it('also clears a session stored in sessionStorage', async () => {
    sessionStorage.setItem('authToken', 'secret-token');
    sessionStorage.setItem('currentUser', JSON.stringify({ username: 'admin' }));
    const { client } = setup(failWith(401));

    await expect(client.get('/ships')).rejects.toBeDefined();

    expect(sessionStorage.getItem('authToken')).toBeNull();
    expect(sessionStorage.getItem('currentUser')).toBeNull();
  });

  it('logs the expiry without leaking the token', async () => {
    startSession();
    const { client } = setup(failWith(401));

    await expect(client.get('/ships')).rejects.toBeDefined();

    const raw = String(vi.mocked(console.warn).mock.calls[0][0]);
    expect(JSON.parse(raw)).toMatchObject({ event: 'auth.session_expired', path: '/pos' });
    expect(raw).not.toContain('secret-token');
  });

  it('redirects only once when several requests fail together', async () => {
    startSession();
    const { client, redirect } = setup(failWith(401));

    await Promise.allSettled([client.get('/a'), client.get('/b'), client.get('/c')]);

    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it('only clears the session when already on the login page', async () => {
    startSession();
    const { client, redirect } = setup(failWith(401), '/login?redirect=%2Fpos');

    await expect(client.get('/ships')).rejects.toBeDefined();

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each(['/auth/login', '/auth/logout'])('ignores 401 from %s', async (path) => {
    startSession();
    const { client, redirect } = setup(failWith(401));

    await expect(client.post(path, {})).rejects.toBeDefined();

    expect(localStorage.getItem('authToken')).toBe('secret-token');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('does nothing when there is no session', async () => {
    const { client, redirect } = setup(failWith(401));

    await expect(client.get('/ships')).rejects.toBeDefined();

    expect(redirect).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([403, 500])('keeps the session on a %i error', async (status) => {
    startSession();
    const { client, redirect } = setup(failWith(status));

    await expect(client.get('/ships')).rejects.toBeDefined();

    expect(localStorage.getItem('authToken')).toBe('secret-token');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('passes successful responses through', async () => {
    startSession();
    const { client, redirect } = setup(succeed);

    const res = await client.get('/ships');

    expect(res.data).toEqual({ ok: true });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('stops handling 401 after the handler is removed', async () => {
    startSession();
    const { client, redirect, remove } = setup(failWith(401));
    remove();

    await expect(client.get('/ships')).rejects.toBeDefined();

    expect(localStorage.getItem('authToken')).toBe('secret-token');
    expect(redirect).not.toHaveBeenCalled();
  });
});
