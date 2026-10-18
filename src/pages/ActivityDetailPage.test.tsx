import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ActivityDetailPage } from './ActivityDetailPage';
import * as activityService from '../services/activityService';

const mockActivity: activityService.OnboardActivity = {
  ...activityService.INITIAL_ACTIVITIES[2],
  currentParticipants: 20,
};

describe('ActivityDetailPage Component Tests (KAN-141)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity details with stats and guidelines', async () => {
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValue(mockActivity);

    render(
      <MemoryRouter initialEntries={['/activities/1']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/activities" element={<div>Danh sách Hoạt động</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const titles = screen.getAllByText('Lớp Học Nấu Ăn Ẩm Thực Ý & Rượu Vang');
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Gourmet Culinary Studio/i)).toBeInTheDocument();
      expect(screen.getByText(/350/)).toBeInTheDocument();
      expect(screen.getByText(/Hải trình ngày #2/i)).toBeInTheDocument();
    });
  });

  it('renders empty/not-found state when activity does not exist', async () => {
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/activities/999']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy hoạt động')).toBeInTheDocument();
      expect(screen.getByText(/Quay lại Danh sách Hoạt động/i)).toBeInTheDocument();
    });
  });

  it('opens ActivityStatusModal when clicking "Đổi trạng thái"', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValue(mockActivity);

    render(
      <MemoryRouter initialEntries={['/activities/1']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/activities" element={<div>Danh sách Hoạt động</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Đổi trạng thái/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Đổi trạng thái/i }));

    expect(screen.getByText('Chuyển Trạng Thái Hoạt Động')).toBeInTheDocument();
  });

  it('opens ActivityModal in edit mode when clicking "Sửa thông tin"', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValue(mockActivity);

    render(
      <MemoryRouter initialEntries={['/activities/1']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/activities" element={<div>Danh sách Hoạt động</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sửa thông tin/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Sửa thông tin/i }));

    expect(screen.getByRole('heading', { name: /Cập Nhật Hoạt Động Du Thuyền/i })).toBeInTheDocument();
  });

  it('deletes activity when confirmed and navigates back', async () => {
    const user = userEvent.setup();
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValue(mockActivity);
    const spyDelete = vi.spyOn(activityService, 'deleteActivity').mockResolvedValueOnce(undefined);
    const spyConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/activities/1']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/activities" element={<div>Danh sách Hoạt động</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTitle('Xóa hoạt động')).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Xóa hoạt động'));

    expect(spyConfirm).toHaveBeenCalled();
    expect(spyDelete).toHaveBeenCalledWith(mockActivity.id);
  });
});
