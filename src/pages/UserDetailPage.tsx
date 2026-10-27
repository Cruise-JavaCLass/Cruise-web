import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import type { User } from '../services/userService';
import { getUserById, getRoleLabel, extractApiError } from '../services/userService';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUserById(Number(id))
      .then((u) => !cancelled && setUser(u))
      .catch((err: unknown) =>
        !cancelled && setError(extractApiError(err, 'Không thể tải thông tin người dùng.'))
      );
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-6">
      <Link to="/users" className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-white">
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách người dùng
      </Link>

      {error ? (
        <div role="alert" className="flex items-center gap-2 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      ) : !user ? (
        <div role="status" className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thông tin người dùng...
        </div>
      ) : (
        <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
          <p className="text-xs font-mono text-cyan-400 mb-4">{user.username}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-200">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Vai trò</dt>
              <dd className="text-slate-200">{getRoleLabel(user.role)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Trạng thái</dt>
              <dd className="text-slate-200">{user.active ? 'Hoạt động' : 'Vô hiệu hóa'}</dd>
            </div>
            {user.cabinNumber && (
              <div>
                <dt className="text-slate-500">Cabin</dt>
                <dd className="text-slate-200">{user.cabinNumber}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
