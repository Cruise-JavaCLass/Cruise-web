import { useState, useEffect } from 'react';
import { X, UserPlus, UserCog, Loader2, ShieldAlert } from 'lucide-react';
import type { User, UserFormData, UserFormErrors } from '../../services/userService';
import { USER_ROLES, validateUserForm, extractApiError } from '../../services/userService';

export interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void> | void;
  initialData?: User | null;
  isLoading?: boolean;
}

const defaultFormData: UserFormData = {
  username: '',
  password: '',
  fullName: '',
  email: '',
  role: '',
};

function mapUserToFormData(user?: User | null): UserFormData {
  if (!user) return defaultFormData;
  return {
    username: user.username,
    password: '',
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
}

const inputClass = (error?: string) =>
  `w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs text-slate-100 focus:outline-none ${
    error ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
  }`;

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: UserFormModalProps) {
  const isEdit = Boolean(initialData);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(mapUserToFormData(initialData));
    setErrors({});
    setApiError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validateUserForm(formData, isEdit);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: unknown) {
      setApiError(extractApiError(err, 'Không thể lưu người dùng. Vui lòng thử lại.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="w-full max-w-lg bg-[#030303]/95 border border-white/10 rounded-2xl shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 id="user-form-title" className="text-sm font-bold text-white flex items-center gap-2">
            {isEdit ? (
              <>
                <UserCog className="w-4 h-4 text-cyan-400" /> Chỉnh Sửa Người Dùng
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-cyan-400" /> Thêm Người Dùng Mới
              </>
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300"
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-300 mb-1">
              Tên đăng nhập {!isEdit && <span className="text-rose-400">*</span>}
            </label>
            <input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isEdit}
              className={`${inputClass(errors.username)} disabled:opacity-60`}
            />
            {errors.username && <p className="text-[11px] text-rose-400 mt-1">{errors.username}</p>}
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-300 mb-1">
                Mật khẩu <span className="text-rose-400">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass(errors.password)}
              />
              {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>}
            </div>
          )}

          <div>
            <label htmlFor="fullName" className="block text-xs font-medium text-slate-300 mb-1">
              Họ và tên <span className="text-rose-400">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass(errors.fullName)}
            />
            {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1">
              Email <span className="text-rose-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass(errors.email)}
            />
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-xs font-medium text-slate-300 mb-1">
              Vai trò <span className="text-rose-400">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={inputClass(errors.role)}
            >
              <option value="">-- Chọn vai trò --</option>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.role && <p className="text-[11px] text-rose-400 mt-1">{errors.role}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-300 border border-slate-700 hover:bg-slate-800/60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-60"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo người dùng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
