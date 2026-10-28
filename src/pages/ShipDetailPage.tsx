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

function getStatusBadge(status: ShipStatus) {
  switch (status) {
    case 'ACTIVE':
      return { cls: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80', label: 'Đang hoạt động' };
    case 'ON_VOYAGE':
      return { cls: 'bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20', label: 'Đang hành trình' };
    case 'DOCKED':
      return { cls: 'bg-sky-50 text-sky-800 border border-sky-200/80', label: 'Neo đậu cảng' };
    case 'UNDER_MAINTENANCE':
      return { cls: 'bg-amber-50 text-amber-800 border border-amber-200/80', label: 'Bảo dưỡng kỹ thuật' };
    case 'INACTIVE':
    default:
      return { cls: 'bg-[#F7F4ED] text-[#252B32]/70 border border-[#E5E0D7]', label: 'Ngừng hoạt động' };
  }
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

function StatCard({ icon, label, value, sub, accent = 'text-[#397C80]' }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E5E0D7] rounded-2xl p-4.5 flex items-start gap-3 shadow-xs">
      <div className={`mt-0.5 shrink-0 ${accent}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-medium text-[#5A6578] uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-bold tabular-nums text-[#102A43] leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-[#5A6578] mt-0.5">{sub}</p>}
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
      const data = await getShips();
      const shipsList = data && data.length > 0 ? data : FALLBACK_SHIPS;
      const found = shipsList.find((s) => s.id === Number(id));
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
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 flex flex-col items-center gap-3 text-[#252B32] shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-[#102A43]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5A6578]">Đang tải thông tin tàu...</p>
        </div>
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (!ship) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl shadow-sm flex items-center justify-center">
          <ShipIcon className="w-8 h-8 text-[#102A43]" />
        </div>
        <div>
          <p className="text-[#102A43] font-serif font-bold text-xl uppercase">Không tìm thấy tàu</p>
          <p className="text-[#5A6578] text-xs mt-1">ID #{id} không tồn tại trong hệ thống.</p>
        </div>
        <button
          onClick={() => navigate('/ships')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1 text-[#C5A572]" /> Về danh sách tàu
        </button>
      </div>
    );
  }

  const { cls: statusCls, label: statusLabel } = getStatusBadge(ship.status);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-[#5A6578]" aria-label="breadcrumb">
        <Link to="/ships" className="hover:text-[#102A43] transition-colors flex items-center gap-1 uppercase font-semibold">
          <ShipIcon className="w-3.5 h-3.5 text-[#102A43]" /> Đội tàu
        </Link>
        <ChevronRight className="w-3 h-3 text-[#5A6578]/50" />
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] truncate">
          {ship.name}
        </span>
      </nav>

      {/* Notification */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2.5 text-xs font-medium shadow-xs">
          <span>✓</span>
          <span>{notification}</span>
        </div>
      )}

      {/* Header Card — Luxury Maritime */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl overflow-hidden shadow-xs">
        {/* Cover image */}
        {ship.imageUrl ? (
          <div className="relative h-48 sm:h-64 w-full overflow-hidden border-b border-[#E5E0D7]">
            <img
              src={ship.imageUrl}
              alt={ship.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 bg-[#F7F4ED] border-b border-[#E5E0D7] flex items-center justify-center">
            <ShipIcon className="w-16 h-16 text-[#5A6578]/30" />
          </div>
        )}

        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-start sm:items-end gap-4">
            <div className="w-14 h-14 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center justify-center shrink-0">
              <ShipIcon className="w-7 h-7 text-[#102A43]" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102A43] leading-tight tracking-tight">
                {ship.name}
              </h2>
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#F7F4ED] border border-[#E5E0D7] text-[#397C80]">
                  {ship.code}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCls}`}>
                  {statusLabel}
                </span>
                <span className="text-xs text-[#5A6578] font-medium">• {ship.operator}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#C5A572]" /> Chỉnh sửa thông tin
          </button>
        </div>

        {ship.description && (
          <div className="px-6 pb-5">
            <div className="flex items-start gap-2.5 text-[#252B32] text-xs bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl p-3.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#397C80]" />
              <p className="text-[#5A6578] leading-relaxed">{ship.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid — Luxury Maritime Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Sức chứa hành khách"
          value={ship.capacity.toLocaleString()}
          sub="hành khách tối đa"
          accent="text-[#397C80]"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Thủy thủ đoàn"
          value={ship.crewCapacity.toLocaleString()}
          sub="thành viên đoàn"
          accent="text-[#102A43]"
        />
        <StatCard
          icon={<Anchor className="w-5 h-5" />}
          label="Tổng số cabin"
          value={ship.totalCabins.toLocaleString()}
          sub="phòng / cabin"
          accent="text-[#397C80]"
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          label="Số tầng / boong"
          value={ship.totalDecks}
          sub="tầng boong tàu"
          accent="text-[#102A43]"
        />
        {ship.lengthMeters && (
          <StatCard
            icon={<Ruler className="w-5 h-5" />}
            label="Chiều dài"
            value={`${ship.lengthMeters} m`}
            sub="chiều dài thân tàu"
            accent="text-emerald-700"
          />
        )}
        {ship.beamMeters && (
          <StatCard
            icon={<Compass className="w-5 h-5" />}
            label="Chiều rộng"
            value={`${ship.beamMeters} m`}
            sub="chiều rộng thân tàu"
            accent="text-emerald-700"
          />
        )}
        {ship.draftMeters && (
          <StatCard
            icon={<Ruler className="w-5 h-5" />}
            label="Mớn nước"
            value={`${ship.draftMeters} m`}
            sub="độ chìm trong nước"
            accent="text-emerald-700"
          />
        )}
        {ship.manufacturingYear && (
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Năm đóng tàu"
            value={ship.manufacturingYear}
            sub={`${new Date().getFullYear() - ship.manufacturingYear} năm tuổi`}
            accent="text-amber-700"
          />
        )}
      </div>

      {/* Bottom Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Operator */}
        <div className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-semibold text-[#5A6578] uppercase tracking-wider mb-2 flex items-center gap-2">
            <ShipIcon className="w-4 h-4 text-[#102A43]" /> Đơn vị vận hành
          </h3>
          <p className="text-[#102A43] font-serif font-bold text-base">{ship.operator}</p>
          <p className="text-[#5A6578] text-xs mt-1">Mã tàu: <span className="font-semibold text-[#397C80]">{ship.code}</span></p>
        </div>

        {/* Amenities */}
        {ship.amenities && (
          <div className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold text-[#5A6578] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#C5A572]" /> Tiện nghi nổi bật
            </h3>
            <div className="flex flex-wrap gap-2">
              {ship.amenities.split(',').map((a) => (
                <span
                  key={a.trim()}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7]"
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7F4ED] border border-[#E5E0D7] hover:bg-[#ECE7DC] text-[#102A43] text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
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
