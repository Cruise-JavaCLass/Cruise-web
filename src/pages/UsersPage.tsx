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
    try {
      const data = await getUsers();
      setUsers(data);
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(extractApiError(err, 'Không thể tải danh sách người dùng.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    void loadUsers();
  };

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
    <div className="space-y-6">
      {/* Header card */}
      <header className="rounded-xl border border-[#E5E0D7] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-[#687787] uppercase">
              Identity & Access Management
            </p>
            <h2 className="font-serif text-xl font-bold tracking-tight text-[#102A43] sm:text-2xl flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#397C80]/10 text-[#397C80]">
                <UsersIcon className="h-5 w-5" />
              </span>
              Quản Lý Người Dùng (Identity & Access)
            </h2>
            <p className="mt-1 text-xs text-[#687787]">
              Quản trị hệ thống • Tạo tài khoản, phân vai trò và bật/tắt quyền truy cập
            </p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#102A43] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1B3A5A] self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Người Dùng
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Main Table Container */}
      <section className="overflow-hidden rounded-xl border border-[#E5E0D7] bg-white shadow-xs">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#E5E0D7] p-4 bg-white">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#687787] pointer-events-none" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm người dùng"
              placeholder="Tìm theo tên, tài khoản, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white border border-[#E5E0D7] rounded-lg text-xs text-[#102A43] placeholder-[#687787] focus:outline-none focus:border-[#C5A572] w-full transition"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#687787]" />
            <select
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E5E0D7] rounded-lg text-xs text-[#102A43] focus:outline-none focus:border-[#C5A572] w-full sm:w-56 transition"
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

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div role="status" className="p-12 flex items-center justify-center gap-2 text-xs text-[#687787]">
              <Loader2 className="w-4 h-4 animate-spin text-[#397C80]" /> Đang tải danh sách người dùng...
            </div>
          ) : loadError ? (
            <div role="alert" className="p-10 flex flex-col items-center gap-3 text-xs text-rose-700 bg-rose-50/50 m-4 rounded-xl border border-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span className="font-medium">{loadError}</span>
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-lg bg-[#102A43] text-white hover:bg-[#1B3A5A] font-semibold transition cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#687787]">
              Chưa có người dùng nào. Hãy thêm người dùng đầu tiên để bắt đầu.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F7F4ED] text-[#687787] uppercase text-[11px] tracking-wider border-b border-[#E5E0D7]">
                <tr>
                  <th className="p-3.5 font-semibold">Người dùng</th>
                  <th className="p-3.5 font-semibold">Email</th>
                  <th className="p-3.5 font-semibold">Vai trò</th>
                  <th className="p-3.5 font-semibold">Trạng thái</th>
                  <th className="p-3.5 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEAE2]">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="text-[#334E68] hover:bg-[#FCFBF8] transition-colors">
                      <td className="p-3.5">
                        <p className="font-semibold text-[#102A43]">{user.fullName}</p>
                        <span className="text-[11px] font-mono text-[#397C80]">{user.username}</span>
                      </td>
                      <td className="p-3.5 text-[#5A6578]">{user.email}</td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
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
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#102A43] hover:bg-[#F7F4ED] border border-[#E5E0D7] transition"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#687787]" /> Xem
                          </Link>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setIsModalOpen(true);
                            }}
                            aria-label={`Chỉnh sửa ${user.fullName}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#8C6D3B] hover:bg-[#FAF6F0] border border-[#C5A572]/50 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#C5A572]" /> Sửa
                          </button>
                          <button
                            onClick={() => setStatusTarget(user)}
                            aria-label={`${user.active ? 'Vô hiệu hóa' : 'Kích hoạt'} ${user.fullName}`}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                              user.active
                                ? 'text-amber-700 hover:bg-amber-50 border-amber-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                            }`}
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
                    <td colSpan={5} className="p-10 text-center text-[#687787]">
                      Không tìm thấy người dùng nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

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
