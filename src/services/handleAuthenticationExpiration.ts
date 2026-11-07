// KAN-83: Handle Authentication Expiration
import type { AxiosInstance } from 'axios';

const AUTH_ENDPOINTS = ['/auth/login', '/auth/logout'];

interface Options {
  loginPath?: string;
  getLocation?: () => string;
  redirect?: (url: string) => void;
}

export function clearAuthSession(): void {
  ['authToken', 'currentUser'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export function installAuthExpirationHandler(client: AxiosInstance, options: Options = {}) {
  const loginPath = options.loginPath ?? '/login';
  const getLocation = options.getLocation ?? (() => window.location.pathname + window.location.search);
  const redirect = options.redirect ?? ((url: string) => window.location.assign(url));

  const id = client.interceptors.response.use(
    (response) => response,
    (error) => {
      const url = String(error?.config?.url ?? '');
      const isAuthCall = AUTH_ENDPOINTS.some((path) => url.includes(path));
      const hasToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

      // A 401 from login/logout means bad credentials, not an expired session
      if (error?.response?.status === 401 && !isAuthCall && hasToken) {
        clearAuthSession();
        const current = getLocation();
        console.warn(
          JSON.stringify({ level: 'warn', event: 'auth.session_expired', path: current.split('?')[0] }),
        );
        if (!current.startsWith(loginPath)) {
          redirect(`${loginPath}?reason=expired&redirect=${encodeURIComponent(current)}`);
        }
      }
      return Promise.reject(error);
    },
  );

  return () => client.interceptors.response.eject(id);
}
