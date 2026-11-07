// KAN-82: Implement Protected Routes
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AdminAuthGuard } from './AdminAuthGuard';
import { authService, type StaffRole } from '../../services/authService';

function LoginStub() {
  const location = useLocation();
  return (
    <div>
      Login Page
      <span data-testid="login-search">{location.search}</span>
    </div>
  );
}

function renderGuard(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="login" element={<LoginStub />} />
        <Route element={<AdminAuthGuard />}>
          <Route path="ships" element={<div>Ships Page</div>} />
          <Route path="ships/:id" element={<div>Ship Detail Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const staffUser = { id: 1, username: 'u', fullName: 'U', role: 'SYSTEM_ADMIN' as StaffRole };

describe('KAN-82 Implement Protected Routes: AdminAuthGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it.each<StaffRole>([
    'SYSTEM_ADMIN',
    'OPERATIONS_MANAGER',
    'ITINERARY_COORDINATOR',
    'ACTIVITY_MANAGER',
    'SHORE_EXCURSION_MANAGER',
    'POS_STAFF',
    'FINANCE_FRONT_DESK',
  ])('lets %s through', (role) => {
    authService.setSession('token', { ...staffUser, role });
    renderGuard('/ships');
    expect(screen.getByText('Ships Page')).toBeInTheDocument();
  });

  it('lets staff open nested routes with params', () => {
    authService.setSession('token', staffUser);
    renderGuard('/ships/7');
    expect(screen.getByText('Ship Detail Page')).toBeInTheDocument();
  });

  it('accepts a session kept in sessionStorage', () => {
    sessionStorage.setItem('authToken', 'token');
    sessionStorage.setItem('currentUser', JSON.stringify(staffUser));
    renderGuard('/ships');
    expect(screen.getByText('Ships Page')).toBeInTheDocument();
  });

  it('blocks a PASSENGER account even with a token', () => {
    authService.setSession('token', { ...staffUser, role: 'PASSENGER' });
    renderGuard('/ships');
    expect(screen.getByText(/Login Page/)).toBeInTheDocument();
    expect(screen.queryByText('Ships Page')).not.toBeInTheDocument();
  });

  it('blocks when only the token exists', () => {
    localStorage.setItem('authToken', 'token');
    renderGuard('/ships');
    expect(screen.getByText(/Login Page/)).toBeInTheDocument();
  });

  it('blocks when only the user exists', () => {
    localStorage.setItem('currentUser', JSON.stringify(staffUser));
    renderGuard('/ships');
    expect(screen.getByText(/Login Page/)).toBeInTheDocument();
  });

  it('blocks when the stored user is corrupted', () => {
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('currentUser', '{not-json');
    renderGuard('/ships');
    expect(screen.getByText(/Login Page/)).toBeInTheDocument();
  });

  it('keeps the requested path and query string in the redirect', () => {
    renderGuard('/ships?tab=2&sort=name');
    expect(screen.getByTestId('login-search')).toHaveTextContent(
      `?redirect=${encodeURIComponent('/ships?tab=2&sort=name')}`
    );
  });

  it('keeps nested route params in the redirect', () => {
    renderGuard('/ships/7');
    expect(screen.getByTestId('login-search')).toHaveTextContent('?redirect=%2Fships%2F7');
  });
});