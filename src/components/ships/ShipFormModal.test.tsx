import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShipFormModal } from './ShipFormModal';
import { INITIAL_SHIPS } from '../../services/shipService';

const mockShip = INITIAL_SHIPS[0];

interface FormValues {
  name?: string;
  code?: string;
  operator?: string;
  capacity?: string;
  crewCapacity?: string;
  totalCabins?: string;
  totalDecks?: string;
  lengthMeters?: string;
  beamMeters?: string;
  draftMeters?: string;
}

async function fillShipForm(user: ReturnType<typeof userEvent.setup>, values: FormValues) {
  const fields: [RegExp, string | undefined][] = [
    [/Tên du thuyền/i, values.name],
    [/Mã định danh tàu/i, values.code],
    [/Đơn vị khai thác/i, values.operator],
    [/Khách tối đa/i, values.capacity],
    [/Thủy thủ đoàn/i, values.crewCapacity],
    [/Tổng cabin/i, values.totalCabins],
    [/Số tầng\/boong/i, values.totalDecks],
    [/Dài \(mét\)/i, values.lengthMeters],
    [/Rộng \(mét\)/i, values.beamMeters],
    [/Mớn nước \(mét\)/i, values.draftMeters],
  ];

  for (const [label, val] of fields) {
    if (val !== undefined) {
      await user.type(screen.getByLabelText(label), val);
    }
  }
}

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

    await fillShipForm(user, {
      name: 'Sea Pearl',
      code: 'SHIP-PEARL',
      operator: 'Sea Lines',
      capacity: '500',
      crewCapacity: '200',
      totalCabins: '600',
      totalDecks: '8',
    });

    await user.click(screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(
      screen.getByText('Số lượng cabin không thể lớn hơn sức chứa hành khách')
    ).toBeInTheDocument();
  });

  it('validates maritime rules: length must be greater than beam and draft less than beam', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<ShipFormModal isOpen={true} onClose={vi.fn()} onSubmit={handleSubmit} />);

    await fillShipForm(user, {
      name: 'Sea Pearl',
      code: 'SHIP-PEARL',
      operator: 'Sea Lines',
      capacity: '1000',
      crewCapacity: '300',
      totalCabins: '500',
      totalDecks: '10',
      lengthMeters: '30',
      beamMeters: '35',
      draftMeters: '40',
    });

    await user.click(screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i }));

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

    await fillShipForm(user, {
      name: 'Ha Long Luxury',
      code: 'SHIP-HL01',
      operator: 'Paradise Cruises',
      capacity: '1500',
      crewCapacity: '450',
      totalCabins: '700',
      totalDecks: '12',
    });

    await user.click(screen.getByRole('button', { name: /Thêm Tàu Du Lịch/i }));

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
