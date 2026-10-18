import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ShipDetailPage } from './ShipDetailPage';
import * as shipService from '../services/shipService';

const mockShip: shipService.Ship = {
  id: 1,
  name: 'Test Ship',
  code: 'TS-001',
  operator: 'Test Operator',
  capacity: 1000,
  crewCapacity: 300,
  totalCabins: 500,
  totalDecks: 10,
  manufacturingYear: 2020,
  lengthMeters: 200,
  beamMeters: 30,
  draftMeters: 7,
  status: 'ACTIVE',
  description: 'A test ship for unit testing',
  amenities: 'Pool, Spa',
  imageUrl: 'https://example.com/image.jpg',
  active: true,
};

describe('ShipDetailPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    let resolvePromise: (value: shipService.Ship[]) => void;
    const promise = new Promise<shipService.Ship[]>((resolve) => {
      resolvePromise = resolve;
    });
    vi.spyOn(shipService, 'getShips').mockReturnValue(promise);

    render(
      <MemoryRouter initialEntries={['/ships/1']}>
        <Routes>
          <Route path="/ships/:id" element={<ShipDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Đang tải thông tin tàu...')).toBeInTheDocument();

    resolvePromise!([mockShip]);
    await waitFor(() => {
      expect(screen.queryByText('Đang tải thông tin tàu...')).not.toBeInTheDocument();
    });
  });

  it('renders "Not found" state when ship is not found', async () => {
    vi.spyOn(shipService, 'getShips').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/ships/999']}>
        <Routes>
          <Route path="/ships/:id" element={<ShipDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy tàu')).toBeInTheDocument();
      expect(screen.getByText('ID #999 không tồn tại trong hệ thống.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Về danh sách tàu/i })).toBeInTheDocument();
    });
  });

  it('renders ship details successfully', async () => {
    const mockGetShips = vi.spyOn(shipService, 'getShips').mockResolvedValue([mockShip]);

    render(
      <MemoryRouter initialEntries={['/ships/1']}>
        <Routes>
          <Route path="/ships/:id" element={<ShipDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockGetShips).toHaveBeenCalled();
      expect(screen.queryByText('Đang tải thông tin tàu...')).not.toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: /Test Ship/i })).toBeInTheDocument();
    expect(screen.getAllByText('TS-001').length).toBeGreaterThan(0);
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument();
    expect(screen.getByText('A test ship for unit testing')).toBeInTheDocument();

    // Stats
    expect(screen.getByText(mockShip.capacity.toLocaleString())).toBeInTheDocument(); // capacity
    expect(screen.getByText(mockShip.crewCapacity.toLocaleString())).toBeInTheDocument(); // crew capacity
    expect(screen.getByText(mockShip.totalCabins.toLocaleString())).toBeInTheDocument(); // total cabins
    expect(screen.getByText(mockShip.totalDecks.toString())).toBeInTheDocument(); // total decks
    expect(screen.getByText(`${mockShip.lengthMeters} m`)).toBeInTheDocument(); // length
    expect(screen.getByText(`${mockShip.beamMeters} m`)).toBeInTheDocument(); // beam
    expect(screen.getByText(`${mockShip.draftMeters} m`)).toBeInTheDocument(); // draft
    expect(screen.getByText('2020')).toBeInTheDocument(); // year

    expect(screen.getByText('Test Operator')).toBeInTheDocument();

    // Amenities
    expect(screen.getByText('Pool')).toBeInTheDocument();
    expect(screen.getByText('Spa')).toBeInTheDocument();
  });

  it('allows user to open edit modal, submit updates, and see new details', async () => {
    vi.spyOn(shipService, 'getShips').mockResolvedValue([mockShip]);
    const spyUpdate = vi.spyOn(shipService, 'updateShip').mockResolvedValue({
      ...mockShip,
      name: 'Updated Test Ship',
      capacity: 1500,
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/ships/1']}>
        <Routes>
          <Route path="/ships/:id" element={<ShipDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Test Ship/i })).toBeInTheDocument();
    });

    // Click "Chỉnh sửa thông tin"
    const editBtn = screen.getByRole('button', { name: /Chỉnh sửa thông tin/i });
    await user.click(editBtn);

    // Modal should appear
    expect(screen.getByRole('heading', { name: /Chỉnh Sửa Thông Tin Tàu/i })).toBeInTheDocument();

    // Update form
    const nameInput = screen.getByLabelText(/Tên du thuyền/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Test Ship');

    const capacityInput = screen.getByLabelText(/Khách tối đa/i);
    await user.clear(capacityInput);
    await user.type(capacityInput, '1500');

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    await user.click(saveBtn);

    // Wait for the modal to close and update to occur
    await waitFor(() => {
      expect(spyUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated Test Ship', capacity: '1500' }));
    });

    // Verify updated details are shown
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Updated Test Ship/i })).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument(); // new capacity
      expect(screen.getByText(/Đã cập nhật thông tin tàu/i)).toBeInTheDocument(); // Notification
    });
  });
});
