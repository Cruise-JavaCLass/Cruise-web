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

describe('validateUserForm boundary and edge cases', () => {
  it('accepts a username of exactly 3 and 50 characters, rejects 2 and 51', () => {
    expect(validateUserForm({ ...validData, username: 'abc' }).username).toBeUndefined();
    expect(validateUserForm({ ...validData, username: 'a'.repeat(50) }).username).toBeUndefined();
    expect(validateUserForm({ ...validData, username: 'ab' }).username).toMatch(/3-50 ký tự/);
    expect(validateUserForm({ ...validData, username: 'a'.repeat(51) }).username).toMatch(/3-50 ký tự/);
  });

  it('rejects a username containing spaces or special characters', () => {
    expect(validateUserForm({ ...validData, username: 'hieu bui' }).username).toBeDefined();
    expect(validateUserForm({ ...validData, username: 'hieu@bui' }).username).toBeDefined();
  });

  it('accepts a password of exactly 8 characters, rejects 7', () => {
    expect(validateUserForm({ ...validData, password: 'Abcd@123' }).password).toBeUndefined();
    expect(validateUserForm({ ...validData, password: 'Abc@123' }).password).toMatch(/tối thiểu 8/);
  });

  it('requires every character class in the password', () => {
    const msg = /chữ hoa, chữ thường, chữ số và ký tự đặc biệt/;
    expect(validateUserForm({ ...validData, password: 'abcd@1234' }).password).toMatch(msg); // thiếu chữ hoa
    expect(validateUserForm({ ...validData, password: 'ABCD@1234' }).password).toMatch(msg); // thiếu chữ thường
    expect(validateUserForm({ ...validData, password: 'Abcdef@gh' }).password).toMatch(msg); // thiếu chữ số
    expect(validateUserForm({ ...validData, password: 'Abcdef123' }).password).toMatch(msg); // thiếu ký tự đặc biệt
  });

  it('accepts a full name of exactly 100 characters, rejects 101', () => {
    expect(validateUserForm({ ...validData, fullName: 'a'.repeat(100) }).fullName).toBeUndefined();
    expect(validateUserForm({ ...validData, fullName: 'a'.repeat(101) }).fullName).toBe('Họ và tên tối đa 100 ký tự');
  });

  it('treats whitespace-only values as empty', () => {
    const errors = validateUserForm({ ...validData, username: '   ', fullName: '   ', email: '   ' });
    expect(errors.username).toMatch(/không được để trống/);
    expect(errors.fullName).toMatch(/không được để trống/);
    expect(errors.email).toMatch(/không được để trống/);
  });

  it('rejects malformed emails', () => {
    for (const email of ['a@', '@b.com', 'a@b', 'a b@c.com']) {
      expect(validateUserForm({ ...validData, email }).email).toBe('Email không hợp lệ');
    }
  });
});

describe('validateUserForm boundary and edge cases', () => {
  const base: UserFormData = { ...validData };

  it.each([
    ['2 characters (too short)', 'ab', true],
    ['3 characters (minimum)', 'abc', false],
    ['50 characters (maximum)', 'a'.repeat(50), false],
    ['51 characters (too long)', 'a'.repeat(51), true],
  ])('username with %s', (_label, username, shouldFail) => {
    const errors = validateUserForm({ ...base, username });
    expect(Boolean(errors.username)).toBe(shouldFail);
  });

  it('rejects usernames with spaces or special characters', () => {
    expect(validateUserForm({ ...base, username: 'hieu bui' }).username).toBeDefined();
    expect(validateUserForm({ ...base, username: 'hieu@bui' }).username).toBeDefined();
  });

  it('trims surrounding spaces before checking the username', () => {
    expect(validateUserForm({ ...base, username: '  hieu.bui  ' }).username).toBeUndefined();
  });

  it.each([
    ['100 characters (maximum)', 'A'.repeat(100), false],
    ['101 characters (too long)', 'A'.repeat(101), true],
    ['only spaces', '    ', true],
  ])('full name with %s', (_label, fullName, shouldFail) => {
    const errors = validateUserForm({ ...base, fullName });
    expect(Boolean(errors.fullName)).toBe(shouldFail);
  });

  it.each([
    ['7 characters (one below minimum)', 'Aa1@aaa', true],
    ['8 characters (minimum)', 'Aa1@aaaa', false],
    ['no digit', 'Abcdefg@', true],
    ['no special character', 'Abcdefg1', true],
    ['no uppercase letter', 'abcdef1@', true],
    ['no lowercase letter', 'ABCDEF1@', true],
  ])('password with %s', (_label, password, shouldFail) => {
    const errors = validateUserForm({ ...base, password });
    expect(Boolean(errors.password)).toBe(shouldFail);
  });

  it.each([
    ['missing @', 'abc.cruise.vn'],
    ['missing domain', 'abc@'],
    ['missing local part', '@cruise.vn'],
    ['missing dot in domain', 'abc@cruise'],
    ['contains spaces', 'a bc@cruise.vn'],
  ])('rejects email %s', (_label, email) => {
    expect(validateUserForm({ ...base, email }).email).toBe('Email không hợp lệ');
  });

  it('rejects an email that only contains spaces as empty', () => {
    expect(validateUserForm({ ...base, email: '   ' }).email).toBe('Email không được để trống');
  });

  it('keeps edit mode independent of the password rules', () => {
    const errors = validateUserForm({ ...base, username: '', password: 'x' }, true);
    expect(errors.username).toBeUndefined();
    expect(errors.password).toBeUndefined();
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
