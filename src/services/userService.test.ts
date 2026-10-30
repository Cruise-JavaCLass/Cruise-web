import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  setUserActive,
  isUsingDemoData,
  resetLocalUsers,
  getRoleRank,
  DEMO_STAFF_ACCOUNTS,
} from './userService';
import type { UserFormData } from './userService';
import { apiClient } from './api';

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

const httpError = (status: number, message = 'lỗi') => ({
  response: { status, data: { message } },
});

const newUser: UserFormData = {
  username: 'moi.nguoi',
  password: 'Secret@123',
  fullName: 'Người Mới',
  email: 'moi@cruise.vn',
  role: 'POS_STAFF',
};

beforeEach(() => {
  vi.resetAllMocks();
  resetLocalUsers();
});

describe('userService with a working API', () => {
  it('returns API data (array or paged) and is not in demo mode', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { success: true, data: { content: [DEMO_STAFF_ACCOUNTS[0]] } },
    });
    const users = await getUsers();
    expect(users).toHaveLength(1);
    expect(isUsingDemoData()).toBe(false);
  });
});

describe('userService demo-data fallback', () => {
  it.each([
    ['no response (network error)', new Error('Network Error')],
    ['404 endpoint missing', httpError(404)],
    ['405 method not allowed', httpError(405)],
    ['503 service unavailable', httpError(503)],
  ])('falls back to demo accounts on %s', async (_label, err) => {
    vi.mocked(apiClient.get).mockRejectedValue(err);
    const users = await getUsers();
    expect(users).toHaveLength(DEMO_STAFF_ACCOUNTS.length);
    expect(isUsingDemoData()).toBe(true);
  });

  it('does not hide business errors such as 403', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(403, 'Forbidden'));
    await expect(getUsers()).rejects.toMatchObject({ response: { status: 403 } });
  });

  it('keeps the demo data well-formed (unique ids, usernames and emails)', () => {
    const ids = new Set(DEMO_STAFF_ACCOUNTS.map((u) => u.id));
    const usernames = new Set(DEMO_STAFF_ACCOUNTS.map((u) => u.username));
    const emails = new Set(DEMO_STAFF_ACCOUNTS.map((u) => u.email));
    expect(ids.size).toBe(DEMO_STAFF_ACCOUNTS.length);
    expect(usernames.size).toBe(DEMO_STAFF_ACCOUNTS.length);
    expect(emails.size).toBe(DEMO_STAFF_ACCOUNTS.length);
    expect(DEMO_STAFF_ACCOUNTS.some((u) => !u.active)).toBe(true);
  });

  it('getUserById falls back to local data and reports unknown ids', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(httpError(404));
    expect((await getUserById(1)).username).toBe('admin');
    await expect(getUserById(999)).rejects.toThrow('Không tìm thấy người dùng');
  });

  it('createUser adds to the local list when the API is unavailable', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(httpError(404));
    vi.mocked(apiClient.get).mockRejectedValue(httpError(404));

    const created = await createUser(newUser);
    expect(created.id).toBe(DEMO_STAFF_ACCOUNTS.length + 1);
    expect(created.active).toBe(true);

    const users = await getUsers();
    expect(users[0].username).toBe('moi.nguoi');
  });

  it('createUser rejects duplicated username or email in demo mode', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(httpError(404));
    await expect(createUser({ ...newUser, username: 'admin' })).rejects.toThrow(
      'Tên đăng nhập đã tồn tại'
    );
    await expect(createUser({ ...newUser, email: 'bao.nguyen@cruise.vn' })).rejects.toThrow(
      'Email đã tồn tại'
    );
  });

  it('createUser rethrows a real 400 from the API instead of faking success', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(httpError(400, 'Username already exists'));
    await expect(createUser(newUser)).rejects.toMatchObject({ response: { status: 400 } });
  });

  it('updateUser and setUserActive work on local data', async () => {
    vi.mocked(apiClient.put).mockRejectedValue(httpError(405));
    vi.mocked(apiClient.patch).mockRejectedValue(httpError(405));

    const updated = await updateUser(7, { ...newUser, fullName: 'Khoa Bùi', email: 'khoa.moi@cruise.vn', role: 'FINANCE_FRONT_DESK' });
    expect(updated.fullName).toBe('Khoa Bùi');
    expect(updated.role).toBe('FINANCE_FRONT_DESK');
    expect(updated.username).toBe('pos.staff01');

    expect((await setUserActive(7, false)).active).toBe(false);
    expect((await setUserActive(7, true)).active).toBe(true);
  });

  it('updateUser rejects an email already used by another local user', async () => {
    vi.mocked(apiClient.put).mockRejectedValue(httpError(404));
    await expect(
      updateUser(7, { ...newUser, email: 'bao.nguyen@cruise.vn' })
    ).rejects.toThrow('Email đã tồn tại');
  });

  it('updateUser and setUserActive report unknown ids', async () => {
    vi.mocked(apiClient.put).mockRejectedValue(httpError(404));
    vi.mocked(apiClient.patch).mockRejectedValue(httpError(404));
    await expect(updateUser(999, newUser)).rejects.toThrow('Không tìm thấy người dùng');
    await expect(setUserActive(999, false)).rejects.toThrow('Không tìm thấy người dùng');
  });
});

describe('getRoleRank', () => {
  it('maps roles to maritime titles', () => {
    expect(getRoleRank('SYSTEM_ADMIN')).toBe('Chief Systems Officer');
    expect(getRoleRank('FINANCE_FRONT_DESK')).toBe('Purser');
    expect(getRoleRank('PASSENGER')).toBe('Guest');
  });
});
