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
        return 'bg-[#10B981] text-[#171717] border-[#171717]';
      case 'ON_VOYAGE':
        return 'bg-[#3155E7] text-white border-[#171717]';
      case 'DOCKED':
        return 'bg-[#D9FF43] text-[#171717] border-[#171717]';
      case 'UNDER_MAINTENANCE':
        return 'bg-[#F59E0B] text-[#171717] border-[#171717]';
      case 'INACTIVE':
      default:
        return 'bg-[#E7E4DC] text-[#171717] border-[#171717]';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header — Editorial Broadside */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#171717]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neo-badge bg-[#3155E7] text-white">FLEET MANAGEMENT</span>
            <span className="text-[10px] font-mono text-[#171717]/60 font-bold">• MARITIME ASSETS</span>
          </div>
          <h2 className="text-2xl font-display font-black text-[#171717] flex items-center gap-2 uppercase tracking-tight">
            <ShipIcon className="w-6 h-6 text-[#3155E7]" /> Quản Lý Đội Tàu Du Lịch (Cruise Ships)
          </h2>
          <p className="text-xs font-mono text-[#171717]/70 mt-1">
            Bộ phận Điều phối & Quản trị Hệ thống • Thiết lập danh mục tàu, sức chứa, buồng phòng và trạng thái khai thác
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="neo-btn neo-btn-acid flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Tàu Mới
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-[#10B981]/20 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center gap-2 text-[#171717] text-xs font-mono font-bold transition-all">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metrics Cards — Neo-Brutalist Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="neo-card p-4">
          <span className="text-[10px] text-[#171717]/70 font-mono font-bold uppercase tracking-wider">Tổng số tàu</span>
          <p className="text-3xl font-display font-black text-[#171717] mt-1">{ships.length}</p>
        </div>
        <div className="neo-card p-4">
          <span className="text-[10px] text-[#171717]/70 font-mono font-bold uppercase tracking-wider">Đang hoạt động / Biển</span>
          <p className="text-3xl font-display font-black text-[#059669] mt-1">
            {ships.filter((s) => s.status === 'ACTIVE' || s.status === 'ON_VOYAGE').length}
          </p>
        </div>
        <div className="neo-card p-4">
          <span className="text-[10px] text-[#171717]/70 font-mono font-bold uppercase tracking-wider">Đang neo đậu cảng</span>
          <p className="text-3xl font-display font-black text-[#3155E7] mt-1">
            {ships.filter((s) => s.status === 'DOCKED').length}
          </p>
        </div>
        <div className="neo-card p-4">
          <span className="text-[10px] text-[#171717]/70 font-mono font-bold uppercase tracking-wider">Bảo dưỡng kỹ thuật</span>
          <p className="text-3xl font-display font-black text-[#D97706] mt-1">
            {ships.filter((s) => s.status === 'UNDER_MAINTENANCE').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="neo-card p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#171717]/60" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm tàu du lịch"
              placeholder="Tìm theo tên tàu, mã hiệu, hãng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neo-input pl-9 pr-4 py-2 w-full text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#171717]" />
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neo-input px-3 py-2 text-xs font-mono font-bold uppercase w-full sm:w-56"
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
        <div className="mt-4 overflow-x-auto border-2 border-[#171717] bg-white shadow-[2px_2px_0px_#171717]">
          <table className="w-full text-left text-xs text-[#171717]">
            <thead className="bg-[#E7E4DC] text-[#171717] uppercase text-[10px] font-mono font-black tracking-wider border-b-2 border-[#171717]">
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
            <tbody className="divide-y-2 divide-[#171717]/10">
              {filteredShips.length > 0 ? (
                filteredShips.map((ship) => (
                  <tr key={ship.id} className="hover:bg-[#D9FF43]/10 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#E7E4DC] border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] flex items-center justify-center shrink-0">
                          <ShipIcon className="w-4 h-4 text-[#3155E7]" />
                        </div>
                        <div>
                          <p className="font-display font-black text-sm text-[#171717]">{ship.name}</p>
                          <span className="text-[10px] font-mono font-bold text-[#3155E7]">{ship.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium">{ship.operator}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Users className="w-3.5 h-3.5 text-[#3155E7]" />
                        <span className="font-bold">{ship.capacity.toLocaleString()} khách</span>
                        <span className="text-[#171717]/40">/</span>
                        <span className="text-[#171717]/70">{ship.crewCapacity} đoàn</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Anchor className="w-3.5 h-3.5 text-[#171717]" />
                        <span className="font-bold">{ship.totalCabins} cabin</span>
                        <span className="text-[#171717]/40">•</span>
                        <span className="text-[#171717]/70">{ship.totalDecks} tầng</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <Compass className="w-3.5 h-3.5 text-[#171717]/60" />
                        <span>
                          {ship.lengthMeters ? `${ship.lengthMeters}m` : 'N/A'} ×{' '}
                          {ship.beamMeters ? `${ship.beamMeters}m` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`neo-badge ${getStatusBadge(ship.status)}`}
                      >
                        {ship.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/ships/${ship.id}`}
                          aria-label={`Xem chi tiết ${ship.name}`}
                          className="neo-btn neo-btn-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(ship)}
                          aria-label={`Chỉnh sửa ${ship.name}`}
                          className="neo-btn neo-btn-primary text-[10px] py-1 px-2.5 flex items-center gap-1"
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
                  <td colSpan={7} className="p-8 text-center text-[#171717]/60 font-mono text-xs">
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
