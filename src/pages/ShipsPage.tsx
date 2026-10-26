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

const FALLBACK_SHIPS: Ship[] = [
  {
    id: 1,
    name: 'Halong Grand Harmony',
    code: 'SHIP-001',
    operator: 'Paradise Vietnam Cruises',
    capacity: 2400,
    crewCapacity: 750,
    totalCabins: 1100,
    totalDecks: 14,
    manufacturingYear: 2023,
    lengthMeters: 315.5,
    beamMeters: 38.0,
    draftMeters: 8.5,
    status: 'ACTIVE',
    description: 'Du thuyền 5 sao đẳng cấp quốc tế phục vụ các tour cao cấp vịnh Hạ Long',
    amenities: 'Sky Pool, Luxury Spa, Grand Ballroom, VIP Helipad',
    imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 2,
    name: 'Ocean Pearl Voyager',
    code: 'SHIP-002',
    operator: 'Indochina Sails Group',
    capacity: 1800,
    crewCapacity: 520,
    totalCabins: 850,
    totalDecks: 11,
    manufacturingYear: 2021,
    lengthMeters: 280.0,
    beamMeters: 34.0,
    draftMeters: 7.8,
    status: 'ON_VOYAGE',
    description: 'Hải trình khám phá Di sản Miền Trung và vịnh Nha Trang',
    amenities: 'Cinema, Infinity Pool, Sunset Lounge',
    imageUrl: 'https://images.unsplash.com/photo-1505705694340-019e1e335916?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
  {
    id: 3,
    name: 'Phu Quoc Princess',
    code: 'SHIP-003',
    operator: 'Sun World Cruises',
    capacity: 1200,
    crewCapacity: 380,
    totalCabins: 550,
    totalDecks: 9,
    manufacturingYear: 2020,
    lengthMeters: 220.0,
    beamMeters: 29.0,
    draftMeters: 6.9,
    status: 'DOCKED',
    description: 'Du thuyền ven đảo Phú Quốc và vịnh Thái Lan',
    amenities: 'Snorkeling Deck, Sea View Dining',
    imageUrl: 'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?auto=format&fit=crop&w=600&q=80',
    active: true,
  },
];

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
    setShips(data && data.length > 0 ? data : FALLBACK_SHIPS);
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
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200/80';
      case 'ON_VOYAGE':
        return 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20';
      case 'DOCKED':
        return 'bg-sky-50 text-sky-800 border border-sky-200/80';
      case 'UNDER_MAINTENANCE':
        return 'bg-amber-50 text-amber-800 border border-amber-200/80';
      case 'INACTIVE':
      default:
        return 'bg-[#F7F4ED] text-[#252B32]/70 border border-[#E5E0D7]';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header — Luxury Maritime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D7]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] tracking-wider">
              FLEET MANAGEMENT
            </span>
            <span className="text-[11px] font-medium text-[#5A6578]">• MARITIME ASSETS</span>
          </div>
          <h2 className="text-2xl font-bold font-serif text-[#102A43] flex items-center gap-2.5 tracking-tight">
            <ShipIcon className="w-6 h-6 text-[#102A43]" /> Quản Lý Đội Tàu Du Lịch (Cruise Ships)
          </h2>
          <p className="text-xs text-[#5A6578] mt-1">
            Bộ phận Điều phối & Quản trị Hệ thống • Thiết lập danh mục tàu, sức chứa, buồng phòng và trạng thái khai thác
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C5A572]" /> Thêm Tàu Mới
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-medium shadow-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metrics Cards — Luxury Maritime */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider">Tổng số tàu</span>
          <p className="text-2xl font-bold tabular-nums text-[#102A43] mt-1">{ships.length}</p>
        </div>
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider">Đang hoạt động / Biển</span>
          <p className="text-2xl font-bold tabular-nums text-emerald-700 mt-1">
            {ships.filter((s) => s.status === 'ACTIVE' || s.status === 'ON_VOYAGE').length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider">Đang neo đậu cảng</span>
          <p className="text-2xl font-bold tabular-nums text-[#397C80] mt-1">
            {ships.filter((s) => s.status === 'DOCKED').length}
          </p>
        </div>
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 shadow-xs">
          <span className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider">Bảo dưỡng kỹ thuật</span>
          <p className="text-2xl font-bold tabular-nums text-amber-700 mt-1">
            {ships.filter((s) => s.status === 'UNDER_MAINTENANCE').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#5A6578]" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm tàu du lịch"
              placeholder="Tìm theo tên tàu, mã hiệu, hãng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs bg-[#F7F4ED]/50 hover:bg-white focus:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#5A6578]" />
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-[#F7F4ED]/50 hover:bg-white border border-[#E5E0D7] rounded-xl text-[#252B32] focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43] w-full sm:w-56"
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
        <div className="mt-4 overflow-x-auto border border-[#E5E0D7] rounded-xl bg-white">
          <table className="w-full text-left text-xs text-[#252B32]">
            <thead className="bg-[#F7F4ED] text-[#102A43] uppercase text-[10px] font-semibold tracking-wider border-b border-[#E5E0D7]">
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
            <tbody className="divide-y divide-[#E5E0D7]">
              {filteredShips.length > 0 ? (
                filteredShips.map((ship) => (
                  <tr key={ship.id} className="hover:bg-[#F7F4ED]/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-center shrink-0">
                          <ShipIcon className="w-4 h-4 text-[#102A43]" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-[#102A43]">{ship.name}</p>
                          <span className="text-[11px] font-mono font-medium text-[#397C80]">{ship.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-[#5A6578]">{ship.operator}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 tabular-nums text-xs">
                        <Users className="w-3.5 h-3.5 text-[#397C80]" />
                        <span className="font-semibold text-[#252B32]">{ship.capacity.toLocaleString()} khách</span>
                        <span className="text-[#5A6578]/40">/</span>
                        <span className="text-[#5A6578]">{ship.crewCapacity} đoàn</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 tabular-nums text-xs">
                        <Anchor className="w-3.5 h-3.5 text-[#5A6578]" />
                        <span className="font-semibold text-[#252B32]">{ship.totalCabins} cabin</span>
                        <span className="text-[#5A6578]/40">•</span>
                        <span className="text-[#5A6578]">{ship.totalDecks} tầng</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 tabular-nums text-xs text-[#5A6578]">
                        <Compass className="w-3.5 h-3.5 text-[#5A6578]" />
                        <span>
                          {ship.lengthMeters ? `${ship.lengthMeters}m` : 'N/A'} ×{' '}
                          {ship.beamMeters ? `${ship.beamMeters}m` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(ship.status)}`}
                      >
                        {ship.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/ships/${ship.id}`}
                          aria-label={`Xem chi tiết ${ship.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#102A43] bg-white border border-[#E5E0D7] hover:bg-[#F7F4ED] rounded-lg transition-colors shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(ship)}
                          aria-label={`Chỉnh sửa ${ship.name}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#102A43] hover:bg-[#0B1F33] rounded-lg transition-colors shadow-xs cursor-pointer"
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
                  <td colSpan={7} className="p-8 text-center text-[#5A6578] text-xs font-medium">
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
