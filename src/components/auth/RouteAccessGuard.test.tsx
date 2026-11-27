import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminAuthGuard } from './AdminAuthGuard';
import { RouteAccessGuard } from './RouteAccessGuard';
import { authService, type StaffRole } from '../../services/authService';
import { ACCESS_DENIED_EVENT } from '../../services/api';

function open(path: string, role?: StaffRole) {
  if (role) authService.setSession('token', { id: 1, username: 'actor', fullName: 'Actor', role });
  render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/login" element={<div>Login required</div>} />
    <Route element={<AdminAuthGuard />}><Route element={<RouteAccessGuard />}>
      <Route path="/" element={<div>Operations dashboard</div>} />
      <Route path="/pos" element={<div>Cashier workspace</div>} />
      <Route path="/users" element={<div>Identity administration</div>} />
      <Route path="/excursions/:id/roster" element={<div>Shore roster</div>} />
      <Route path="/activities/:id/attendance" element={<div>Activity check-in</div>} />
      <Route path="/forbidden" element={<div>Forbidden</div>} />
    </Route></Route>
  </Routes></MemoryRouter>);
}

describe('KAN-72 direct route authorization', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  it.each(['POS_STAFF', 'OPERATIONS_MANAGER', 'ACTIVITY_MANAGER', 'SHORE_EXCURSION_MANAGER',
    'ITINERARY_COORDINATOR', 'FINANCE_FRONT_DESK'] as StaffRole[])(
    'blocks %s from opening user administration by URL', role => {
      open('/users', role);
      expect(screen.getByText('Forbidden')).toBeInTheDocument();
      expect(screen.queryByText('Identity administration')).not.toBeInTheDocument();
    },
  );
  it('allows administrator user management', () => {
    open('/users', 'SYSTEM_ADMIN');
    expect(screen.getByText('Identity administration')).toBeInTheDocument();
  });
  it('sends a cashier to the authorized landing page instead of an operations dashboard', () => {
    open('/', 'POS_STAFF');
    expect(screen.getByText('Cashier workspace')).toBeInTheDocument();
    expect(screen.queryByText('Operations dashboard')).not.toBeInTheDocument();
  });
  it.each([
    ['/excursions/7/roster', 'SHORE_EXCURSION_MANAGER', 'Shore roster'],
    ['/activities/7/attendance', 'ACTIVITY_MANAGER', 'Activity check-in'],
  ] as const)('permits the owning role at %s', (path, role, content) => {
    open(path, role);
    expect(screen.getByText(content)).toBeInTheDocument();
  });
  it.each([
    ['/excursions/7/roster', 'ACTIVITY_MANAGER'], ['/activities/7/attendance', 'SHORE_EXCURSION_MANAGER'],
  ] as const)('rejects cross-role deep link %s for %s', (path, role) => {
    open(path, role);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });
  it('requires login for an anonymous deep link', () => {
    open('/users');
    expect(screen.getByText('Login required')).toBeInTheDocument();
  });
  it('does not accept a forged unknown staff role in local storage', () => {
    open('/users', 'ADMIN' as StaffRole);
    expect(screen.getByText('Login required')).toBeInTheDocument();
  });
  it('leaves an allowed page when the backend denies a mutation', () => {
    open('/pos', 'POS_STAFF');
    act(() => window.dispatchEvent(new CustomEvent(ACCESS_DENIED_EVENT, { detail: { status: 403 } })));
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.queryByText('Cashier workspace')).not.toBeInTheDocument();
  });
  it('clears an expired session and returns to login on a backend 401', () => {
    open('/pos', 'POS_STAFF');
    act(() => window.dispatchEvent(new CustomEvent(ACCESS_DENIED_EVENT, { detail: { status: 401 } })));
    expect(screen.getByText('Login required')).toBeInTheDocument();
    expect(authService.isAuthenticated()).toBe(false);
  });
});
