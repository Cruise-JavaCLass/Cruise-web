import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit2,
  Eye,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserX,
  Filter,
} from 'lucide-react';
import type { User, UserFormData } from '../services/userService';
import {
  getUsers,
  createUser,
  updateUser,
  setUserActive,
  getRoleLabel,
  extractApiError,
  USER_ROLES,
} from '../services/userService';
import { UserFormModal } from '../components/users/UserFormModal';
import { UserStatusConfirmModal } from '../components/users/UserStatusConfirmModal';

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setUsers(await getUsers());
    } catch (err: unknown) {
      setLoadError(extractApiError(err, 'Không thể tải danh sách người dùng.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFormSubmit = async (formData: UserFormData) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updated = await updateUser(editingUser.id, formData);
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
        showNotification(`Đã cập nhật người dùng ${updated.username} thành công!`);
      } else {
        const created = await createUser(formData);
        setUsers((prev) => [created, ...prev]);
        showNotification(`Đã tạo người dùng ${created.username} thành công!`);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusConfirm = async (user: User) => {
    const updated = await setUserActive(user.id, !user.active);
    setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    setStatusTarget(null);
    showNotification(
      updated.active
        ? `Đã kích hoạt tài khoản ${updated.username}.`
        : `Đã vô hiệu hóa tài khoản ${updated.username}.`
    );
  };

  const keyword = searchTerm.toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(keyword) ||
      u.username.toLowerCase().includes(keyword) ||
      u.email.toLowerCase().includes(keyword);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-cyan-400" /> Quản Lý Người Dùng (Identity &amp; Access)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản trị hệ thống • Tạo tài khoản, phân vai trò và bật/tắt quyền truy cập
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Người Dùng
        </button>
      </div>

      {notification && (
        <div
          role="status"
          className="p-3 bg-emerald-950/60 backdrop-blur-xl border border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-300 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="bg-[#030303]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm người dùng"
              placeholder="Tìm theo tên, tài khoản, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-56"
            >
              <option value="ALL">Tất cả vai trò</option>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto border-t border-slate-800">
          {isLoading ? (
            <div role="status" className="p-10 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách người dùng...
            </div>
          ) : loadError ? (
            <div role="alert" className="p-10 flex flex-col items-center gap-3 text-xs text-rose-300">
              <AlertTriangle className="w-5 h-5" />
              <span>{loadError}</span>
              <button
                onClick={() => void loadUsers()}
                className="px-4 py-2 rounded-xl border border-rose-500/40 hover:bg-rose-950/40"
              >
                Thử lại
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Chưa có người dùng nào. Hãy thêm người dùng đầu tiên để bắt đầu.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/40 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Người dùng</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Vai trò</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-100">{user.fullName}</p>
                        <span className="text-[11px] font-mono text-cyan-400">{user.username}</span>
                      </td>
                      <td className="p-3.5">{user.email}</td>
                      <td className="p-3.5">{getRoleLabel(user.role)}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            user.active
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {user.active ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/users/${user.id}`}
                            aria-label={`Xem chi tiết ${user.fullName}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/40 border border-slate-700/50"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem
                          </Link>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setIsModalOpen(true);
                            }}
                            aria-label={`Chỉnh sửa ${user.fullName}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 hover:text-white hover:bg-cyan-600/20 border border-cyan-500/30"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => setStatusTarget(user)}
                            aria-label={`${user.active ? 'Vô hiệu hóa' : 'Kích hoạt'} ${user.fullName}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 hover:text-white hover:bg-amber-600/20 border border-amber-500/30"
                          >
                            {user.active ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            {user.active ? 'Tắt' : 'Bật'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
        isLoading={isSubmitting}
      />
      <UserStatusConfirmModal
        key={statusTarget?.id ?? 'none'}
        user={statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm}
      />
    </div>
  );
}
