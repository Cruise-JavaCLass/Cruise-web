import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

const signInAs = (role: string | null) => {
  vi.mocked(authService.getCurrentUser).mockReturnValue(
    (role ? { id: 1, username: 'tester', fullName: 'Test User', role } : null) as never
  );
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>Trang chủ</div>} />
        <Route element={<RoleGuard allowedRoles={['SYSTEM_ADMIN']} />}>
          <Route path="users" element={<div>Danh sách người dùng</div>} />
          <Route path="users/:id" element={<div>Chi tiết người dùng</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets SYSTEM_ADMIN open /users and /users/:id', () => {
    signInAs('SYSTEM_ADMIN');
    renderAt('/users');
    expect(screen.getByText('Danh sách người dùng')).toBeInTheDocument();
  });

  it('lets SYSTEM_ADMIN open the detail page', () => {
    signInAs('SYSTEM_ADMIN');
    renderAt('/users/5');
    expect(screen.getByText('Chi tiết người dùng')).toBeInTheDocument();
  });

  it.each(['POS_STAFF', 'OPERATIONS_MANAGER', 'PASSENGER'])(
    'redirects %s away from /users',
    (role) => {
      signInAs(role);
      renderAt('/users');
      expect(screen.queryByText('Danh sách người dùng')).not.toBeInTheDocument();
      expect(screen.getByText('Trang chủ')).toBeInTheDocument();
    }
  );

  it('redirects away from /users/:id for non-admin roles', () => {
    signInAs('POS_STAFF');
    renderAt('/users/5');
    expect(screen.queryByText('Chi tiết người dùng')).not.toBeInTheDocument();
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
  });

  it('redirects when nobody is signed in', () => {
    signInAs(null);
    renderAt('/users');
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
  });
});
