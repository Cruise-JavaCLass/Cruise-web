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

export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get<ApiEnvelope<User[] | { content: User[] }>>('/auth/users');
  const data = res.data.data;
  return Array.isArray(data) ? data : data.content;
}

export async function getUserById(id: number): Promise<User> {
  const res = await apiClient.get<ApiEnvelope<User>>(`/auth/users/id/${id}`);
  return res.data.data;
}

export async function createUser(form: UserFormData): Promise<User> {
  const res = await apiClient.post<ApiEnvelope<User>>('/auth/users', {
    username: form.username.trim(),
    password: form.password,
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    role: form.role,
    active: true,
  });
  return res.data.data;
}

export async function updateUser(id: number, form: UserFormData): Promise<User> {
  const res = await apiClient.put<ApiEnvelope<User>>(`/auth/users/${id}`, {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    role: form.role,
  });
  return res.data.data;
}

export async function setUserActive(id: number, active: boolean): Promise<User> {
  const res = await apiClient.patch<ApiEnvelope<User>>(
    `/auth/users/${id}/${active ? 'activate' : 'deactivate'}`
  );
  return res.data.data;
}
