import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ItineraryPage } from './ItineraryPage';
import * as tourService from '../services/tourService';
import * as shipService from '../services/shipService';

const mockShips = [
  {
    id: 1,
    name: 'Halong Grand Harmony',
    code: 'SHIP-001',
    operator: 'Paradise Vietnam Cruises',
    capacity: 2400,
    crewCapacity: 750,
    totalCabins: 1100,
    totalDecks: 14,
    status: 'ACTIVE' as const,
    active: true,
  },
];

const mockTours: tourService.CruiseTour[] = [
  {
    id: 1,
    name: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ',
    code: 'TOUR-HL-001',
    shipId: 1,
    shipName: 'Halong Grand Harmony',
    shipCode: 'SHIP-001',
    durationDays: 4,
    durationNights: 3,
    departurePort: 'Cảng Tuần Châu (Hạ Long)',
    destinationPort: 'Cảng Tuần Châu (Hạ Long)',
    startDate: '2026-10-15',
    endDate: '2026-10-18',
    maxCapacity: 2000,
    basePrice: 15500000,
    currency: 'VND',
    status: 'PUBLISHED',
    active: true,
  },
  {
    id: 2,
    name: 'Đảo Ngọc Phú Quốc 3N2Đ',
    code: 'TOUR-PQ-003',
    durationDays: 3,
    durationNights: 2,
    departurePort: 'Cảng An Thới (Phú Quốc)',
    destinationPort: 'Cảng An Thới (Phú Quốc)',
    startDate: '2026-11-01',
    endDate: '2026-11-03',
    maxCapacity: 1000,
    basePrice: 9800000,
    currency: 'VND',
    status: 'DRAFT',
    active: true,
  },
];

describe('ItineraryPage (Cruise Tour Management Interface)', () => {
  beforeEach(() => {
    vi.spyOn(tourService, 'getTours').mockResolvedValue(mockTours);
    vi.spyOn(shipService, 'getShips').mockResolvedValue(mockShips);
  });

  it('renders page header and list of tours', async () => {
    render(
      <BrowserRouter>
        <ItineraryPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Quản Lý Tour Du Lịch Du Thuyền/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
      expect(screen.getByText('Đảo Ngọc Phú Quốc 3N2Đ')).toBeInTheDocument();
    });
  });

  it('filters tours by search keyword', async () => {
    render(
      <BrowserRouter>
        <ItineraryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm theo tên tour, mã, cảng, tàu.../i);
    fireEvent.change(searchInput, { target: { value: 'Phú Quốc' } });

    expect(screen.queryByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).not.toBeInTheDocument();
    expect(screen.getByText('Đảo Ngọc Phú Quốc 3N2Đ')).toBeInTheDocument();
  });

  it('filters tours by status dropdown', async () => {
    render(
      <BrowserRouter>
        <ItineraryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/Lọc theo trạng thái/i);
    fireEvent.change(statusSelect, { target: { value: 'DRAFT' } });

    expect(screen.queryByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).not.toBeInTheDocument();
    expect(screen.getByText('Đảo Ngọc Phú Quốc 3N2Đ')).toBeInTheDocument();
  });

  it('opens and closes TourFormModal when clicking "Tạo Hải Trình Mới"', async () => {
    render(
      <BrowserRouter>
        <ItineraryPage />
      </BrowserRouter>
    );

    const createBtn = screen.getByRole('button', { name: /Tạo Hải Trình Mới/i });
    fireEvent.click(createBtn);

    expect(screen.getByText('Tạo Hải Trình Tour Du Thuyền Mới')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Hủy Bỏ/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Tạo Hải Trình Tour Du Thuyền Mới')).not.toBeInTheDocument();
    });
  });

  it('opens StatusTransitionModal when clicking the status transition button', async () => {
    render(
      <BrowserRouter>
        <ItineraryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
    });

    const transitionBtns = screen.getAllByTitle('Chuyển trạng thái tour');
    fireEvent.click(transitionBtns[0]);

    expect(screen.getByText('Chuyển Trạng Thái Tour')).toBeInTheDocument();
  });

  it('opens TourFormModal prefilled when clicking edit button', async () => {
    render(
      <BrowserRouter>
        <ItineraryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
    });

    const editBtns = screen.getAllByTitle('Chỉnh sửa tour');
    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Cập Nhật Hải Trình Tour Du Lịch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('TOUR-HL-001')).toBeInTheDocument();
  });

  it('opens delete confirmation modal when clicking delete button', async () => {
    render(
      <BrowserRouter>
        <ItineraryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Hải Trình Kỳ Quan Vịnh Bắc Bộ 4N3Đ')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle('Xóa tour');
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByText('Xác Nhận Xóa Tour')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Xác Nhận Xóa Tour');
  });
});
