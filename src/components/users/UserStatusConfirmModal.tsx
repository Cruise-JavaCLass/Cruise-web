import { useState } from 'react';
import { UserCheck, UserX, Loader2 } from 'lucide-react';
import type { User } from '../../services/userService';
import { extractApiError } from '../../services/userService';

export interface UserStatusConfirmModalProps {
  user: User | null;
  onClose: () => void;
  onConfirm: (user: User) => Promise<void>;
}

/** Hộp thoại xác nhận bật/tắt tài khoản (KAN-76). */
export function UserStatusConfirmModal({ user, onClose, onConfirm }: UserStatusConfirmModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const deactivating = user.active;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(user);
    } catch (err: unknown) {
      setError(extractApiError(err, 'Không thể cập nhật trạng thái tài khoản.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-status-title"
        className="w-full max-w-sm bg-white border border-[#E5E0D7] rounded-2xl p-6 shadow-xl space-y-4"
      >
        <h3 id="user-status-title" className="text-base font-serif font-bold text-[#102A43] flex items-center gap-2">
          {deactivating ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <UserX className="w-4 h-4" />
            </span>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </span>
          )}
          {deactivating ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
        </h3>
        <p className="text-xs text-[#5A6578] leading-relaxed">
          {deactivating
            ? `${user.fullName} (${user.username}) sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`
            : `${user.fullName} (${user.username}) sẽ có thể đăng nhập trở lại.`}
        </p>
        {error && (
          <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 font-medium">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E0D7]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#102A43] border border-[#E5E0D7] bg-white hover:bg-[#F7F4ED] transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition disabled:opacity-60 cursor-pointer ${
              deactivating
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {deactivating ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </button>
        </div>
      </div>
    </div>
  );
}
