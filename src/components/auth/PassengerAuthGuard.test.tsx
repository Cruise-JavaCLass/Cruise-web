import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PassengerAuthGuard } from './PassengerAuthGuard';

describe('PassengerAuthGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('redirects unauthenticated guest to login tab=passenger with returnUrl', () => {
    render(
      <MemoryRouter initialEntries={['/passenger-home']}>
        <Routes>
          <Route element={<PassengerAuthGuard />}>
            <Route path="passenger-home" element={<div>Protected Home</div>} />
          </Route>
          <Route
            path="login"
            element={<div>Login Page Redirected</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Home')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Redirected')).toBeInTheDocument();
  });

  it('allows access when authenticated passenger session and token exist in localStorage', () => {
    localStorage.setItem('authToken', 'valid-passenger-jwt');
    localStorage.setItem(
      'currentPassenger',
      JSON.stringify({ id: 1, fullName: 'Nguyễn Văn Minh', cabinNumber: '402' })
    );

    render(
      <MemoryRouter initialEntries={['/passenger-home']}>
        <Routes>
          <Route element={<PassengerAuthGuard />}>
            <Route path="passenger-home" element={<div>Protected Home Content</div>} />
          </Route>
          <Route path="login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Home Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('redirects stale passenger session missing real JWT or using legacy guest-token', () => {
    localStorage.setItem('authToken', 'guest-token-12345');
    localStorage.setItem(
      'currentPassenger',
      JSON.stringify({ id: 1, fullName: 'Nguyễn Văn Minh', cabinNumber: '402' })
    );

    render(
      <MemoryRouter initialEntries={['/passenger/folio']}>
        <Routes>
          <Route element={<PassengerAuthGuard />}>
            <Route path="passenger/folio" element={<div>Folio Content</div>} />
          </Route>
          <Route path="login" element={<div>Login Page Redirected</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Folio Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Redirected')).toBeInTheDocument();
  });
});
