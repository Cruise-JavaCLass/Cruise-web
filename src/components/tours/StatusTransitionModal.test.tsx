import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatusTransitionModal } from './StatusTransitionModal';
import type { CruiseTour } from '../../services/tourService';

const mockDraftTour: CruiseTour = {
  id: 1,
  name: 'Hải Trình Kỳ Quan Vịnh Bắc Bộ',
  code: 'TOUR-HL-001',
  durationDays: 4,
  durationNights: 3,
  departurePort: 'Cảng Tuần Châu',
  destinationPort: 'Cảng Tuần Châu',
  startDate: '2026-10-15',
  endDate: '2026-10-18',
  maxCapacity: 2000,
  basePrice: 15500000,
  currency: 'VND',
  status: 'DRAFT',
  active: true,
};

const mockPublishedTour: CruiseTour = {
  ...mockDraftTour,
  id: 2,
  status: 'PUBLISHED',
};

const mockCompletedTour: CruiseTour = {
  ...mockDraftTour,
  id: 3,
  status: 'COMPLETED',
};

describe('StatusTransitionModal - Tour Status Changes and Validation (KAN-103)', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <StatusTransitionModal
        isOpen={false}
        onClose={vi.fn()}
        tour={mockDraftTour}
        onStatusChange={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders current status and allowed transition options for DRAFT tour', () => {
    render(
      <StatusTransitionModal
        isOpen={true}
        onClose={vi.fn()}
        tour={mockDraftTour}
        onStatusChange={vi.fn()}
      />
    );

    expect(screen.getByText('Chuyển Trạng Thái Tour')).toBeInTheDocument();
    expect(screen.getByText('Bản nháp (DRAFT)')).toBeInTheDocument();

    const select = screen.getByLabelText(/Chọn Trạng Thái Kế Tiếp:/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();

    const options = Array.from(select.options).map((opt) => opt.value);
    // DRAFT -> PUBLISHED, CANCELLED
    expect(options).toContain('PUBLISHED');
    expect(options).toContain('CANCELLED');
    expect(options).not.toContain('IN_PROGRESS');
    expect(options).not.toContain('COMPLETED');
  });

  it('shows validation error when submitting without selecting a status', () => {
    const onStatusChange = vi.fn();
    render(
      <StatusTransitionModal
        isOpen={true}
        onClose={vi.fn()}
        tour={mockDraftTour}
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Xác Nhận/i }));

    expect(screen.getByText('Vui lòng chọn trạng thái cần chuyển đổi')).toBeInTheDocument();
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('requires cancellation reason when target status is CANCELLED', () => {
    const onStatusChange = vi.fn();
    render(
      <StatusTransitionModal
        isOpen={true}
        onClose={vi.fn()}
        tour={mockPublishedTour}
        onStatusChange={onStatusChange}
      />
    );

    const select = screen.getByLabelText(/Chọn Trạng Thái Kế Tiếp:/i);
    fireEvent.change(select, { target: { value: 'CANCELLED' } });

    expect(screen.getByLabelText(/Lý Do Hủy Tour/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Xác Nhận/i }));

    expect(screen.getByText('Vui lòng nhập lý do hủy tour (thời tiết, kỹ thuật, an toàn...)')).toBeInTheDocument();
    expect(onStatusChange).not.toHaveBeenCalled();
  });

  it('successfully transitions to CANCELLED with valid reason', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <StatusTransitionModal
        isOpen={true}
        onClose={onClose}
        tour={mockPublishedTour}
        onStatusChange={onStatusChange}
      />
    );

    const select = screen.getByLabelText(/Chọn Trạng Thái Kế Tiếp:/i);
    fireEvent.change(select, { target: { value: 'CANCELLED' } });

    const reasonInput = screen.getByLabelText(/Lý Do Hủy Tour/i);
    fireEvent.change(reasonInput, { target: { value: 'Thời tiết biển động cấp 8' } });

    fireEvent.click(screen.getByRole('button', { name: /Xác Nhận/i }));

    expect(onStatusChange).toHaveBeenCalledWith(2, 'CANCELLED', 'Thời tiết biển động cấp 8');
  });

  it('successfully changes status without cancellation reason for non-cancelled state', async () => {
    const onStatusChange = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <StatusTransitionModal
        isOpen={true}
        onClose={onClose}
        tour={mockDraftTour}
        onStatusChange={onStatusChange}
      />
    );

    const select = screen.getByLabelText(/Chọn Trạng Thái Kế Tiếp:/i);
    fireEvent.change(select, { target: { value: 'PUBLISHED' } });

    fireEvent.click(screen.getByRole('button', { name: /Xác Nhận/i }));

    expect(onStatusChange).toHaveBeenCalledWith(1, 'PUBLISHED', undefined);
  });

  it('disables confirmation and shows alert when tour is COMPLETED (no allowed transitions)', () => {
    render(
      <StatusTransitionModal
        isOpen={true}
        onClose={vi.fn()}
        tour={mockCompletedTour}
        onStatusChange={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Tour đã ở trạng thái kết thúc \(COMPLETED\)\. Không thể chuyển đổi trạng thái tiếp theo\./i)
    ).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Xác Nhận/i });
    expect(submitBtn).toBeDisabled();
  });
});
