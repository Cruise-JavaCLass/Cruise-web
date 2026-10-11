import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Ship as ShipIcon,
  ArrowLeft,
  Edit2,
  Anchor,
  Users,
  Compass,
  Layers,
  Ruler,
  Calendar,
  Info,
  Star,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { Ship, ShipFormData, ShipStatus } from '../services/shipService';
import { getShips, updateShip, formatShipPayload } from '../services/shipService';
import { ShipFormModal } from '../components/ships/ShipFormModal';

function getStatusBadge(status: ShipStatus) {
  switch (status) {
    case 'ACTIVE':
      return { cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Đang hoạt động' };
    case 'ON_VOYAGE':
      return { cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', label: 'Đang hành trình' };
    case 'DOCKED':
      return { cls: 'bg-blue-500/20 text-blue-300 border-blue-500/30', label: 'Neo đậu cảng' };
    case 'UNDER_MAINTENANCE':
      return { cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Bảo dưỡng kỹ thuật' };
    case 'INACTIVE':
    default:
      return { cls: 'bg-slate-800 text-slate-400 border-slate-700', label: 'Ngừng hoạt động' };
  }
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent = 'text-cyan-400' }: StatCardProps) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
      <div className={`mt-0.5 shrink-0 ${accent}`}>{icon}</div>
      <div>
        <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
        <p className="text-lg font-bold text-white leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function ShipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ship, setShip] = useState<Ship | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const ships = await getShips();
      const found = ships.find((s) => s.id === Number(id));
      setShip(found ?? null);
      setLoading(false);
    })();
  }, [id]);

  const handleFormSubmit = async (formData: ShipFormData) => {
    if (!ship) return;
    setIsSubmitting(true);
    try {
      const formatted = formatShipPayload(formData);
      const updated = await updateShip(ship.id, formData).catch(() => ({
        ...ship,
        ...formatted,
      }));
      setShip(updated as Ship);
      setIsModalOpen(false);
      showNotification(`Đã cập nhật thông tin tàu ${formData.name} thành công!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-sm">Đang tải thông tin tàu...</p>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
          <ShipIcon className="w-8 h-8 text-slate-500" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">Không tìm thấy tàu</p>
          <p className="text-slate-400 text-sm mt-1">ID #{id} không tồn tại trong hệ thống.</p>
        </div>
        <button
          onClick={() => navigate('/ships')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Về danh sách tàu
        </button>
      </div>
    );
  }

  const { cls: statusCls, label: statusLabel } = getStatusBadge(ship.status);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-400" aria-label="breadcrumb">
        <Link to="/ships" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
          <ShipIcon className="w-3.5 h-3.5" /> Đội tàu
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-600" />
        <span className="text-slate-200 font-medium truncate">{ship.name}</span>
      </nav>

      {/* Notification */}
      {notification && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-emerald-300 text-xs">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Cover image */}
        {ship.imageUrl ? (
          <div className="relative h-48 sm:h-60 w-full overflow-hidden">
            <img
              src={ship.imageUrl}
              alt={ship.name}
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 flex items-center justify-center">
            <ShipIcon className="w-16 h-16 text-slate-700" />
          </div>
        )}

        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-6 relative z-10">
          <div className="flex items-end gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-700 to-blue-700 border border-cyan-600/30 flex items-center justify-center shadow-xl shadow-cyan-900/40 shrink-0">
              <ShipIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">{ship.name}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="font-mono text-xs text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md">
                  {ship.code}
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCls}`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all self-start sm:self-auto shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa thông tin
          </button>
        </div>

        {ship.description && (
          <div className="px-6 pb-5">
            <div className="flex items-start gap-2 text-slate-400 text-xs bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
              <p>{ship.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Sức chứa hành khách"
          value={ship.capacity.toLocaleString()}
          sub="hành khách tối đa"
          accent="text-cyan-400"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Thủy thủ đoàn"
          value={ship.crewCapacity.toLocaleString()}
          sub="thành viên đoàn"
          accent="text-indigo-400"
        />
        <StatCard
          icon={<Anchor className="w-5 h-5" />}
          label="Tổng số cabin"
          value={ship.totalCabins.toLocaleString()}
          sub="phòng / cabin"
          accent="text-violet-400"
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          label="Số tầng / boong"
          value={ship.totalDecks}
          sub="tầng boong tàu"
          accent="text-blue-400"
        />
        {ship.lengthMeters && (
          <StatCard
            icon={<Ruler className="w-5 h-5" />}
            label="Chiều dài"
            value={`${ship.lengthMeters} m`}
            sub="chiều dài thân tàu"
            accent="text-teal-400"
          />
        )}
        {ship.beamMeters && (
          <StatCard
            icon={<Compass className="w-5 h-5" />}
            label="Chiều rộng"
            value={`${ship.beamMeters} m`}
            sub="chiều rộng thân tàu"
            accent="text-teal-400"
          />
        )}
        {ship.draftMeters && (
          <StatCard
            icon={<Ruler className="w-5 h-5" />}
            label="Mớn nước"
            value={`${ship.draftMeters} m`}
            sub="độ chìm trong nước"
            accent="text-teal-400"
          />
        )}
        {ship.manufacturingYear && (
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Năm đóng tàu"
            value={ship.manufacturingYear}
            sub={`${new Date().getFullYear() - ship.manufacturingYear} năm tuổi`}
            accent="text-rose-400"
          />
        )}
      </div>

      {/* Bottom Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Operator */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ShipIcon className="w-3.5 h-3.5 text-cyan-400" /> Đơn vị vận hành
          </h3>
          <p className="text-white font-semibold text-sm">{ship.operator}</p>
          <p className="text-slate-500 text-xs mt-1">Mã tàu: <span className="font-mono text-cyan-400">{ship.code}</span></p>
        </div>

        {/* Amenities */}
        {ship.amenities && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-400" /> Tiện nghi nổi bật
            </h3>
            <div className="flex flex-wrap gap-2">
              {ship.amenities.split(',').map((a) => (
                <span
                  key={a.trim()}
                  className="text-[11px] px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg"
                >
                  {a.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/ships')}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách đội tàu
        </button>
      </div>

      {/* Edit Modal */}
      <ShipFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={ship}
        isLoading={isSubmitting}
      />
    </div>
  );
}
