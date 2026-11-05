import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
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
      <Link
        to="/users"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#397C80] hover:text-[#102A43] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách người dùng
      </Link>

      {error ? (
        <div role="alert" className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      ) : !user ? (
        <div role="status" className="flex items-center gap-2 text-xs text-[#687787] p-8">
          <Loader2 className="w-4 h-4 animate-spin text-[#397C80]" /> Đang tải thông tin người dùng...
        </div>
      ) : (
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-start justify-between border-b border-[#E5E0D7] pb-4">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[#687787] uppercase">
                Tài khoản người dùng
              </p>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-[#102A43]">
                {user.fullName}
              </h2>
              <p className="text-xs font-mono text-[#397C80] mt-1">{user.username}</p>
            </div>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                user.active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {user.active ? 'Đang hoạt động' : 'Vô hiệu hóa'}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#E5E0D7]">
              <dt className="text-[#687787] font-medium mb-1">Email liên hệ</dt>
              <dd className="text-[#102A43] font-semibold text-sm">{user.email}</dd>
            </div>
            <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#E5E0D7]">
              <dt className="text-[#687787] font-medium mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#397C80]" /> Vai trò hệ thống
              </dt>
              <dd className="text-[#102A43] font-semibold text-sm">{getRoleLabel(user.role)}</dd>
            </div>
            {user.cabinNumber && (
              <div className="p-4 rounded-xl bg-[#F7F4ED] border border-[#E5E0D7]">
                <dt className="text-[#687787] font-medium mb-1">Cabin</dt>
                <dd className="text-[#102A43] font-semibold text-sm">{user.cabinNumber}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
