import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PassengerLayout } from './PassengerLayout';

describe('PassengerLayout Component & Accessibility Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders guest brand, cabin badge, and all passenger navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/passenger-home']}>
        <Routes>
          <Route element={<PassengerLayout />}>
            <Route path="passenger-home" element={<div data-testid="guest-content">Welcome Guest</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Verify luxury guest brand
    expect(screen.getByText('GRAND PEARL')).toBeInTheDocument();
    expect(screen.getByText('VOYAGER')).toBeInTheDocument();
    expect(screen.getByText('Guest Experience Portal')).toBeInTheDocument();

    // Verify guest cabin info defaults to unauthenticated state
    expect(screen.getByText('Chưa đăng nhập')).toBeInTheDocument();
    expect(screen.getByText(/Khách vãng lai/i)).toBeInTheDocument();

    // Verify all passenger navigation links exist
    expect(screen.getAllByText('Trang Chủ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Thẻ Lên Tàu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lịch Trình').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ví Chi Tiêu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tour Của Tôi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Khám Phá Dịch Vụ').length).toBeGreaterThan(0);

    // Verify child content is displayed
    expect(screen.getByTestId('guest-content')).toHaveTextContent('Welcome Guest');
  });

  it('does NOT render admin operations sidebar or telemetry widgets', () => {
    render(
      <MemoryRouter initialEntries={['/passenger-home']}>
        <Routes>
          <Route element={<PassengerLayout />}>
            <Route path="passenger-home" element={<div>Guest Portal</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Ensure administrative sidebar elements are NOT present in passenger view
    expect(screen.queryByText('CRUISE MANAGER')).not.toBeInTheDocument();
    expect(screen.queryByText('MARITIME COMPUTE')).not.toBeInTheDocument();
    expect(screen.queryByText('Backend Gateway')).not.toBeInTheDocument();
    expect(screen.queryByText(/Offline \(localhost:8080\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Huy Trần Gia')).not.toBeInTheDocument();
    expect(screen.queryByText('Fleet Director')).not.toBeInTheDocument();
  });

  it('reads stored passenger profile from localStorage when available', async () => {
    localStorage.setItem(
      'currentPassenger',
      JSON.stringify({
        id: 42,
        fullName: 'Eleanor Vance',
        cabinNumber: '9004',
        cabinCategory: 'Penthouse Royal',
      })
    );

    render(
      <MemoryRouter initialEntries={['/passenger-home']}>
        <Routes>
          <Route element={<PassengerLayout />}>
            <Route path="passenger-home" element={<div>Guest Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Eleanor Vance')).toBeInTheDocument();
      expect(screen.getByText(/Phòng 9004 • Penthouse Royal/i)).toBeInTheDocument();
    });
  });

  it('toggles mobile navigation drawer when clicking mobile menu button', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/passenger-home']}>
        <Routes>
          <Route element={<PassengerLayout />}>
            <Route path="passenger-home" element={<div>Mobile Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /mở menu khách/i });
    expect(toggleBtn).toBeInTheDocument();

    // Click to open mobile menu
    await user.click(toggleBtn);
    expect(screen.getByRole('button', { name: /đóng menu/i })).toBeInTheDocument();
    expect(screen.getByText(/Giờ du thuyền:/i)).toBeInTheDocument();

    // Click to close
    await user.click(toggleBtn);
    expect(screen.getByRole('button', { name: /mở menu khách/i })).toBeInTheDocument();
  });
});
