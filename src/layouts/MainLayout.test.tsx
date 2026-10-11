import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import * as apiModule from '../services/api';

vi.mock('../services/api', () => ({
  checkBackendHealth: vi.fn(),
  getBackendInfo: vi.fn(),
}));

describe('MainLayout (Layout & Async State Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders sidebar brand and all 5 navigation links', async () => {
    vi.mocked(apiModule.checkBackendHealth).mockResolvedValue(null);
    vi.mocked(apiModule.getBackendInfo).mockResolvedValue(null);

    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CRUISE MANAGER')).toBeInTheDocument();
      expect(screen.getByText('Grand Pearl Voyager')).toBeInTheDocument();
      expect(screen.getByText('Dashboard Tổng quan')).toBeInTheDocument();
      expect(screen.getByText('Quản lý Đội tàu')).toBeInTheDocument();
      expect(screen.getByText('Hải trình & Cảng dừng')).toBeInTheDocument();
      expect(screen.getByText('Hoạt động & Excursion')).toBeInTheDocument();
      expect(screen.getByText('POS & Chi tiêu Onboard')).toBeInTheDocument();
      expect(screen.getByText('Hành khách & Check-in')).toBeInTheDocument();
    });
  });

  it('displays Online status badge when backend health check succeeds', async () => {
    vi.mocked(apiModule.checkBackendHealth).mockResolvedValue({
      status: 'UP',
      serverTime: '2026-10-10T20:00:00Z',
      uptimeSeconds: 120,
      memory: { totalMB: 512, usedMB: 128, freeMB: 384 },
    });
    vi.mocked(apiModule.getBackendInfo).mockResolvedValue({
      projectName: 'Cruise Activity and Service Management System',
      module: 'Backend Gateway',
      version: '1.0.0-SNAPSHOT',
      javaVersion: '21',
      jiraStory: 'KAN-37',
      jiraTask: 'KAN-39',
    });

    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Online \(Port 8080 - UP\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Cruise Activity and Service Management System \(1.0.0-SNAPSHOT\)/i)).toBeInTheDocument();
    });
  });

  it('displays Offline status badge when backend is unreachable', async () => {
    vi.mocked(apiModule.checkBackendHealth).mockResolvedValue(null);
    vi.mocked(apiModule.getBackendInfo).mockResolvedValue(null);

    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Offline \(localhost:8080\)/i)).toBeInTheDocument();
    });
  });

  it('triggers manual refresh when user clicks the Ping Backend button', async () => {
    const user = userEvent.setup();
    vi.mocked(apiModule.checkBackendHealth).mockResolvedValue(null);
    vi.mocked(apiModule.getBackendInfo).mockResolvedValue(null);

    render(
      <MemoryRouter>
        <MainLayout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Ping Backend')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Ping Backend');
    await user.click(refreshButton);

    await waitFor(() => {
      expect(apiModule.checkBackendHealth).toHaveBeenCalled();
      expect(apiModule.getBackendInfo).toHaveBeenCalled();
    });
  });
});
