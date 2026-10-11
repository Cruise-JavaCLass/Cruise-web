import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TourFormModal } from './TourFormModal';
import type { CruiseTour } from '../../services/tourService';
import type { Ship } from '../../services/shipService';

const mockShips: Ship[] = [
  {
    id: 1,
    name: 'Halong Grand Harmony',
    code: 'SHIP-001',
    operator: 'Paradise Vietnam',
    capacity: 2000,
    crewCapacity: 500,
    totalCabins: 800,
    totalDecks: 10,
    status: 'ACTIVE',
    active: true,
  },
];

const mockTour: CruiseTour = {
  id: 1,
  name: 'Hải Trình Vịnh Hạ Long',
  code: 'TOUR-HL-001',
  description: 'Mô tả chi tiết',
  shipId: 1,
  durationDays: 4,
  durationNights: 3,
  departurePort: 'Cảng Tuần Châu',
  destinationPort: 'Cảng Tuần Châu',
  startDate: '2026-10-15',
  endDate: '2026-10-18',
  maxCapacity: 1500,
  basePrice: 15000000,
  currency: 'VND',
  status: 'DRAFT',
  active: true,
};

describe('TourFormModal Component (KAN-101)', () => {
  it('renders in create mode with empty fields', () => {
    render(
      <TourFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        ships={mockShips}
      />
    );

    expect(screen.getByText('Tạo Hải Trình Tour Du Thuyền Mới')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên Tour Hải Trình/i)).toHaveValue('');
  });

  it('renders in edit mode populated with tour details', () => {
    render(
      <TourFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        tour={mockTour}
        ships={mockShips}
      />
    );

    expect(screen.getByText('Cập Nhật Hải Trình Tour Du Lịch')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tên Tour Hải Trình/i)).toHaveValue('Hải Trình Vịnh Hạ Long');
    expect(screen.getByLabelText(/Mã Tour Định Danh/i)).toHaveValue('TOUR-HL-001');
  });

  it('shows error messages when required fields are missing on submit', async () => {
    const onSubmit = vi.fn();
    render(
      <TourFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        ships={mockShips}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Tạo Tour Hải Trình/i }));

    expect(await screen.findByText('Tên tour không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Mã tour không được để trống')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates duration days and nights rule (nights <= days)', async () => {
    render(
      <TourFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        tour={mockTour}
        ships={mockShips}
      />
    );

    const nightsInput = screen.getByLabelText(/Số Đêm/i);
    fireEvent.change(nightsInput, { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /Lưu Thay Đổi/i }));

    expect(await screen.findByText('Số đêm tour không thể lớn hơn số ngày tour')).toBeInTheDocument();
  });

  it('validates maxCapacity against selected ship capacity', async () => {
    render(
      <TourFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        tour={mockTour}
        ships={mockShips}
      />
    );

    const capacityInput = screen.getByLabelText(/Sức Chứa Tối Đa/i);
    fireEvent.change(capacityInput, { target: { value: '2500' } });

    fireEvent.click(screen.getByRole('button', { name: /Lưu Thay Đổi/i }));

    expect(await screen.findByText(/không thể vượt quá sức chứa tàu \(2000\)/i)).toBeInTheDocument();
  });

  it('submits valid form and triggers onSubmit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <TourFormModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        tour={mockTour}
        ships={mockShips}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Lưu Thay Đổi/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
