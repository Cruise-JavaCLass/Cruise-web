import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Ship as ShipIcon,
  Plus,
  Search,
  Edit2,
  Eye,
  Anchor,
  Users,
  Compass,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import type { Ship, ShipFormData, ShipStatus } from '../services/shipService';
import {
  getShips,
  createShip,
  updateShip,
  formatShipPayload,
} from '../services/shipService';
import { ShipFormModal } from '../components/ships/ShipFormModal';

export function ShipsPage() {
  const [ships, setShips] = useState<Ship[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShip, setEditingShip] = useState<Ship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadShips = async () => {
    const data = await getShips();
    setShips(data);
  };

  useEffect(() => {
    void loadShips();
  }, []);

  const handleOpenCreate = () => {
    setEditingShip(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ship: Ship) => {
    setEditingShip(ship);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: ShipFormData) => {
    setIsSubmitting(true);
    try {
      const formatted = formatShipPayload(formData);
      if (editingShip) {
        // Edit mode
        const updated = await updateShip(editingShip.id, formData).catch(() => ({
          ...editingShip,
          ...formatted,
        }));
        setShips((prev) =>
          prev.map((s) => (s.id === editingShip.id ? (updated as Ship) : s))
        );
        showNotification(`Đã cập nhật thông tin tàu ${formData.name} (${formData.code}) thành công!`);
      } else {
        // Create mode
        const newShip = await createShip(formData).catch(() => ({
          id: Date.now(),
          active: true,
          ...formatted,
        }));
        setShips((prev) => [newShip as Ship, ...prev]);
        showNotification(`Đã tạo mới du thuyền ${formData.name} (${formData.code}) thành công!`);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const filteredShips = ships.filter((ship) => {
    const matchesSearch =
      ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.operator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || ship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ShipStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/70';
      case 'ON_VOYAGE':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200/70';
      case 'DOCKED':
        return 'bg-sky-50 text-sky-700 border border-sky-200/70';
      case 'UNDER_MAINTENANCE':
        return 'bg-amber-50 text-amber-700 border border-amber-200/70';
      case 'INACTIVE':
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200/70';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header — Soft Editorial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 tracking-wider">
              FLEET MANAGEMENT
            </span>
            <span className="text-[11px] font-medium text-[#687080]">• MARITIME ASSETS</span>
          </div>
          <h2 className="text-2xl font-bold text-[#20242C] flex items-center gap-2.5 tracking-tight">
            <ShipIcon className="w-6 h-6 text-[#5277D9]" /> Quản Lý Đội Tàu Du Lịch (Cruise Ships)
          </h2>
          <p className="text-xs text-[#687080] mt-1">
            Bộ phận Điều phối & Quản trị Hệ thống • Thiết lập danh mục tàu, sức chứa, buồng phòng và trạng thái khai thác
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#5277D9] hover:bg-[#4364BE] text-white text-xs font-semibold rounded-[10px] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Tàu Mới
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] flex items-center gap-2.5 text-xs font-medium shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metrics Cards — Soft Editorial */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#687080] uppercase tracking-wider">Tổng số tàu</span>
          <p className="text-2xl font-bold tabular-nums text-[#20242C] mt-1">{ships.length}</p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#687080] uppercase tracking-wider">Đang hoạt động / Biển</span>
          <p className="text-2xl font-bold tabular-nums text-emerald-600 mt-1">
            {ships.filter((s) => s.status === 'ACTIVE' || s.status === 'ON_VOYAGE').length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#687080] uppercase tracking-wider">Đang neo đậu cảng</span>
          <p className="text-2xl font-bold tabular-nums text-[#5277D9] mt-1">
            {ships.filter((s) => s.status === 'DOCKED').length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#687080] uppercase tracking-wider">Bảo dưỡng kỹ thuật</span>
          <p className="text-2xl font-bold tabular-nums text-amber-600 mt-1">
            {ships.filter((s) => s.status === 'UNDER_MAINTENANCE').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#687080]" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm tàu du lịch"
              placeholder="Tìm theo tên tàu, mã hiệu, hãng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#687080]" />
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-[#F9FAFB] hover:bg-white border border-[#E5E7EB] rounded-[10px] text-[#20242C] focus:ring-2 focus:ring-[#5277D9]/20 focus:border-[#5277D9] w-full sm:w-56"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ON_VOYAGE">ON_VOYAGE</option>
              <option value="DOCKED">DOCKED</option>
              <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </div>

        {/* Ships Table */}
        <div className="mt-4 overflow-x-auto border border-[#E5E7EB] rounded-[10px] bg-white">
          <table className="w-full text-left text-xs text-[#20242C]">
            <thead className="bg-[#F9FAFB] text-[#687080] uppercase text-[10px] font-semibold tracking-wider border-b border-[#E5E7EB]">
              <tr>
                <th className="p-3.5">Du thuyền & Mã hiệu</th>
                <th className="p-3.5">Hãng khai thác</th>
                <th className="p-3.5">Sức chứa (Khách / Thuyền viên)</th>
                <th className="p-3.5">Cabin / Tầng</th>
                <th className="p-3.5">Kích thước (D x R)</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredShips.length > 0 ? (
                filteredShips.map((ship) => (
                  <tr key={ship.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#EEF2FF] border border-[#5277D9]/20 rounded-[8px] flex items-center justify-center shrink-0">
                          <ShipIcon className="w-4 h-4 text-[#5277D9]" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#20242C]">{ship.name}</p>
                          <span className="text-[11px] font-mono font-medium text-[#5277D9]">{ship.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-[#687080]">{ship.operator}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 tabular-nums text-xs">
                        <Users className="w-3.5 h-3.5 text-[#5277D9]" />
                        <span className="font-semibold text-[#20242C]">{ship.capacity.toLocaleString()} khách</span>
                        <span className="text-[#687080]/40">/</span>
                        <span className="text-[#687080]">{ship.crewCapacity} đoàn</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 tabular-nums text-xs">
                        <Anchor className="w-3.5 h-3.5 text-[#687080]" />
                        <span className="font-semibold text-[#20242C]">{ship.totalCabins} cabin</span>
                        <span className="text-[#687080]/40">•</span>
                        <span className="text-[#687080]">{ship.totalDecks} tầng</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 tabular-nums text-xs text-[#687080]">
                        <Compass className="w-3.5 h-3.5 text-[#687080]" />
                        <span>
                          {ship.lengthMeters ? `${ship.lengthMeters}m` : 'N/A'} ×{' '}
                          {ship.beamMeters ? `${ship.beamMeters}m` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold ${getStatusBadge(ship.status)}`}
                      >
                        {ship.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/ships/${ship.id}`}
                          aria-label={`Xem chi tiết ${ship.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#20242C] bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] rounded-[8px] transition-colors shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(ship)}
                          aria-label={`Chỉnh sửa ${ship.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#5277D9] hover:bg-[#4364BE] rounded-[8px] transition-colors shadow-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#687080] text-xs font-medium">
                    Không tìm thấy tàu du lịch nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ship Form Modal for Create & Edit */}
      <ShipFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingShip}
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default ShipsPage;
