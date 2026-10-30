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
    setIsLoading(true);
    setLoadError(null);
    try {
      setUsers(await getUsers());
      setIsDemo(Boolean(isUsingDemoData()));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#102A43] flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-[#C5A572]" /> Quản Lý Người Dùng (Identity &amp; Access)
          </h2>
          <p className="text-xs text-[#627D98] mt-1">
            Quản trị hệ thống • Tạo tài khoản, phân vai trò và bật/tắt quyền truy cập
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102A43] hover:bg-[#1B3B5A] text-white rounded-lg text-xs font-semibold shadow-xs border border-[#C5A572]/40 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C5A572]" /> Thêm Người Dùng
        </button>
      </div>

      {isDemo && (
        <div
          role="note"
          className="flex items-start gap-2 p-3 bg-[#F7F4ED] border border-[#C5A572]/40 rounded-xl text-xs text-[#102A43]"
        >
          <Info className="w-4 h-4 text-[#C5A572] shrink-0 mt-0.5" />
          <span>
            Đang hiển thị dữ liệu mẫu vì chưa kết nối được API người dùng. Mọi thay đổi chỉ lưu
            tạm trong phiên làm việc này.
          </span>
        </div>
      )}

      {notification && (
        <div
          role="status"
          className="p-3 bg-[#EAF2F2] border border-[#397C80]/30 rounded-xl flex items-center gap-2 text-[#102A43] text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-[#397C80] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <SpotlightCard
              key={card.id}
              spotlightColor="rgba(197, 165, 114, 0.15)"
              borderGlowColor="#C5A572"
              className="bg-white border border-[#E5E0D7] rounded-xl p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#627D98]">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.tone}`} />
              </div>
              <p
                data-testid={`kpi-${card.id}`}
                className="font-display text-2xl font-bold text-[#102A43] mt-2"
              >
                {card.value}
              </p>
            </SpotlightCard>
          );
        })}
      </div>

      <div className="bg-white border border-[#E5E0D7] rounded-xl overflow-hidden p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#397C80]" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm người dùng"
              placeholder="Tìm theo tên, tài khoản, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg text-xs text-[#252B32] placeholder-[#627D98] focus:outline-none focus:border-[#C5A572] w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#397C80]" />
            <select
              aria-label="Lọc theo vai trò"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg text-xs text-[#252B32] focus:outline-none focus:border-[#C5A572] w-full sm:w-56"
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

        <div className="mt-4 overflow-x-auto border-t border-[#E5E0D7]">
          {isLoading ? (
            <div
              role="status"
              className="p-10 flex items-center justify-center gap-2 text-xs text-[#627D98]"
            >
              <Loader2 className="w-4 h-4 animate-spin text-[#C5A572]" /> Đang tải danh sách người dùng...
            </div>
          ) : loadError ? (
            <div role="alert" className="p-10 flex flex-col items-center gap-3 text-xs text-rose-700">
              <AlertTriangle className="w-5 h-5" />
              <span>{loadError}</span>
              <button
                onClick={() => void loadUsers()}
                className="px-4 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#627D98]">
              Chưa có người dùng nào. Hãy thêm người dùng đầu tiên để bắt đầu.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-[#252B32]">
              <thead className="bg-[#F7F4ED] text-[#627D98] uppercase text-[10px] font-mono tracking-wider border-b border-[#E5E0D7]">
                <tr>
                  <th className="p-3.5">Người dùng</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Vai trò</th>
                  <th className="p-3.5">Trạng thái</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D7]">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#F7F4ED]/60 transition-colors">
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
                      <td className="p-3.5 text-[#627D98]">{user.email}</td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#102A43] text-[#C5A572] border border-[#C5A572]/30">
                          {getRoleLabel(user.role)}
                        </span>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[#627D98] mt-1">
                          {getRoleRank(user.role)}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            user.active
                              ? 'bg-[#EAF2F2] text-[#397C80] border-[#397C80]/30'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#627D98] hover:text-[#102A43] hover:bg-[#F7F4ED] border border-[#E5E0D7]"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem
                          </Link>
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setIsModalOpen(true);
                            }}
                            aria-label={`Chỉnh sửa ${user.fullName}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#397C80] hover:text-[#102A43] hover:bg-[#EAF2F2] border border-[#397C80]/30 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button
                            onClick={() => setStatusTarget(user)}
                            aria-label={`${user.active ? 'Vô hiệu hóa' : 'Kích hoạt'} ${user.fullName}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8A6A2F] hover:text-[#102A43] hover:bg-[#C5A572]/15 border border-[#C5A572]/50 cursor-pointer"
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
                    <td colSpan={5} className="p-8 text-center text-[#627D98]">
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
