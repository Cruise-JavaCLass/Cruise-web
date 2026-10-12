import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ActivityDetailPage } from './ActivityDetailPage';
import * as activityService from '../services/activityService';

const mockActivity: activityService.OnboardActivity = {
  id: 1,
  tourId: 101,
  dayNumber: 2,
  title: 'Lớp Học Nấu Ăn Ẩm Thực Ý & Rượu Vang',
  description: 'Học cách làm pasta tươi thủ công và thưởng thức 4 dòng vang vùng Tuscany',
  category: 'Culinary & Ẩm Thực',
  location: 'Tầng 8 - Gourmet Culinary Studio',
  activityDate: '2026-11-02',
  startTime: '14:00',
  endTime: '16:00',
  maxCapacity: 25,
  currentParticipants: 20,
  price: 350000,
  isIncluded: false,
  status: 'SCHEDULED',
  active: true,
};

describe('ActivityDetailPage Component Tests (KAN-139)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders activity details with stats and guidelines', async () => {
    vi.spyOn(activityService, 'fetchActivityById').mockResolvedValue(mockActivity);

    render(
      <MemoryRouter initialEntries={['/activities/1']}>
        <Routes>
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
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
});
