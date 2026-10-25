import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { authService } from './services/authService';

// Mock backend API to prevent async interval timer in tests
vi.mock('./services/api', () => ({
  checkBackendHealth: vi.fn().mockResolvedValue(null),
  getBackendInfo: vi.fn().mockResolvedValue(null),
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('App Routing Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Default to authenticated crew session for admin integration tests
    authService.setSession('mock-crew-token', {
      id: 1,
      username: 'admin',
      fullName: 'Huy Trần Gia',
      role: 'SYSTEM_ADMIN',
    });
  });

  it('renders DashboardPage by default at root "/" route for authenticated crew', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền')).toBeInTheDocument();
      expect(screen.getByText('Frontend Client v1.0.0')).toBeInTheDocument();
    });
  });

  it('renders ShipsPage when navigating to "/ships"', async () => {
    render(
      <MemoryRouter initialEntries={['/ships']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Quản Lý Đội Tàu Du Lịch/i })).toBeInTheDocument();
      expect(screen.getByText('Halong Grand Harmony')).toBeInTheDocument();
    });
  });

  it('renders ItineraryPage when navigating to "/itinerary"', async () => {
    render(
      <MemoryRouter initialEntries={['/itinerary']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Quản Lý Tour Du Lịch Du Thuyền/i })).toBeInTheDocument();
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
    });
  });

  it('renders ActivitiesPage when navigating to "/activities"', async () => {
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Quản Lý Hoạt Động & Tour Trên Bờ/i })).toBeInTheDocument();
      expect(screen.getByText('Gala Dinner & Vũ Điệu Hoàng Gia')).toBeInTheDocument();
    });
  });

  it('renders ExcursionsPage when navigating to "/excursions"', async () => {
    render(
      <MemoryRouter initialEntries={['/excursions']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Quản Lý Tour Trên Bờ/i })).toBeInTheDocument();
      expect(screen.getByText('Khám phá Hang Sửng Sốt & Đảo Ti Tốp')).toBeInTheDocument();
    });
  });

  it('renders PosPage when navigating to "/pos"', async () => {
    render(
      <MemoryRouter initialEntries={['/pos']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Hệ Thống POS & Tài Khoản Phi Tiền Mặt/i })).toBeInTheDocument();
      expect(screen.getByText('Đã kết nối máy chủ')).toBeInTheDocument();
    });
  });

  it('renders PassengersPage when navigating to "/passengers"', async () => {
    render(
      <MemoryRouter initialEntries={['/passengers']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Danh Sách Hành Khách & Định Vị BLE/i })).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn Minh')).toBeInTheDocument();
    });
  });

  it('renders NotFoundPage when navigating to an unknown route', async () => {
    render(
      <MemoryRouter initialEntries={['/invalid-random-route']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: '404' })).toBeInTheDocument();
      expect(screen.getByText('Trang không tồn tại')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Về Trang Chủ/i })).toHaveAttribute('href', '/');
    });
  });

  it('navigates to "/passenger-home" within dedicated PassengerLayout and without admin sidebar', async () => {
    render(
      <MemoryRouter initialEntries={['/passenger-home']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Passenger portal branding
      expect(screen.getByText('GRAND PEARL')).toBeInTheDocument();
      expect(screen.getByText('Guest Experience Portal')).toBeInTheDocument();
      // Admin operations sidebar must NOT be present
      expect(screen.queryByText('CRUISE MANAGER')).not.toBeInTheDocument();
      expect(screen.queryByText('MARITIME COMPUTE')).not.toBeInTheDocument();
    });
  });

  it('redirects "/passenger" route to "/passenger-home" inside PassengerLayout', async () => {
    render(
      <MemoryRouter initialEntries={['/passenger']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('GRAND PEARL')).toBeInTheDocument();
      expect(screen.getByText('Guest Experience Portal')).toBeInTheDocument();
      expect(screen.queryByText('CRUISE MANAGER')).not.toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users to "/login" when attempting to access protected admin route "/ships"', async () => {
    localStorage.clear();
    sessionStorage.clear();

    render(
      <MemoryRouter initialEntries={['/ships']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CRUISE MANAGER')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i })).toBeInTheDocument();
      // Protected content must not render
      expect(screen.queryByRole('heading', { level: 2, name: /Quản Lý Đội Tàu Du Lịch/i })).not.toBeInTheDocument();
    });
  });

  it('renders LoginPage directly when navigating to "/login"', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CRUISE MANAGER')).toBeInTheDocument();
      expect(screen.getByText(/FLEET OPERATIONS & CREW CONSOLE/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Đăng nhập Vận Hành/i })).toBeInTheDocument();
    });
  });
});
