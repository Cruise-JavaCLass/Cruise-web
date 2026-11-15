// KAN-85: Test Protected Routes by Role
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';
import { AdminAuthGuard } from './AdminAuthGuard';
import { authService, type StaffRole } from '../../services/authService';

function loginAs(role: StaffRole) {
  authService.setSession('test-token', { id: 1, username: 'tester', fullName: 'Test User', role });
}

function LoginStub() {
  const location = useLocation();
  return (
    <div>
      Login Page
      <span data-testid="login-search">{location.search}</span>
    </div>
  );
}

function renderGuard(allowedRoles: string[], redirectTo?: string) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/denied" element={<div>Denied Page</div>} />
        <Route element={<RoleGuard allowedRoles={allowedRoles} redirectTo={redirectTo} />}>
          <Route path="/admin" element={<div>Admin Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

function renderBothGuards(allowedRoles: string[]) {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/login" element={<LoginStub />} />
        <Route element={<AdminAuthGuard />}>
          <Route element={<RoleGuard allowedRoles={allowedRoles} />}>
            <Route path="/admin" element={<div>Admin Page</div>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('KAN-85 Test Protected Routes by Role: RoleGuard', () => {
  const allowed: StaffRole[] = ['SYSTEM_ADMIN', 'OPERATIONS_MANAGER'];
  const denied: StaffRole[] = [
    'ITINERARY_COORDINATOR',
    'ACTIVITY_MANAGER',
    'SHORE_EXCURSION_MANAGER',
    'POS_STAFF',
    'FINANCE_FRONT_DESK',
    'PASSENGER',
  ];

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it.each(allowed)('allows %s', (role) => {
    loginAs(role);
    renderGuard(allowed);
    expect(screen.getByText('Admin Page')).toBeInTheDocument();
  });

  it.each(denied)('redirects %s to the home page', (role) => {
    loginAs(role);
    renderGuard(allowed);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Page')).not.toBeInTheDocument();
  });

  it('redirects when nobody is signed in', () => {
    renderGuard(allowed);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('redirects when the stored user is corrupted', () => {
    localStorage.setItem('currentUser', '{not-json');
    renderGuard(allowed);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('compares roles case sensitively', () => {
    authService.setSession('test-token', {
      id: 1,
      username: 'tester',
      fullName: 'Test User',
      role: 'system_admin' as StaffRole,
    });
    renderGuard(allowed);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('blocks everyone when allowedRoles is empty', () => {
    loginAs('SYSTEM_ADMIN');
    renderGuard([]);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  it('uses a custom redirect target', () => {
    loginAs('POS_STAFF');
    renderGuard(allowed, '/denied');
    expect(screen.getByText('Denied Page')).toBeInTheDocument();
  });
});

describe('KAN-85 Test Protected Routes by Role: AdminAuthGuard + RoleGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('sends a signed-out user to login and keeps the page they wanted', () => {
    renderBothGuards(['SYSTEM_ADMIN']);
    expect(screen.getByText(/Login Page/)).toBeInTheDocument();
    expect(screen.getByTestId('login-search')).toHaveTextContent('?redirect=%2Fadmin');
  });

  it('sends a signed-in user with the wrong role to the home page, not to login', () => {
    loginAs('POS_STAFF');
    renderBothGuards(['SYSTEM_ADMIN']);
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText(/Login Page/)).not.toBeInTheDocument();
  });

  it('lets the right role in', () => {
    loginAs('SYSTEM_ADMIN');
    renderBothGuards(['SYSTEM_ADMIN']);
    expect(screen.getByText('Admin Page')).toBeInTheDocument();
  });

  it('sends a passenger account to login', () => {
    loginAs('PASSENGER');
    renderBothGuards(['SYSTEM_ADMIN']);
    expect(screen.getByText(/Login Page/)).toBeInTheDocument();
  });
});
