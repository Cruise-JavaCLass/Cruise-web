import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserFormModal } from './UserFormModal';
import { validateUserForm } from '../../services/userService';
import type { UserFormData } from '../../services/userService';

const validData: UserFormData = {
  username: 'hieu.bui',
  password: 'Secret@123',
  fullName: 'Bùi Minh Hiếu',
  email: 'hieu@cruise.vn',
  role: 'SYSTEM_ADMIN',
};

describe('validateUserForm', () => {
  it('returns no errors for valid data', () => {
    expect(validateUserForm(validData)).toEqual({});
  });

  it('reports all required fields when empty', () => {
    const errors = validateUserForm({ username: '', password: '', fullName: '', email: '', role: '' });
    expect(errors.username).toMatch(/không được để trống/);
    expect(errors.password).toMatch(/không được để trống/);
    expect(errors.fullName).toMatch(/không được để trống/);
    expect(errors.email).toMatch(/không được để trống/);
    expect(errors.role).toMatch(/chọn vai trò/);
  });

  it('rejects invalid email', () => {
    expect(validateUserForm({ ...validData, email: 'abc' }).email).toBe('Email không hợp lệ');
  });

  it('rejects weak passwords', () => {
    expect(validateUserForm({ ...validData, password: 'Ab@1' }).password).toMatch(/tối thiểu 8/);
    expect(validateUserForm({ ...validData, password: 'abcdefgh' }).password).toMatch(/chữ hoa/);
  });

  it('does not require username or password in edit mode', () => {
    const errors = validateUserForm({ ...validData, username: '', password: '' }, true);
    expect(errors).toEqual({});
  });
});

describe('UserFormModal validation and error messages', () => {
  it('shows field errors and does not submit an empty form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UserFormModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /Tạo người dùng/i }));

    expect(screen.getByText('Tên đăng nhập không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Họ và tên không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Email không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng chọn vai trò')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears an error once the user edits that field', async () => {
    const user = userEvent.setup();
    render(<UserFormModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Tạo người dùng/i }));
    expect(screen.getByText('Email không được để trống')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Email/i), 'a');
    expect(screen.queryByText('Email không được để trống')).not.toBeInTheDocument();
  });

  it('submits valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<UserFormModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Tên đăng nhập/i), validData.username);
    await user.type(screen.getByLabelText(/Mật khẩu/i), validData.password);
    await user.type(screen.getByLabelText(/Họ và tên/i), validData.fullName);
    await user.type(screen.getByLabelText(/Email/i), validData.email);
    await user.selectOptions(screen.getByLabelText(/Vai trò/i), 'SYSTEM_ADMIN');
    await user.click(screen.getByRole('button', { name: /Tạo người dùng/i }));

    expect(onSubmit).toHaveBeenCalledWith(validData);
  });

  it('shows the server error message when submit fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('Email đã tồn tại'));
    render(
      <UserFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        initialData={{
          id: 1,
          username: 'an',
          fullName: 'An',
          email: 'an@cruise.vn',
          role: 'POS_STAFF',
          active: true,
        }}
      />
    );
    await user.click(screen.getByRole('button', { name: /Lưu thay đổi/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email đã tồn tại');
  });
});
