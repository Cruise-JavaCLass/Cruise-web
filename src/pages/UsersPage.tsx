import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Anchor,
  Radio,
  Crown,
  Lock,
  Info,
} from 'lucide-react';
import type { User, UserFormData, UserRole } from '../services/userService';
import {
  getUsers,
  createUser,
  updateUser,
  setUserActive,
  getRoleLabel,
  getRoleRank,
  extractApiError,
  isUsingDemoData,
  SENIOR_ROLES,
  USER_ROLES,
} from '../services/userService';
import { UserFormModal } from '../components/users/UserFormModal';
import { UserStatusConfirmModal } from '../components/users/UserStatusConfirmModal';
import { SpotlightCard } from '../components/ui/SpotlightCard';

/** Avatar gradient theo vai trò (Luxury Maritime: navy, teal, gold) */
const ROLE_AVATAR_GRADIENT: Record<UserRole, string> = {
  SYSTEM_ADMIN: 'from-[#102A43] to-[#397C80]',
  OPERATIONS_MANAGER: 'from-[#C5A572] to-[#102A43]',
  ACTIVITY_MANAGER: 'from-[#397C80] to-[#102A43]',
  SHORE_EXCURSION_MANAGER: 'from-[#397C80] to-[#C5A572]',
  ITINERARY_COORDINATOR: 'from-[#627D98] to-[#102A43]',
  FINANCE_FRONT_DESK: 'from-[#C5A572] to-[#397C80]',
  POS_STAFF: 'from-[#627D98] to-[#397C80]',
  PASSENGER: 'from-[#627D98] to-[#C5A572]',
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
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
      setIsDemo(Boolean(isUsingDemoData()));
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

  // KPI tính trên thuyền viên (không tính hành khách)
  const kpis = useMemo(() => {
    const crew = users.filter((u) => u.role !== 'PASSENGER');
    return {
      total: crew.length,
      onDuty: crew.filter((u) => u.active).length,
      senior: crew.filter((u) => SENIOR_ROLES.includes(u.role)).length,
      locked: crew.filter((u) => !u.active).length,
    };
  }, [users]);

  const kpiCards = [
    { id: 'total', label: 'Tổng thuyền viên', value: kpis.total, icon: Anchor, tone: 'text-[#102A43]' },
    { id: 'on-duty', label: 'Đang trực ca', value: kpis.onDuty, icon: Radio, tone: 'text-[#397C80]' },
    { id: 'senior', label: 'Quản lý cấp cao', value: kpis.senior, icon: Crown, tone: 'text-[#C5A572]' },
    { id: 'locked', label: 'Tài khoản tạm khóa', value: kpis.locked, icon: Lock, tone: 'text-rose-600' },
  ];

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

      {/* Demo Mode Notice */}
      {isDemo && (
        <div
          role="note"
          className="flex items-start gap-2 p-3.5 bg-[#F7F4ED] border border-[#C5A572]/40 rounded-xl text-xs text-[#102A43] shadow-xs"
        >
          <Info className="w-4 h-4 text-[#C5A572] shrink-0 mt-0.5" />
          <span>
            Đang hiển thị dữ liệu mẫu vì chưa kết nối được API người dùng. Mọi thay đổi chỉ lưu
            tạm trong phiên làm việc này.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <SpotlightCard
              key={kpi.id}
              className="p-4 bg-white border border-[#E5E0D7] rounded-xl shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#687787]">{kpi.label}</span>
                <span className={`p-1.5 rounded-lg bg-[#F7F4ED] ${kpi.tone}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <p
                data-testid={`kpi-${kpi.id}`}
                className="font-serif text-2xl font-bold text-[#102A43]"
              >
                {kpi.value}
              </p>
            </SpotlightCard>
          );
        })}
      </div>

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
              type="search"
              aria-label="Tìm kiếm người dùng"
              placeholder="Tìm theo tên, username, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#E5E0D7] rounded-lg text-xs text-[#102A43] placeholder-[#9AA3AC] focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80] transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#687787]" />
            <select
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#E5E0D7] rounded-lg text-xs text-[#102A43] focus:outline-none focus:border-[#397C80] cursor-pointer"
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

        {/* Content body */}
        <div className="p-0 overflow-x-auto">
          {isLoading ? (
            <div role="status" className="flex items-center justify-center p-12 text-xs text-[#687787] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#397C80]" />
              <span>Đang tải danh sách người dùng...</span>
            </div>
          ) : loadError ? (
            <div role="alert" className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-rose-700 mb-3">{loadError}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-white border border-[#E5E0D7] text-[#102A43] hover:bg-[#F7F4ED] rounded-lg text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#687787]">
              Chưa có người dùng nào được tạo trong hệ thống.
            </div>
          ) : (
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-[#FAF8F5] text-[#5A6578] border-b border-[#E5E0D7]">
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
                        <div className="flex items-center gap-3">
                          <div
                            aria-hidden="true"
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${ROLE_AVATAR_GRADIENT[user.role]} text-white flex items-center justify-center text-[11px] font-bold border border-[#C5A572]/40 shrink-0`}
                          >
                            {getInitials(user.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#102A43] truncate">{user.fullName}</p>
                            <span className="text-[11px] font-mono text-[#397C80]">{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-[#5A6578]">{user.email}</td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]">
                          {getRoleLabel(user.role)}
                        </span>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[#687787] mt-1">
                          {getRoleRank(user.role)}
                        </p>
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
