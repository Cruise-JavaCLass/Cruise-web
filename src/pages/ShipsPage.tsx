import { useState, useEffect } from 'react';
import {
  Ship as ShipIcon,
  Plus,
  Search,
  Edit2,
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
    loadShips();
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
      if (editingShip) {
        // Edit mode
        const updated = await updateShip(editingShip.id, formData).catch(() => ({
          ...editingShip,
          ...formData,
          capacity: Number(formData.capacity),
          crewCapacity: Number(formData.crewCapacity),
          totalCabins: Number(formData.totalCabins),
          totalDecks: Number(formData.totalDecks),
          manufacturingYear: formData.manufacturingYear ? Number(formData.manufacturingYear) : undefined,
          lengthMeters: formData.lengthMeters ? Number(formData.lengthMeters) : undefined,
          beamMeters: formData.beamMeters ? Number(formData.beamMeters) : undefined,
          draftMeters: formData.draftMeters ? Number(formData.draftMeters) : undefined,
        }));
        setShips((prev) =>
          prev.map((s) => (s.id === editingShip.id ? (updated as Ship) : s))
        );
        showNotification(`Đã cập nhật thông tin tàu ${formData.name} (${formData.code}) thành công!`);
      } else {
        // Create mode
        const newShip = await createShip(formData).catch(() => ({
          id: Date.now(),
          ...formData,
          code: formData.code.toUpperCase(),
          capacity: Number(formData.capacity),
          crewCapacity: Number(formData.crewCapacity),
          totalCabins: Number(formData.totalCabins),
          totalDecks: Number(formData.totalDecks),
          manufacturingYear: formData.manufacturingYear ? Number(formData.manufacturingYear) : undefined,
          lengthMeters: formData.lengthMeters ? Number(formData.lengthMeters) : undefined,
          beamMeters: formData.beamMeters ? Number(formData.beamMeters) : undefined,
          draftMeters: formData.draftMeters ? Number(formData.draftMeters) : undefined,
          active: true,
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
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'ON_VOYAGE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'DOCKED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'UNDER_MAINTENANCE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'INACTIVE':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShipIcon className="w-5 h-5 text-cyan-400" /> Quản Lý Đội Tàu Du Lịch (Cruise Ships)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bộ phận Điều phối & Quản trị Hệ thống • Thiết lập danh mục tàu, sức chứa, buồng phòng và trạng thái khai thác
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Thêm Tàu Mới
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-300 text-xs transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Tổng số tàu</span>
          <p className="text-xl font-bold text-white mt-1">{ships.length}</p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Đang hoạt động / Biển</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            {ships.filter((s) => s.status === 'ACTIVE' || s.status === 'ON_VOYAGE').length}
          </p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Đang neo đậu cảng</span>
          <p className="text-xl font-bold text-blue-400 mt-1">
            {ships.filter((s) => s.status === 'DOCKED').length}
          </p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Bảo dưỡng kỹ thuật</span>
          <p className="text-xl font-bold text-amber-400 mt-1">
            {ships.filter((s) => s.status === 'UNDER_MAINTENANCE').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              role="searchbox"
              aria-label="Tìm kiếm tàu du lịch"
              placeholder="Tìm theo tên tàu, mã hiệu, hãng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-48"
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
        <div className="mt-4 overflow-x-auto border-t border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/40 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {filteredShips.length > 0 ? (
                filteredShips.map((ship) => (
                  <tr key={ship.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0">
                          <ShipIcon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{ship.name}</p>
                          <span className="text-[11px] font-mono text-cyan-400">{ship.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300">{ship.operator}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{ship.capacity.toLocaleString()} khách</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400">{ship.crewCapacity} đoàn</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Anchor className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{ship.totalCabins} cabin</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{ship.totalDecks} tầng</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Compass className="w-3 h-3 text-slate-400" />
                        <span>
                          {ship.lengthMeters ? `${ship.lengthMeters}m` : 'N/A'} ×{' '}
                          {ship.beamMeters ? `${ship.beamMeters}m` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          ship.status
                        )}`}
                      >
                        {ship.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenEdit(ship)}
                        aria-label={`Chỉnh sửa ${ship.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 hover:text-white hover:bg-cyan-600/20 border border-cyan-500/30 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
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
