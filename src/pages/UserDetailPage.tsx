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
      <Link to="/users" className="inline-flex items-center gap-1.5 text-xs text-[#397C80] hover:text-[#102A43]">
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách người dùng
      </Link>

      {error ? (
        <div role="alert" className="flex items-center gap-2 text-xs text-rose-700">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      ) : !user ? (
        <div role="status" className="flex items-center gap-2 text-xs text-[#627D98]">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thông tin người dùng...
        </div>
      ) : (
        <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 shadow-xs">
          <h2 className="font-display text-xl font-bold text-[#102A43]">{user.fullName}</h2>
          <p className="text-xs font-mono text-[#397C80] mb-4">{user.username}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-[#627D98]">Email</dt>
              <dd className="text-[#252B32]">{user.email}</dd>
            </div>
            <div>
              <dt className="text-[#627D98]">Vai trò</dt>
              <dd className="text-[#252B32]">{getRoleLabel(user.role)}</dd>
            </div>
            <div>
              <dt className="text-[#627D98]">Trạng thái</dt>
              <dd className="text-[#252B32]">{user.active ? 'Hoạt động' : 'Vô hiệu hóa'}</dd>
            </div>
            {user.cabinNumber && (
              <div>
                <dt className="text-[#627D98]">Cabin</dt>
                <dd className="text-[#252B32]">{user.cabinNumber}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
