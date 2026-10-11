import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StopFormModal } from './StopFormModal';
import type { Port } from '../../services/portStopService';

const portsDataset: Port[] = [
  {
    id: 101,
    name: 'Cảng Quốc Tế Tuần Châu',
    code: 'VN-TCH',
    country: 'Việt Nam',
    city: 'Hạ Long',
    timezone: 'Asia/Ho_Chi_Minh',
    active: true,
  },
];

const renderModal = (
  onSubmit = vi.fn(),
  tourDates?: { start: string; end: string }
) => {
  render(
    <StopFormModal
      isOpen={true}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      ports={portsDataset}
      tourStartDate={tourDates?.start}
      tourEndDate={tourDates?.end}
    />
  );
  return {
    fillField: (label: RegExp, val: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: val } }),
    submit: () => fireEvent.click(screen.getByRole('button', { name: /Lưu Điểm Dừng/i })),
  };
};

describe('StopFormModal - Arrival & Departure Time Validation (KAN-111)', () => {
  it('validates departure time must be after arrival time', () => {
    const onSubmit = vi.fn();
    const { fillField, submit } = renderModal(onSubmit);

    fillField(/Cảng Ghé/i, '101');
    fillField(/Thời Gian Cập Cảng \(Arrival\)/i, '2026-10-15T14:00');
    fillField(/Thời Gian Rời Cảng \(Departure\)/i, '2026-10-15T12:00');
    submit();

    expect(screen.getByText('Thời gian rời cảng phải sau thời gian cập cảng')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates allAboardTime must be between arrival and departure', () => {
    const onSubmit = vi.fn();
    const { fillField, submit } = renderModal(onSubmit);

    fillField(/Cảng Ghé/i, '101');
    fillField(/Thời Gian Cập Cảng \(Arrival\)/i, '2026-10-15T10:00');
    fillField(/Thời Gian Rời Cảng \(Departure\)/i, '2026-10-15T18:00');
    fillField(/Thời Gian Lên Tàu \(All-Aboard\)/i, '2026-10-15T19:00');
    submit();

    expect(
      screen.getByText('Giờ lên tàu (all-aboard) phải nằm giữa giờ cập cảng và rời cảng')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates stop times must fall within tour start and end dates', () => {
    const onSubmit = vi.fn();
    const { fillField, submit } = renderModal(onSubmit, {
      start: '2026-10-15',
      end: '2026-10-18',
    });

    fillField(/Cảng Ghé/i, '101');
    fillField(/Thời Gian Cập Cảng \(Arrival\)/i, '2026-10-14T10:00');
    fillField(/Thời Gian Rời Cảng \(Departure\)/i, '2026-10-19T10:00');
    submit();

    expect(
      screen.getByText('Thời gian cập cảng không thể trước ngày bắt đầu tour (2026-10-15)')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
