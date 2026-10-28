import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { authService } from '../services/authService';

vi.mock('../services/api', () => ({
  checkBackendHealth: vi.fn().mockResolvedValue(null),
  getBackendInfo: vi.fn().mockResolvedValue(null),
}));

vi.mock('../services/authService', () => ({
  authService: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

const signInAs = (role: string | null) => {
  vi.mocked(authService.getCurrentUser).mockReturnValue(
    (role ? { id: 1, username: 'tester', fullName: 'Test User', role } : null) as never
  );
};

const renderLayout = () =>
  render(
    <MemoryRouter>
      <MainLayout />
    </MemoryRouter>
  );

describe('MainLayout role-based menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "Quản lý Người dùng" for SYSTEM_ADMIN', async () => {
    signInAs('SYSTEM_ADMIN');
    renderLayout();
    expect(await screen.findByText('Quản lý Người dùng')).toBeInTheDocument();
  });

  it.each(['POS_STAFF', 'OPERATIONS_MANAGER', 'PASSENGER'])(
    'hides "Quản lý Người dùng" for %s',
    async (role) => {
      signInAs(role);
      renderLayout();
      expect(await screen.findByText('Quản lý Đội tàu')).toBeInTheDocument();
      expect(screen.queryByText('Quản lý Người dùng')).not.toBeInTheDocument();
    }
  );

  it('hides the menu when there is no signed-in user', async () => {
    signInAs(null);
    renderLayout();
    expect(await screen.findByText('Quản lý Đội tàu')).toBeInTheDocument();
    expect(screen.queryByText('Quản lý Người dùng')).not.toBeInTheDocument();
  });
});
