import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminAuthGuard } from './AdminAuthGuard';
import { authService } from '../../services/authService';

describe('AdminAuthGuard Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('redirects to /login when user is not authenticated as staff', () => {
    render(
      <MemoryRouter initialEntries={['/ships']}>
        <Routes>
          <Route path="login" element={<div data-testid="login-page">Login Page</div>} />
          <Route element={<AdminAuthGuard />}>
            <Route path="ships" element={<div data-testid="protected-content">Ships Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders protected child routes when authenticated as crew / staff', () => {
    authService.setSession('token', {
      id: 1,
      username: 'admin',
      fullName: 'Huy Trần Gia',
      role: 'SYSTEM_ADMIN',
    });

    render(
      <MemoryRouter initialEntries={['/ships']}>
        <Routes>
          <Route path="login" element={<div data-testid="login-page">Login Page</div>} />
          <Route element={<AdminAuthGuard />}>
            <Route path="ships" element={<div data-testid="protected-content">Ships Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
});
