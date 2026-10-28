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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-status-title"
        className="w-full max-w-sm bg-[#030303]/95 border border-white/10 rounded-2xl p-5 space-y-4"
      >
        <h3 id="user-status-title" className="text-sm font-bold text-white flex items-center gap-2">
          {deactivating ? (
            <UserX className="w-4 h-4 text-amber-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-emerald-400" />
          )}
          {deactivating ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
        </h3>
        <p className="text-xs text-slate-300">
          {deactivating
            ? `${user.fullName} (${user.username}) sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`
            : `${user.fullName} (${user.username}) sẽ có thể đăng nhập trở lại.`}
        </p>
        {error && (
          <p role="alert" className="text-xs text-rose-400">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-300 border border-slate-700 hover:bg-slate-800/60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-60"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {deactivating ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </button>
        </div>
      </div>
    </div>
  );
}
