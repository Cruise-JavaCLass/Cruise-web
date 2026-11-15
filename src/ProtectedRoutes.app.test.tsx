// KAN-82, KAN-85: Implement Protected Routes, Test Protected Routes by Role
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { authService, type StaffRole } from './services/authService';

vi.mock('./layouts/MainLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return { MainLayout: () => <Outlet /> };
});
vi.mock('./layouts/PassengerLayout', async () => {
  const { Outlet } = await import('react-router-dom');
  return { PassengerLayout: () => <Outlet /> };
});
vi.mock('./pages/LoginPage', async () => {
  const { useLocation } = await import('react-router-dom');
  function LoginPageStub() {
    const location = useLocation();
    return (
      <div>
        Login Page <span data-testid="login-search">{location.search}</span>
      </div>
    );
  }
  return { LoginPage: LoginPageStub };
});
vi.mock('./pages/DashboardPage', () => ({ DashboardPage: () => <div>Dashboard Page</div> }));
vi.mock('./pages/UsersPage', () => ({ UsersPage: () => <div>Users Page</div> }));
vi.mock('./pages/UserDetailPage', () => ({ UserDetailPage: () => <div>User Detail Page</div> }));
vi.mock('./pages/NotFoundPage', () => ({ NotFoundPage: () => <div>Not Found Page</div> }));
vi.mock('./pages/PassengerHomePage', () => ({
  PassengerHomePage: () => <div>Passenger Home Page</div>,
}));

function loginAs(role: StaffRole) {
  authService.setSession('test-token', { id: 1, username: 'tester', fullName: 'Test User', role });
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('KAN-82, KAN-85 Protected routes in App', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('when signed out', () => {
    it('redirects the operations home page to login', () => {
      renderAt('/');
      expect(screen.getByText(/Login Page/)).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    it('redirects /users to login and remembers the page', () => {
      renderAt('/users');
      expect(screen.getByText(/Login Page/)).toBeInTheDocument();
      expect(screen.getByTestId('login-search')).toHaveTextContent('?redirect=%2Fusers');
    });

    it('sends unknown paths to login instead of showing the 404 page', () => {
      renderAt('/does-not-exist');
      expect(screen.getByText(/Login Page/)).toBeInTheDocument();
      expect(screen.queryByText('Not Found Page')).not.toBeInTheDocument();
    });

    it('keeps /login and the guest portal public', () => {
      const first = renderAt('/login');
      expect(screen.getByText(/Login Page/)).toBeInTheDocument();
      first.unmount();

      renderAt('/passenger-home');
      expect(screen.getByText('Passenger Home Page')).toBeInTheDocument();
    });
  });

  describe('when signed in', () => {
    it('lets SYSTEM_ADMIN open the users pages', () => {
      loginAs('SYSTEM_ADMIN');
      const first = renderAt('/users');
      expect(screen.getByText('Users Page')).toBeInTheDocument();
      first.unmount();

      renderAt('/users/5');
      expect(screen.getByText('User Detail Page')).toBeInTheDocument();
    });

    it.each<StaffRole>(['OPERATIONS_MANAGER', 'ITINERARY_COORDINATOR', 'SHORE_EXCURSION_MANAGER', 'POS_STAFF'])(
      'keeps %s out of /users and shows the dashboard',
      (role) => {
        loginAs(role);
        renderAt('/users');
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
        expect(screen.queryByText('Users Page')).not.toBeInTheDocument();
      }
    );

    it('keeps non-admin staff out of /users/:id', () => {
      loginAs('OPERATIONS_MANAGER');
      renderAt('/users/5');
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      expect(screen.queryByText('User Detail Page')).not.toBeInTheDocument();
    });

    it('opens the dashboard without a redirect loop', () => {
      loginAs('OPERATIONS_MANAGER');
      renderAt('/');
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });

    it('sends a PASSENGER account to login', () => {
      loginAs('PASSENGER');
      renderAt('/users');
      expect(screen.getByText(/Login Page/)).toBeInTheDocument();
      expect(screen.queryByText('Users Page')).not.toBeInTheDocument();
    });

    it('shows the 404 page for unknown paths', () => {
      loginAs('SYSTEM_ADMIN');
      renderAt('/does-not-exist');
      expect(screen.getByText('Not Found Page')).toBeInTheDocument();
    });
  });
});
