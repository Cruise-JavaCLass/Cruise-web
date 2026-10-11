import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShipFormModal } from './ShipFormModal';
import type { Ship } from '../../services/shipService';

const mockShip: Ship = {
  id: 1,
  name: 'Halong Grand Harmony',
  code: 'SHIP-001',
  operator: 'Paradise Vietnam Cruises',
  capacity: 2400,
  crewCapacity: 750,
  totalCabins: 1100,
  totalDecks: 14,
  manufacturingYear: 2023,
  lengthMeters: 315.5,
  beamMeters: 38.0,
  draftMeters: 8.5,
  status: 'ACTIVE',
  description: 'Du thuyền 5 sao đẳng cấp quốc tế',
  amenities: 'Sky Pool, Luxury Spa',
  imageUrl: 'https://cruise.com/ship-001.jpg',
  active: true,
};

describe('ShipFormModal Component Tests', () => {
  it('does not render when isOpen is false', () => {
    render(<ShipFormModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly in Create mode with empty initial fields', () => {
    render(<ShipFormModal isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Thêm Tàu Du Lịch Mới/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/Tên du thuyền/i)).toHaveValue('');
    expect(screen.getByLabelText(/Mã định danh tàu/i)).toHaveValue('');
    expect(screen.getByLabelText(/Đơn vị khai thác/i)).toHaveValue('');
  });

  it('renders correctly in Edit mode pre-filled with ship data', () => {
    render(
      <ShipFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        initialData={mockShip}
      />
    );

    expect(screen.getByRole('heading', { name: /Chỉnh Sửa Thông Tin Tàu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu Thay Đổi/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/Tên du thuyền/i)).toHaveValue('Halong Grand Harmony');
    expect(screen.getByLabelText(/Mã định danh tàu/i)).toHaveValue('SHIP-001');
    expect(screen.getByLabelText(/Đơn vị khai thác/i)).toHaveValue('Paradise Vietnam Cruises');
    expect(screen.getByLabelText(/Khách tối đa/i)).toHaveValue(2400);
    expect(screen.getByLabelText(/Tổng cabin/i)).toHaveValue(1100);
  });

  it('validates required fields and shows error messages on empty submit', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ShipFormModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Tên tàu không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Mã tàu không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Đơn vị vận hành không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Sức chứa hành khách phải lớn hơn 0')).toBeInTheDocument();
  });

  it('validates maritime rules: cabin count cannot exceed passenger capacity', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ShipFormModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/Tên du thuyền/i), 'Sea Pearl');
    await user.type(screen.getByLabelText(/Mã định danh tàu/i), 'SHIP-PEARL');
    await user.type(screen.getByLabelText(/Đơn vị khai thác/i), 'Sea Lines');
    await user.type(screen.getByLabelText(/Khách tối đa/i), '500');
    await user.type(screen.getByLabelText(/Thủy thủ đoàn/i), '200');
    await user.type(screen.getByLabelText(/Tổng cabin/i), '600'); // > 500
    await user.type(screen.getByLabelText(/Số tầng\/boong/i), '8');

    const submitBtn = screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Số lượng cabin không thể lớn hơn sức chứa hành khách')
    ).toBeInTheDocument();
  });

  it('validates maritime rules: length must be greater than beam and draft less than beam', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ShipFormModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/Tên du thuyền/i), 'Sea Pearl');
    await user.type(screen.getByLabelText(/Mã định danh tàu/i), 'SHIP-PEARL');
    await user.type(screen.getByLabelText(/Đơn vị khai thác/i), 'Sea Lines');
    await user.type(screen.getByLabelText(/Khách tối đa/i), '1000');
    await user.type(screen.getByLabelText(/Thủy thủ đoàn/i), '300');
    await user.type(screen.getByLabelText(/Tổng cabin/i), '500');
    await user.type(screen.getByLabelText(/Số tầng\/boong/i), '10');

    // Length smaller than beam
    await user.type(screen.getByLabelText(/Dài \(mét\)/i), '30');
    await user.type(screen.getByLabelText(/Rộng \(mét\)/i), '35');
    await user.type(screen.getByLabelText(/Mớn nước \(mét\)/i), '40'); // draft > beam

    const submitBtn = screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i });
    await user.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Chiều dài thân tàu phải lớn hơn chiều rộng')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mớn nước phải nhỏ hơn chiều rộng thân tàu')
    ).toBeInTheDocument();
  });

  it('submits form successfully when all inputs and business rules are valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ShipFormModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/Tên du thuyền/i), 'Ha Long Luxury');
    await user.type(screen.getByLabelText(/Mã định danh tàu/i), 'SHIP-HL01');
    await user.type(screen.getByLabelText(/Đơn vị khai thác/i), 'Paradise Cruises');
    await user.type(screen.getByLabelText(/Khách tối đa/i), '1500');
    await user.type(screen.getByLabelText(/Thủy thủ đoàn/i), '450');
    await user.type(screen.getByLabelText(/Tổng cabin/i), '700');
    await user.type(screen.getByLabelText(/Số tầng\/boong/i), '12');

    const submitBtn = screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i });
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ha Long Luxury',
        code: 'SHIP-HL01',
        operator: 'Paradise Cruises',
        capacity: '1500',
        totalCabins: '700',
      })
    );
  });

  it('calls onClose when clicking the Cancel button or Close X icon', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(<ShipFormModal isOpen={true} onClose={handleClose} onSubmit={vi.fn()} />);

    const cancelBtn = screen.getByRole('button', { name: /Hủy bỏ/i });
    await user.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const closeIconBtn = screen.getByRole('button', { name: /Đóng form/i });
    await user.click(closeIconBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
