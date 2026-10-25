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
      return { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70', label: 'Đang hoạt động' };
    case 'ON_VOYAGE':
      return { cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70', label: 'Đang hành trình' };
    case 'DOCKED':
      return { cls: 'bg-sky-50 text-sky-700 border border-sky-200/70', label: 'Neo đậu cảng' };
    case 'UNDER_MAINTENANCE':
      return { cls: 'bg-amber-50 text-amber-700 border border-amber-200/70', label: 'Bảo dưỡng kỹ thuật' };
    case 'INACTIVE':
    default:
      return { cls: 'bg-gray-100 text-gray-700 border border-gray-200/70', label: 'Ngừng hoạt động' };
  }
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent = 'text-[#5277D9]' }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-4.5 flex items-start gap-3 shadow-xs">
      <div className={`mt-0.5 shrink-0 ${accent}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-[#687080] uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-bold tabular-nums text-[#20242C] leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-[#687080] mt-0.5">{sub}</p>}
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
        <div className="neo-card p-6 flex flex-col items-center gap-3 text-[#171717]">
          <Loader2 className="w-8 h-8 animate-spin text-[#3155E7]" />
          <p className="text-xs font-mono font-bold uppercase tracking-wider">Đang tải thông tin tàu...</p>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 bg-[#E7E4DC] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex items-center justify-center">
          <ShipIcon className="w-8 h-8 text-[#171717]" />
        </div>
        <div>
          <p className="text-[#171717] font-display font-black text-xl uppercase">Không tìm thấy tàu</p>
          <p className="text-[#171717]/70 text-xs font-mono mt-1">ID #{id} không tồn tại trong hệ thống.</p>
        </div>
        <button
          onClick={() => navigate('/ships')}
          className="neo-btn neo-btn-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Về danh sách tàu
        </button>
      </div>
    );
  }

  const { cls: statusCls, label: statusLabel } = getStatusBadge(ship.status);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-[#687080]" aria-label="breadcrumb">
        <Link to="/ships" className="hover:text-[#5277D9] transition-colors flex items-center gap-1 uppercase font-semibold">
          <ShipIcon className="w-3.5 h-3.5" /> Đội tàu
        </Link>
        <ChevronRight className="w-3 h-3 text-[#687080]/50" />
        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-[#EEF2FF] text-[#5277D9] border border-[#5277D9]/20 truncate">
          {ship.name}
        </span>
      </nav>

      {/* Notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[10px] flex items-center gap-2.5 text-xs font-medium shadow-xs">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header Card — Soft Editorial */}
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] overflow-hidden shadow-xs">
        {/* Cover image */}
        {ship.imageUrl ? (
          <div className="relative h-48 sm:h-64 w-full overflow-hidden border-b border-[#E5E7EB]">
            <img
              src={ship.imageUrl}
              alt={ship.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-[#F6F7F9] border-b border-[#E5E7EB] flex items-center justify-center">
            <ShipIcon className="w-16 h-16 text-[#687080]/30" />
          </div>
        )}

        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-start sm:items-end gap-4">
            <div className="w-14 h-14 bg-[#EEF2FF] border border-[#5277D9]/20 rounded-[12px] flex items-center justify-center shrink-0">
              <ShipIcon className="w-7 h-7 text-[#5277D9]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#20242C] leading-tight tracking-tight">
                {ship.name}
              </h2>
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-mono font-semibold bg-[#F6F7F9] border border-[#E5E7EB] text-[#5277D9]">
                  {ship.code}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold ${statusCls}`}>
                  {statusLabel}
                </span>
                <span className="text-xs text-[#687080] font-medium">• {ship.operator}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5277D9] hover:bg-[#4364BE] text-white text-xs font-semibold rounded-[10px] shadow-xs transition-colors self-start sm:self-auto shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa thông tin
          </button>
        </div>

        {ship.description && (
          <div className="px-6 pb-5">
            <div className="flex items-start gap-2.5 text-[#20242C] text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-[10px] p-3.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#5277D9]" />
              <p className="text-[#687080] leading-relaxed">{ship.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid — Soft Editorial Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Sức chứa hành khách"
          value={ship.capacity.toLocaleString()}
          sub="hành khách tối đa"
          accent="text-[#5277D9]"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Thủy thủ đoàn"
          value={ship.crewCapacity.toLocaleString()}
          sub="thành viên đoàn"
          accent="text-[#20242C]"
        />
        <StatCard
          icon={<Anchor className="w-5 h-5" />}
          label="Tổng số cabin"
          value={ship.totalCabins.toLocaleString()}
          sub="phòng / cabin"
          accent="text-[#5277D9]"
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          label="Số tầng / boong"
          value={ship.totalDecks}
          sub="tầng boong tàu"
          accent="text-[#20242C]"
        />
        {ship.lengthMeters && (
          <StatCard
            icon={<Ruler className="w-5 h-5" />}
            label="Chiều dài"
            value={`${ship.lengthMeters} m`}
            sub="chiều dài thân tàu"
            accent="text-emerald-600"
          />
        )}
        {ship.beamMeters && (
          <StatCard
            icon={<Compass className="w-5 h-5" />}
            label="Chiều rộng"
            value={`${ship.beamMeters} m`}
            sub="chiều rộng thân tàu"
            accent="text-emerald-600"
          />
        )}
        {ship.draftMeters && (
          <StatCard
            icon={<Ruler className="w-5 h-5" />}
            label="Mớn nước"
            value={`${ship.draftMeters} m`}
            sub="độ chìm trong nước"
            accent="text-emerald-600"
          />
        )}
        {ship.manufacturingYear && (
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Năm đóng tàu"
            value={ship.manufacturingYear}
            sub={`${new Date().getFullYear() - ship.manufacturingYear} năm tuổi`}
            accent="text-rose-600"
          />
        )}
      </div>

      {/* Bottom Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Operator */}
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 shadow-xs">
          <h3 className="text-xs font-semibold text-[#687080] uppercase tracking-wider mb-2 flex items-center gap-2">
            <ShipIcon className="w-4 h-4 text-[#5277D9]" /> Đơn vị vận hành
          </h3>
          <p className="text-[#20242C] font-bold text-base">{ship.operator}</p>
          <p className="text-[#687080] text-xs mt-1">Mã tàu: <span className="font-semibold text-[#5277D9]">{ship.code}</span></p>
        </div>

        {/* Amenities */}
        {ship.amenities && (
          <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-[#687080] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Tiện nghi nổi bật
            </h3>
            <div className="flex flex-wrap gap-2">
              {ship.amenities.split(',').map((a) => (
                <span
                  key={a.trim()}
                  className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[#F6F7F9] text-[#20242C] border border-[#E5E7EB]"
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#20242C] text-xs font-semibold rounded-[10px] shadow-xs transition-colors"
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

export default ShipDetailPage;
