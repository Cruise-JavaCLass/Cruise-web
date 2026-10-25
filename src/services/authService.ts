import { apiClient } from './api';

export type StaffRole =
  | 'SYSTEM_ADMIN'
  | 'OPERATIONS_MANAGER'
  | 'ITINERARY_COORDINATOR'
  | 'ACTIVITY_MANAGER'
  | 'SHORE_EXCURSION_MANAGER'
  | 'POS_STAFF'
  | 'FINANCE_FRONT_DESK'
  | 'PASSENGER';

export interface AuthUser {
  id: number | string;
  username: string;
  fullName: string;
  role: StaffRole;
  email?: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

// Pre-configured authorized crew credentials for offline / development / demo mode
const DEMO_STAFF_ACCOUNTS: Record<string, { pass: string; user: AuthUser }> = {
  admin: {
    pass: 'admin123',
    user: {
      id: 1,
      username: 'admin',
      fullName: 'Huy Trần Gia',
      role: 'SYSTEM_ADMIN',
      email: 'admin@grandpearlvoyager.com',
    },
  },
  'ops.manager': {
    pass: 'ops123',
    user: {
      id: 2,
      username: 'ops.manager',
      fullName: 'Nguyễn Văn Điều Hành',
      role: 'OPERATIONS_MANAGER',
      email: 'ops@grandpearlvoyager.com',
    },
  },
  coordinator: {
    pass: 'coord123',
    user: {
      id: 3,
      username: 'coordinator',
      fullName: 'Lê Hàng Hải',
      role: 'ITINERARY_COORDINATOR',
      email: 'coordinator@grandpearlvoyager.com',
    },
  },
  'tour.director': {
    pass: 'tour123',
    user: {
      id: 4,
      username: 'tour.director',
      fullName: 'Trần Diệu Hành',
      role: 'SHORE_EXCURSION_MANAGER',
      email: 'tour@grandpearlvoyager.com',
    },
  },
};

export const authService = {
  /**
   * Log in a crew member or admin
   */
  login: async (credentials: LoginCredentials): Promise<AuthUser> => {
    const username = credentials.username.trim().toLowerCase();
    const password = credentials.password || '';

    // 1. Attempt backend authentication if available
    try {
      const res = await apiClient.post<{ success: boolean; data: { token: string; user?: AuthUser } }>(
        '/auth/login',
        { username, password }
      );
      if (res.data?.data?.token) {
        const user: AuthUser = res.data.data.user || {
          id: 1,
          username,
          fullName: username.toUpperCase(),
          role: 'SYSTEM_ADMIN',
        };
        authService.setSession(res.data.data.token, user);
        return user;
      }
    } catch {
      // Backend offline or unreachable: fall back to authorized demo crew verification
    }

    // 2. Check demo accounts fallback
    const match = DEMO_STAFF_ACCOUNTS[username];
    if (match && match.pass === password) {
      const mockToken = `mock-crew-jwt-${match.user.role.toLowerCase()}-${Date.now()}`;
      authService.setSession(mockToken, match.user);
      return match.user;
    }

    throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
  },

  /**
   * Set authentication token and user session
   */
  setSession: (token: string, user: AuthUser): void => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  },

  /**
   * Log out the current user and clear local session
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
      }
    }
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: (): AuthUser | null => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const stored = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse error
    }
    return null;
  },

  /**
   * Check if a valid session exists
   */
  isAuthenticated: (): boolean => {
    return authService.getCurrentUser() !== null;
  },

  /**
   * Check if the authenticated user has crew / staff privileges
   */
  isStaff: (): boolean => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    return user.role !== 'PASSENGER';
  },
};
