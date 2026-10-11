import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StopFormModal } from './StopFormModal';
import type { Port } from '../../services/portStopService';

const mockPorts: Port[] = [
  {
    id: 1,
    name: 'Cảng Tuần Châu',
    code: 'VN-TCH',
    country: 'Việt Nam',
    city: 'Hạ Long',
    timezone: 'Asia/Ho_Chi_Minh',
    active: true,
  },
];

describe('StopFormModal - Arrival & Departure Time Validation (KAN-111)', () => {
  it('validates departure time must be after arrival time', () => {
    const onSubmit = vi.fn();
    render(
      <StopFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        ports={mockPorts}
      />
    );

    fireEvent.change(screen.getByLabelText(/Cảng Ghé/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Thời Gian Cập Cảng \(Arrival\)/i), {
      target: { value: '2026-10-15T14:00' },
    });
    fireEvent.change(screen.getByLabelText(/Thời Gian Rời Cảng \(Departure\)/i), {
      target: { value: '2026-10-15T12:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu Điểm Dừng/i }));

    expect(screen.getByText('Thời gian rời cảng phải sau thời gian cập cảng')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates allAboardTime must be between arrival and departure', () => {
    const onSubmit = vi.fn();
    render(
      <StopFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        ports={mockPorts}
      />
    );

    fireEvent.change(screen.getByLabelText(/Cảng Ghé/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Thời Gian Cập Cảng \(Arrival\)/i), {
      target: { value: '2026-10-15T10:00' },
    });
    fireEvent.change(screen.getByLabelText(/Thời Gian Rời Cảng \(Departure\)/i), {
      target: { value: '2026-10-15T18:00' },
    });
    fireEvent.change(screen.getByLabelText(/Thời Gian Lên Tàu \(All-Aboard\)/i), {
      target: { value: '2026-10-15T19:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu Điểm Dừng/i }));

    expect(
      screen.getByText('Giờ lên tàu (all-aboard) phải nằm giữa giờ cập cảng và rời cảng')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates stop times must fall within tour start and end dates', () => {
    const onSubmit = vi.fn();
    render(
      <StopFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        ports={mockPorts}
        tourStartDate="2026-10-15"
        tourEndDate="2026-10-18"
      />
    );

    fireEvent.change(screen.getByLabelText(/Cảng Ghé/i), { target: { value: '1' } });
    // Earlier than tour start
    fireEvent.change(screen.getByLabelText(/Thời Gian Cập Cảng \(Arrival\)/i), {
      target: { value: '2026-10-14T10:00' },
    });
    // Later than tour end
    fireEvent.change(screen.getByLabelText(/Thời Gian Rời Cảng \(Departure\)/i), {
      target: { value: '2026-10-19T10:00' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Lưu Điểm Dừng/i }));

    expect(
      screen.getByText('Thời gian cập cảng không thể trước ngày bắt đầu tour (2026-10-15)')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
