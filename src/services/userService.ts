import { apiClient } from './api';

// Đồng bộ với com.cruise.common.enums.Role ở Cruise-api
export type UserRole =
  | 'PASSENGER'
  | 'ITINERARY_COORDINATOR'
  | 'ACTIVITY_MANAGER'
  | 'SHORE_EXCURSION_MANAGER'
  | 'POS_STAFF'
  | 'FINANCE_FRONT_DESK'
  | 'OPERATIONS_MANAGER'
  | 'SYSTEM_ADMIN';

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'PASSENGER', label: 'Hành khách' },
  { value: 'ITINERARY_COORDINATOR', label: 'Điều phối hải trình' },
  { value: 'ACTIVITY_MANAGER', label: 'Quản lý hoạt động' },
  { value: 'SHORE_EXCURSION_MANAGER', label: 'Quản lý tour trên bờ' },
  { value: 'POS_STAFF', label: 'Nhân viên POS' },
  { value: 'FINANCE_FRONT_DESK', label: 'Tài chính & Lễ tân' },
  { value: 'OPERATIONS_MANAGER', label: 'Quản lý vận hành' },
  { value: 'SYSTEM_ADMIN', label: 'Quản trị hệ thống' },
];

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  cabinNumber?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole | '';
}

export interface UserFormErrors {
  [key: string]: string | undefined;
}

export function getRoleLabel(role: UserRole): string {
  return USER_ROLES.find((r) => r.value === role)?.label ?? role;
}

/** Chức danh chuẩn hàng hải hiển thị trên badge */
const ROLE_RANKS: Record<UserRole, string> = {
  SYSTEM_ADMIN: 'Chief Systems Officer',
  OPERATIONS_MANAGER: 'Staff Captain',
  ACTIVITY_MANAGER: 'Cruise Director',
  SHORE_EXCURSION_MANAGER: 'Shore Excursion Manager',
  ITINERARY_COORDINATOR: 'Navigation Officer',
  FINANCE_FRONT_DESK: 'Purser',
  POS_STAFF: 'Onboard Revenue Associate',
  PASSENGER: 'Guest',
};

export function getRoleRank(role: UserRole): string {
  return ROLE_RANKS[role] ?? role;
}

/** Các vai trò được tính là quản lý cấp cao trên thẻ KPI */
export const SENIOR_ROLES: UserRole[] = [
  'SYSTEM_ADMIN',
  'OPERATIONS_MANAGER',
  'ACTIVITY_MANAGER',
  'SHORE_EXCURSION_MANAGER',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,50}$/;

/**
 * Kiểm tra dữ liệu form. Khi sửa (isEdit) không yêu cầu username/mật khẩu;
 * mật khẩu theo quy tắc của PasswordValidator ở Cruise-api.
 */
export function validateUserForm(data: UserFormData, isEdit = false): UserFormErrors {
  const errors: UserFormErrors = {};

  if (!isEdit) {
    if (!data.username.trim()) {
      errors.username = 'Tên đăng nhập không được để trống';
    } else if (!USERNAME_REGEX.test(data.username.trim())) {
      errors.username = 'Tên đăng nhập gồm 3-50 ký tự: chữ, số, dấu chấm, gạch ngang/dưới';
    }

    if (!data.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (data.password.length < 8) {
      errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự';
    } else if (
      !/[A-Z]/.test(data.password) ||
      !/[a-z]/.test(data.password) ||
      !/[0-9]/.test(data.password) ||
      !/[^A-Za-z0-9]/.test(data.password)
    ) {
      errors.password = 'Mật khẩu cần có chữ hoa, chữ thường, chữ số và ký tự đặc biệt';
    }
  }

  if (!data.fullName.trim()) {
    errors.fullName = 'Họ và tên không được để trống';
  } else if (data.fullName.trim().length > 100) {
    errors.fullName = 'Họ và tên tối đa 100 ký tự';
  }

  if (!data.email.trim()) {
    errors.email = 'Email không được để trống';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Email không hợp lệ';
  }

  if (!data.role) {
    errors.role = 'Vui lòng chọn vai trò';
  }

  return errors;
}

export function extractApiError(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || (err instanceof Error && err.message) || fallback;
}

type ApiEnvelope<T> = { success: boolean; message?: string; data: T };

/**
 * Dữ liệu mẫu dùng khi Cruise-api chưa có endpoint hoặc không kết nối được
 * (cùng cách làm với INITIAL_PASSENGERS ở passengerService).
 */
export const DEMO_STAFF_ACCOUNTS: User[] = [
  { id: 1, username: 'admin', fullName: 'Nguyễn Quốc Bảo', email: 'bao.nguyen@cruise.vn', role: 'SYSTEM_ADMIN', active: true },
  { id: 2, username: 'ops.manager', fullName: 'Lê Thị Minh Châu', email: 'chau.le@cruise.vn', role: 'OPERATIONS_MANAGER', active: true },
  { id: 3, username: 'activity.lead', fullName: 'Phạm Hoàng Nam', email: 'nam.pham@cruise.vn', role: 'ACTIVITY_MANAGER', active: true },
  { id: 4, username: 'shore.lead', fullName: 'Đặng Thu Hà', email: 'ha.dang@cruise.vn', role: 'SHORE_EXCURSION_MANAGER', active: true },
  { id: 5, username: 'navigator', fullName: 'Vũ Đức Anh', email: 'anh.vu@cruise.vn', role: 'ITINERARY_COORDINATOR', active: true },
  { id: 6, username: 'purser', fullName: 'Trần Mai Linh', email: 'linh.tran@cruise.vn', role: 'FINANCE_FRONT_DESK', active: true },
  { id: 7, username: 'pos.staff01', fullName: 'Bùi Văn Khoa', email: 'khoa.bui@cruise.vn', role: 'POS_STAFF', active: true },
  { id: 8, username: 'pos.staff02', fullName: 'Hoàng Ngọc Lan', email: 'lan.hoang@cruise.vn', role: 'POS_STAFF', active: false },
];

let localUsers: User[] = DEMO_STAFF_ACCOUNTS.map((u) => ({ ...u }));
let demoMode = false;

/** Lần tải gần nhất có phải dùng dữ liệu mẫu không (để hiển thị biểu ngữ) */
export const isUsingDemoData = (): boolean => demoMode;

export const resetLocalUsers = () => {
  localUsers = DEMO_STAFF_ACCOUNTS.map((u) => ({ ...u }));
  demoMode = false;
};

/**
 * Chỉ dùng dữ liệu mẫu khi không có phản hồi (mất kết nối) hoặc endpoint chưa tồn tại
 * hay máy chủ không sẵn sàng. Lỗi nghiệp vụ (400, 403, 409...) vẫn phải báo cho người dùng.
 */
function shouldFallback(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return status === undefined || [404, 405, 501, 502, 503, 504].includes(status);
}

function nextLocalId(): number {
  return localUsers.reduce((max, u) => Math.max(max, u.id), 0) + 1;
}

function assertLocalUnique(email: string, username?: string, ignoreId?: number) {
  const lowerEmail = email.trim().toLowerCase();
  if (localUsers.some((u) => u.id !== ignoreId && u.email.toLowerCase() === lowerEmail)) {
    throw new Error('Email đã tồn tại');
  }
  if (
    username &&
    localUsers.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())
  ) {
    throw new Error('Tên đăng nhập đã tồn tại');
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const res = await apiClient.get<ApiEnvelope<User[] | { content: User[] }>>('/auth/users');
    const data = res.data.data;
    demoMode = false;
    return Array.isArray(data) ? data : data.content;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    demoMode = true;
    return localUsers.map((u) => ({ ...u }));
  }
}

export async function getUserById(id: number): Promise<User> {
  try {
    const res = await apiClient.get<ApiEnvelope<User>>(`/auth/users/id/${id}`);
    return res.data.data;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    const found = localUsers.find((u) => u.id === id);
    if (!found) throw new Error('Không tìm thấy người dùng');
    return { ...found };
  }
}

export async function createUser(form: UserFormData): Promise<User> {
  try {
    const res = await apiClient.post<ApiEnvelope<User>>('/auth/users', {
      username: form.username.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
      active: true,
    });
    return res.data.data;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    assertLocalUnique(form.email, form.username);
    const created: User = {
      id: nextLocalId(),
      username: form.username.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role as UserRole,
      active: true,
    };
    localUsers = [created, ...localUsers];
    return { ...created };
  }
}

export async function updateUser(id: number, form: UserFormData): Promise<User> {
  try {
    const res = await apiClient.put<ApiEnvelope<User>>(`/auth/users/${id}`, {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
    });
    return res.data.data;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    const current = localUsers.find((u) => u.id === id);
    if (!current) throw new Error('Không tìm thấy người dùng');
    assertLocalUnique(form.email, undefined, id);
    const updated: User = {
      ...current,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role as UserRole,
    };
    localUsers = localUsers.map((u) => (u.id === id ? updated : u));
    return { ...updated };
  }
}

export async function setUserActive(id: number, active: boolean): Promise<User> {
  try {
    const res = await apiClient.patch<ApiEnvelope<User>>(
      `/auth/users/${id}/${active ? 'activate' : 'deactivate'}`
    );
    return res.data.data;
  } catch (err) {
    if (!shouldFallback(err)) throw err;
    const current = localUsers.find((u) => u.id === id);
    if (!current) throw new Error('Không tìm thấy người dùng');
    const updated: User = { ...current, active };
    localUsers = localUsers.map((u) => (u.id === id ? updated : u));
    return { ...updated };
  }
}
