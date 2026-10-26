import {
  AlertTriangle,
  Building,
  Check,
  Layers,
  LifeBuoy,
  Plus,
  RefreshCw,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import {
  type ShipDeckZone,
  type SystemCancellationPolicy,
  cruiseAreaPolicyService,
} from '../../services/cruiseAreaPolicyService';

interface CruiseAreaPolicyManagerProps {
  shipId?: number;
}

export const CruiseAreaPolicyManager: React.FC<CruiseAreaPolicyManagerProps> = ({ shipId: initialShipId = 1 }) => {
  const [activeTab, setActiveTab] = useState<'DECKS' | 'POLICIES'>('DECKS');
  const [zones, setZones] = useState<ShipDeckZone[]>([]);
  const [zonesShipId, setZonesShipId] = useState<number | null>(null);
  const [policies, setPolicies] = useState<SystemCancellationPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shipId, setShipId] = useState<number>(initialShipId);

  useEffect(() => {
    setShipId(initialShipId);
  }, [initialShipId]);

  // New Zone Form
  const [newZone, setNewZone] = useState<Partial<ShipDeckZone>>({
    shipId,
    deckNumber: 5,
    zoneName: '',
    zoneCode: '',
    maxSafetyCapacity: 200,
    zoneType: 'POOL_DECK',
    hasLifeboatAccess: false,
    isRestricted: false,
  });

  // New Policy Form
  const [newPolicy, setNewPolicy] = useState<Partial<SystemCancellationPolicy>>({
    policyName: '',
    serviceType: 'EXCURSION',
    hoursBeforeCutoff: 24,
    refundPercentage: 100,
    cancellationFee: 0,
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const latestLoadId = useRef(0);

  const loadData = async () => {
    const loadId = ++latestLoadId.current;
    setLoading(true);
    setError(null);
    try {
      const [zList, pList] = await Promise.all([
        cruiseAreaPolicyService.getDeckZones(shipId),
        cruiseAreaPolicyService.getCancellationPolicies(),
      ]);
      if (loadId === latestLoadId.current) {
        setZones(zList);
        setZonesShipId(shipId);
      }
      if (loadId === latestLoadId.current) {
        setPolicies(pList);
      }
    } catch (err: any) {
      if (loadId === latestLoadId.current) {
        setError(err?.message || 'Không thể tải dữ liệu cấu hình boong & chính sách');
      }
    } finally {
      if (loadId === latestLoadId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadData();
  }, [shipId]);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZone.zoneName || !newZone.zoneCode) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await cruiseAreaPolicyService.createDeckZone({
        ...(newZone as ShipDeckZone),
        shipId,
      });
      setSuccessMsg('Đã thêm khu vực boong mới thành công');
      setNewZone({
        shipId,
        deckNumber: 5,
        zoneName: '',
        zoneCode: '',
        maxSafetyCapacity: 200,
        zoneType: 'POOL_DECK',
        hasLifeboatAccess: false,
        isRestricted: false,
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tạo khu vực boong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.policyName) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      await cruiseAreaPolicyService.createCancellationPolicy(newPolicy as SystemCancellationPolicy);
      setSuccessMsg('Đã tạo chính sách hủy & hoàn tiền mới thành công');
      setNewPolicy({
        policyName: '',
        serviceType: 'EXCURSION',
        hoursBeforeCutoff: 24,
        refundPercentage: 100,
        cancellationFee: 0,
        isActive: true,
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tạo chính sách hủy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 text-[#252B32]">
      {/* Header — Luxury Maritime */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs">
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#102A43] tracking-tight flex items-center gap-2">
            <Building className="w-7 h-7 text-[#102A43]" />
            Quản Lý Sơ Đồ Boong Tàu & Chính Sách Vận Hành
          </h1>
          <p className="text-sm text-[#5A6578] mt-1">
            Thiết lập khu vực boong, giới hạn sức chứa an toàn hàng hải và ma trận chính sách hoàn hủy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="ship-select" className="text-xs font-semibold text-[#5A6578]">Tàu:</label>
            <select
              id="ship-select"
              value={shipId}
              onChange={(e) => setShipId(Number(e.target.value))}
              aria-label="Chọn du thuyền"
              className="bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
            >
              <option value={1}>Tàu 1 (Halong Grand Pearl)</option>
              <option value={2}>Tàu 2 (Emerald Princess)</option>
              <option value={3}>Tàu 3 (Imperial Sapphire)</option>
            </select>
          </div>
          <button
            onClick={() => setActiveTab('DECKS')}
            className={`px-4 py-2 font-semibold rounded-xl text-sm transition-colors cursor-pointer ${
              activeTab === 'DECKS'
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] hover:bg-[#ECE7DC]'
            }`}
          >
            Sơ Đồ Boong (Decks)
          </button>
          <button
            onClick={() => setActiveTab('POLICIES')}
            className={`px-4 py-2 font-semibold rounded-xl text-sm transition-colors cursor-pointer ${
              activeTab === 'POLICIES'
                ? 'bg-[#102A43] text-white shadow-xs'
                : 'bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] hover:bg-[#ECE7DC]'
            }`}
          >
            Chính Sách Hoàn Hủy
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Deck Zones */}
      {activeTab === 'DECKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Zones */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold font-serif text-[#102A43] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#397C80]" />
                Danh Sách Phân Vùng Boong (Tàu #{shipId})
              </h3>
              <button
                onClick={() => void loadData()}
                disabled={loading}
                className="p-1.5 text-[#5A6578] hover:bg-[#F7F4ED] rounded-lg transition-colors cursor-pointer"
                title="Tải lại"
              >
                <RefreshCw className={`w-4 h-4 text-[#397C80] ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y divide-[#E5E0D7]">
              {zonesShipId === shipId && zones.length > 0 ? (
                zones.map((z) => (
                  <div key={z.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] font-bold text-xs rounded-lg">
                          Tầng {z.deckNumber}
                        </span>
                        <span className="font-bold text-[#102A43] text-sm">{z.zoneName}</span>
                        <span className="text-xs font-mono text-[#5A6578]">({z.zoneCode})</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#5A6578] mt-1">
                        <span>Loại: {z.zoneType}</span>
                        {z.hasLifeboatAccess && (
                          <span className="text-emerald-700 flex items-center gap-0.5 font-medium">
                            <LifeBuoy className="w-3.5 h-3.5 text-emerald-600" /> Xuồng cứu sinh
                          </span>
                        )}
                        {z.isRestricted && (
                          <span className="text-rose-700 flex items-center gap-0.5 font-medium">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Khu vực hạn chế
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#5A6578] uppercase tracking-wider block">
                        Sức Chứa An Toàn
                      </span>
                      <span className="font-bold text-[#102A43] text-base">{z.maxSafetyCapacity} khách</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#5A6578] py-6 text-center">Chưa có khu vực boong nào được thiết lập</p>
              )}
            </div>
          </div>

          {/* Create Form */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs space-y-4">
            <h3 className="font-bold font-serif text-[#102A43] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C5A572]" />
              Thêm Phân Vùng Boong Mới
            </h3>
            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Số Tầng (Deck) *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newZone.deckNumber}
                  onChange={(e) => setNewZone({ ...newZone, deckNumber: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Tên Khu Vực *</label>
                <input
                  type="text"
                  placeholder="VD: Quầy Bar Hồ Bơi Phía Đông"
                  value={newZone.zoneName}
                  onChange={(e) => setNewZone({ ...newZone, zoneName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Mã Phân Vùng *</label>
                <input
                  type="text"
                  placeholder="VD: DECK9-POOL-EAST"
                  value={newZone.zoneCode}
                  onChange={(e) => setNewZone({ ...newZone, zoneCode: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] font-mono focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Sức Chứa An Toàn Tối Đa *</label>
                <input
                  type="number"
                  min="1"
                  value={newZone.maxSafetyCapacity}
                  onChange={(e) => setNewZone({ ...newZone, maxSafetyCapacity: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Phân Loại Khu Vực *</label>
                <select
                  value={newZone.zoneType}
                  onChange={(e) => setNewZone({ ...newZone, zoneType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                >
                  <option value="POOL_DECK">Hồ Bơi & Boong Tắm Nắng</option>
                  <option value="THEATER">Nhà Hát & Hội Trường</option>
                  <option value="DINING">Nhà Hàng & Quầy Bar</option>
                  <option value="CABIN_CORRIDOR">Hành Lang Cabin</option>
                  <option value="LIFEBOAT_STATION">Trạm Tập Trung Xuồng Cứu Sinh</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#252B32]">
                  <input
                    type="checkbox"
                    checked={newZone.hasLifeboatAccess}
                    onChange={(e) => setNewZone({ ...newZone, hasLifeboatAccess: e.target.checked })}
                    className="rounded accent-[#102A43]"
                  />
                  <span>Gần trạm xuồng</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#252B32]">
                  <input
                    type="checkbox"
                    checked={newZone.isRestricted}
                    onChange={(e) => setNewZone({ ...newZone, isRestricted: e.target.checked })}
                    className="rounded accent-[#102A43]"
                  />
                  <span>Hạn chế tiếp cận</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang Lưu...' : 'Lưu Khu Vực Boong'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Policies */}
      {activeTab === 'POLICIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs space-y-4">
            <h3 className="font-bold font-serif text-[#102A43] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#397C80]" />
              Ma Trận Chính Sách Hoàn Hủy & Phí Phạt Vận Hành
            </h3>

            <div className="divide-y divide-[#E5E0D7]">
              {policies.length > 0 ? (
                policies.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#102A43] text-sm">{p.policyName}</span>
                      <div className="flex items-center gap-3 text-xs text-[#5A6578] mt-1">
                        <span className="font-semibold text-[#397C80]">{p.serviceType}</span>
                        <span>Hủy trước {p.hoursBeforeCutoff} giờ</span>
                        <span>Phí hủy: ${p.cancellationFee || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#5A6578] uppercase tracking-wider block">
                        Tỷ Lệ Hoàn
                      </span>
                      <span className="font-bold text-emerald-700 text-base">{p.refundPercentage}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#5A6578] py-6 text-center">Chưa có chính sách hoàn hủy nào</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D7] shadow-xs space-y-4">
            <h3 className="font-bold font-serif text-[#102A43] flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C5A572]" />
              Tạo Chính Sách Hủy Mới
            </h3>
            <form onSubmit={handleCreatePolicy} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Tên Chính Sách *</label>
                <input
                  type="text"
                  placeholder="VD: Tour Bờ Hoàn Tiền 100% 24h"
                  value={newPolicy.policyName}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policyName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Loại Dịch Vụ *</label>
                <select
                  value={newPolicy.serviceType}
                  onChange={(e) => setNewPolicy({ ...newPolicy, serviceType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                >
                  <option value="EXCURSION">Tour Tham Quan Bờ (Excursion)</option>
                  <option value="ONBOARD_ACTIVITY">Hoạt Động Trên Tàu</option>
                  <option value="SPA">Dịch Vụ Spa & Trị Liệu</option>
                  <option value="DINING">Nhà Hàng Đặc Biệt</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Số Giờ Trước Khởi Hành (Cut-off) *</label>
                <input
                  type="number"
                  min="0"
                  value={newPolicy.hoursBeforeCutoff}
                  onChange={(e) => setNewPolicy({ ...newPolicy, hoursBeforeCutoff: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#252B32] mb-1">Tỷ Lệ Hoàn Tiền (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPolicy.refundPercentage}
                  onChange={(e) => setNewPolicy({ ...newPolicy, refundPercentage: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-2 focus:ring-[#102A43]/10"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Đang Lưu...' : 'Lưu Chính Sách Hủy'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CruiseAreaPolicyManager;
