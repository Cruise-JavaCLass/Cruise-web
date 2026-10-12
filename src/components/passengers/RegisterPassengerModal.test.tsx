import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterPassengerModal } from './RegisterPassengerModal';

describe('RegisterPassengerModal Component Tests (KAN-151)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    tourId: 1,
    onSuccess: vi.fn(),
  };

  it('renders modal with required input fields when isOpen is true', () => {
    render(<RegisterPassengerModal {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 3, name: /Đăng Ký Hành Khách Mới/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Họ và tên hành khách/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số cabin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã thẻ RFID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gói tour/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Khu vực BLE/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Trạng thái đăng ký/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<RegisterPassengerModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('heading', { level: 3, name: /Đăng Ký Hành Khách Mới/i })).not.toBeInTheDocument();
  });

  it('validates required fields on submit without inputting data', async () => {
    const user = userEvent.setup();
    render(<RegisterPassengerModal {...defaultProps} />);

    const submitBtn = screen.getByRole('button', { name: /Lưu Hành Khách/i });
    await user.click(submitBtn);

    expect(screen.getByText(/Họ và tên không được để trống/i)).toBeInTheDocument();
    expect(screen.getByText(/Số phòng cabin không được để trống/i)).toBeInTheDocument();
    expect(screen.getByText(/Mã thẻ RFID không được để trống/i)).toBeInTheDocument();
    expect(defaultProps.onSuccess).not.toHaveBeenCalled();
  });

  it('submits valid passenger form successfully and calls onSuccess', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<RegisterPassengerModal {...defaultProps} onSuccess={onSuccess} onClose={onClose} />);

    await user.type(screen.getByLabelText(/Họ và tên hành khách/i), 'Nguyễn Hải Đăng');
    await user.type(screen.getByLabelText(/Email/i), 'dang.nguyen@cruise.com');
    await user.type(screen.getByLabelText(/Số điện thoại/i), '0919998888');
    await user.type(screen.getByLabelText(/Số cabin/i), 'Cabin-888');
    await user.type(screen.getByLabelText(/Mã thẻ RFID/i), 'RFID-88888');

    const submitBtn = screen.getByRole('button', { name: /Lưu Hành Khách/i });
    await user.click(submitBtn);

    expect(onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        tourId: 1,
        fullName: 'Nguyễn Hải Đăng',
        email: 'dang.nguyen@cruise.com',
        phoneNumber: '0919998888',
        cabinNumber: 'Cabin-888',
        rfidTag: 'RFID-88888',
        qrCode: 'QR-RFID-88888',
        registrationStatus: 'CONFIRMED',
        checkInStatus: 'NOT_CHECKED_IN',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking close button or cancel button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RegisterPassengerModal {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Đóng modal đăng ký/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Hủy/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
