import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ActivitiesPage } from './ActivitiesPage';
import * as activityService from '../services/activityService';

const mockActivities = activityService.INITIAL_ACTIVITIES.slice(0, 3);

describe('ActivitiesPage Component Tests (KAN-139)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(activityService, 'fetchActivitiesPaged').mockResolvedValue({
      content: mockActivities,
      totalElements: 3,
      totalPages: 1,
      size: 50,
      number: 0,
    });
  });

  it('renders page header and list of activities successfully', async () => {
    render(
      <BrowserRouter>
        <ActivitiesPage />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Quản Lý Hoạt Động/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Yoga Bình Minh Trên Boong Tàu')).toBeInTheDocument();
      expect(screen.getByText('Gala Dinner & Vũ Điệu Hoàng Gia')).toBeInTheDocument();
      expect(screen.getByText(/Lớp Học Nấu Ăn Ẩm Thực Ý/)).toBeInTheDocument();
    });
  });

  it('filters activities when user types into keyword search input', async () => {
    render(
      <BrowserRouter>
        <ActivitiesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Yoga Bình Minh Trên Boong Tàu')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/VD: Yoga, Grand Ballroom, Nấu ăn.../i);
    fireEvent.change(searchInput, { target: { value: 'Yoga' } });

    await waitFor(() => {
      expect(activityService.fetchActivitiesPaged).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ keyword: 'Yoga' })
      );
    });
  });

  it('filters activities by category badge buttons', async () => {
    render(
      <BrowserRouter>
        <ActivitiesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Yoga Bình Minh Trên Boong Tàu')).toBeInTheDocument();
    });

    const wellnessBtn = screen.getByRole('button', { name: 'Wellness & Sức Khỏe' });
    fireEvent.click(wellnessBtn);

    await waitFor(() => {
      expect(activityService.fetchActivitiesPaged).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ category: 'Wellness & Sức Khỏe' })
      );
    });
  });

  it('filters activities by day number dropdown', async () => {
    render(
      <BrowserRouter>
        <ActivitiesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Yoga Bình Minh Trên Boong Tàu')).toBeInTheDocument();
    });

    const daySelect = screen.getByDisplayValue('Tất cả các ngày');
    fireEvent.change(daySelect, { target: { value: '2' } });

    await waitFor(() => {
      expect(activityService.fetchActivitiesPaged).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ dayNumber: 2 })
      );
    });
  });

  it('opens ActivityModal when clicking "Tạo Hoạt Động Mới"', async () => {
    render(
      <BrowserRouter>
        <ActivitiesPage />
      </BrowserRouter>
    );

    const createBtn = screen.getByRole('button', { name: /Tạo Hoạt Động Mới/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Tạo Hoạt Động Du Thuyền Mới')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/VD: Yoga Bình Minh Trên Boong Tàu/i)).toBeInTheDocument();
  });

  it('opens ActivityStatusModal when clicking on activity status badge', async () => {
    render(
      <BrowserRouter>
        <ActivitiesPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Yoga Bình Minh Trên Boong Tàu')).toBeInTheDocument();
    });

    const statusBtns = screen.getAllByTitle('Bấm để đổi trạng thái');
    expect(statusBtns.length).toBeGreaterThan(0);
    fireEvent.click(statusBtns[0]);

    expect(screen.getByText('Chuyển Trạng Thái Hoạt Động')).toBeInTheDocument();
  });
});
