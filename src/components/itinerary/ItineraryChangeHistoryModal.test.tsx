import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ItineraryChangeHistoryModal } from './ItineraryChangeHistoryModal';
import type { ItineraryChangeHistoryItem } from '../../services/dailyItineraryService';

describe('ItineraryChangeHistoryModal Component (KAN-131)', () => {
  const dummyHistory: ItineraryChangeHistoryItem[] = [
    {
      id: 501,
      timestamp: '2026-10-12 11:00',
      author: 'Captain Jack Sparrow',
      action: 'ĐIỀU CHỈNH HẢI TRÌNH',
      description: 'Thay đổi lộ trình tránh bão biển Đông',
      dayNumber: 2,
      details: 'Chuyển hướng về phía tây nam 15 hải lý',
      field: 'Tốc độ hành trình',
      oldValue: '18 knots',
      newValue: '22 knots',
    },
  ];

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ItineraryChangeHistoryModal
        isOpen={false}
        onClose={vi.fn()}
        tourName="Hải Trình Kỳ Quan"
        history={dummyHistory}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays empty state message when history array is empty', () => {
    render(
      <ItineraryChangeHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        tourName="Hải Trình Kỳ Quan"
        history={[]}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Lịch Sử Thay Đổi Lịch Trình')).toBeInTheDocument();
    expect(screen.getByText('Hải Trình Kỳ Quan')).toBeInTheDocument();
    expect(
      screen.getByText('Chưa có bản ghi thay đổi nào cho hải trình này.')
    ).toBeInTheDocument();
  });

  it('renders history items with author, action, day, timestamp and field diffs', () => {
    render(
      <ItineraryChangeHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        tourName="Hải Trình Kỳ Quan 4N3Đ"
        history={dummyHistory}
      />
    );

    expect(screen.getByText('Captain Jack Sparrow')).toBeInTheDocument();
    expect(screen.getByText('ĐIỀU CHỈNH HẢI TRÌNH')).toBeInTheDocument();
    expect(screen.getByText('Thay đổi lộ trình tránh bão biển Đông')).toBeInTheDocument();
    expect(screen.getByText('Ngày 2')).toBeInTheDocument();
    expect(screen.getByText('2026-10-12 11:00')).toBeInTheDocument();
    expect(screen.getByText('Chuyển hướng về phía tây nam 15 hải lý')).toBeInTheDocument();
    expect(screen.getByText(/Tốc độ hành trình:/i)).toBeInTheDocument();
    expect(screen.getByText('18 knots')).toBeInTheDocument();
    expect(screen.getByText('22 knots')).toBeInTheDocument();
  });

  it('calls onClose callback when clicking the X close button or footer close button', () => {
    const handleClose = vi.fn();
    render(
      <ItineraryChangeHistoryModal
        isOpen={true}
        onClose={handleClose}
        tourName="Hải Trình Kỳ Quan"
        history={dummyHistory}
      />
    );

    const xButton = screen.getByRole('button', { name: /Đóng lịch sử thay đổi/i });
    fireEvent.click(xButton);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const footerCloseButton = screen.getByRole('button', { name: /^Đóng$/i });
    fireEvent.click(footerCloseButton);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
