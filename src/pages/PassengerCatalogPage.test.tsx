import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PassengerCatalogPage } from '../pages/PassengerCatalogPage';
import { CatalogItemCard } from '../components/passenger/CatalogItemCard';
import { CatalogFilterBar } from '../components/passenger/CatalogFilterBar';
import { CatalogDetailModal } from '../components/passenger/CatalogDetailModal';
import { passengerCatalogService, type PassengerCatalogItem } from '../services/passengerCatalogService';

const mockItem: PassengerCatalogItem = {
  id: 101,
  tourId: 1,
  itemType: 'SHORE_EXCURSION',
  title: 'Halong Bay Kayak Expedition',
  description: 'Paddle through emerald waters and explore mysterious karst caves.',
  category: 'ADVENTURE',
  locationOrPort: 'Halong International Port',
  portId: 10,
  dayNumber: 2,
  activityDate: '2026-10-19',
  startTime: '08:00',
  endTime: '15:30',
  gatheringTime: '08:00',
  departureTime: '08:30',
  returnToShipTime: '15:30',
  maxCapacity: 30,
  currentParticipants: 30,
  remainingCapacity: 0,
  isIncluded: false,
  price: 120,
  currency: 'USD',
  status: 'SCHEDULED',
  isSoldOut: true
};

const mockIncludedItem: PassengerCatalogItem = {
  id: 102,
  tourId: 1,
  itemType: 'ONBOARD_ACTIVITY',
  title: 'Sunrise Deck Yoga',
  description: 'Gentle yoga stretching facing the morning ocean breeze.',
  category: 'WELLNESS',
  locationOrPort: 'Deck 11 Sun Deck',
  dayNumber: 1,
  activityDate: '2026-10-18',
  startTime: '06:30',
  endTime: '07:30',
  maxCapacity: 20,
  currentParticipants: 8,
  remainingCapacity: 12,
  isIncluded: true,
  price: 0,
  currency: 'USD',
  status: 'SCHEDULED',
  isSoldOut: false
};

describe('CatalogItemCard Component', () => {
  it('renders activity details and sold-out indicator correctly', () => {
    const handleSelect = vi.fn();
    render(<CatalogItemCard item={mockItem} onSelect={handleSelect} />);

    expect(screen.getByText('Halong Bay Kayak Expedition')).toBeInTheDocument();
    expect(screen.getByText('Tour trên bờ')).toBeInTheDocument();
    expect(screen.getByText('Đã hết chỗ')).toBeInTheDocument();
    expect(screen.getByText('Ngày 2')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /Xem chi tiết \(Hết chỗ\)/i });
    fireEvent.click(button);
    expect(handleSelect).toHaveBeenCalledWith(mockItem);
  });

  it('renders included free activity badge and available capacity', () => {
    const handleSelect = vi.fn();
    render(<CatalogItemCard item={mockIncludedItem} onSelect={handleSelect} />);

    expect(screen.getByText('Sunrise Deck Yoga')).toBeInTheDocument();
    expect(screen.getByText('Trên tàu')).toBeInTheDocument();
    expect(screen.getByText('Đã bao gồm')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});

describe('CatalogFilterBar Component', () => {
  it('handles search input and filter buttons', async () => {
    const user = userEvent.setup();
    const handleFilterChange = vi.fn();

    render(
      <CatalogFilterBar
        filters={{ keyword: '', page: 0, size: 20 }}
        onFilterChange={handleFilterChange}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm theo tên hoạt động/i);
    await user.type(searchInput, 'Kayak');
    expect(handleFilterChange).toHaveBeenCalled();

    const tourBroButton = screen.getByRole('button', { name: /Tour trên bờ/i });
    await user.click(tourBroButton);
    expect(handleFilterChange).toHaveBeenCalledWith({ itemType: 'SHORE_EXCURSION' });

    const includedButton = screen.getByRole('button', { name: /Đã bao gồm/i });
    await user.click(includedButton);
    expect(handleFilterChange).toHaveBeenCalledWith({ isIncluded: true });
  });

  it('displays reset button when filters are active', async () => {
    const user = userEvent.setup();
    const handleFilterChange = vi.fn();

    render(
      <CatalogFilterBar
        filters={{ keyword: 'Yoga', page: 0, size: 20 }}
        onFilterChange={handleFilterChange}
      />
    );

    const resetButton = screen.getByRole('button', { name: /Xóa bộ lọc/i });
    expect(resetButton).toBeInTheDocument();

    await user.click(resetButton);
    expect(handleFilterChange).toHaveBeenCalledWith({
      keyword: '',
      itemType: undefined,
      isIncluded: undefined,
      dayNumber: undefined
    });
  });
});

describe('CatalogDetailModal Component', () => {
  it('displays operational timeline and closes when requested', () => {
    const handleClose = vi.fn();
    render(<CatalogDetailModal item={mockItem} onClose={handleClose} />);

    expect(screen.getByText('Halong Bay Kayak Expedition')).toBeInTheDocument();
    expect(screen.getByText('Lịch trình vận hành chi tiết')).toBeInTheDocument();
    expect(screen.getByText('Giờ tập trung')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('15:30')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /Đóng/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

describe('PassengerCatalogPage Integration', () => {
  it('renders hero title and loads catalog items', async () => {
    vi.spyOn(passengerCatalogService, 'getCatalogItems').mockResolvedValueOnce({
      content: [mockItem, mockIncludedItem],
      totalElements: 2,
      totalPages: 1,
      size: 20,
      number: 0
    });

    render(<PassengerCatalogPage />);

    expect(screen.getByText('Duyệt Hoạt Động & Tour Bờ')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Halong Bay Kayak Expedition')).toBeInTheDocument();
      expect(screen.getByText('Sunrise Deck Yoga')).toBeInTheDocument();
    });
  });
});
