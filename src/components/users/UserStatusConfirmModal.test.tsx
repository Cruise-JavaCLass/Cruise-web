import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserStatusConfirmModal } from './UserStatusConfirmModal';
import type { User } from '../../services/userService';

const activeUser: User = {
  id: 1,
  username: 'an.nguyen',
  fullName: 'An Nguyễn',
  email: 'an@cruise.vn',
  role: 'POS_STAFF',
  active: true,
};

describe('UserStatusConfirmModal', () => {
  it('renders nothing when there is no target user', () => {
    const { container } = render(
      <UserStatusConfirmModal user={null} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('asks to deactivate an active account and confirms', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<UserStatusConfirmModal user={activeUser} onClose={vi.fn()} onConfirm={onConfirm} />);

    expect(screen.getByRole('heading', { name: /Vô hiệu hóa tài khoản/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Vô hiệu hóa' }));
    expect(onConfirm).toHaveBeenCalledWith(activeUser);
  });

  it('asks to activate an inactive account', () => {
    render(
      <UserStatusConfirmModal
        user={{ ...activeUser, active: false }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: /Kích hoạt tài khoản/i })).toBeInTheDocument();
  });

  it('closes without calling the API when cancelled', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<UserStatusConfirmModal user={activeUser} onClose={onClose} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('shows an error message when the API fails', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Không có quyền'));
    render(<UserStatusConfirmModal user={activeUser} onClose={vi.fn()} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: 'Vô hiệu hóa' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không có quyền');
  });

  it('clears the old error after cancelling', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockRejectedValue(new Error('Không có quyền'));
    render(<UserStatusConfirmModal user={activeUser} onClose={vi.fn()} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Vô hiệu hóa' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
