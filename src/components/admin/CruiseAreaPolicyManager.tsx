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
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building className="w-7 h-7 text-indigo-600" />
            Quản Lý Sơ Đồ Boong Tàu & Chính Sách Vận Hành
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập khu vực boong, giới hạn sức chứa an toàn hàng hải và ma trận chính sách hoàn hủy
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="ship-select" className="text-xs font-semibold text-slate-500">Tàu:</label>
            <select
              id="ship-select"
              value={shipId}
              onChange={(e) => setShipId(Number(e.target.value))}
              aria-label="Chọn du thuyền"
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={1}>Tàu 1 (Halong Grand Pearl)</option>
              <option value={2}>Tàu 2 (Emerald Princess)</option>
              <option value={3}>Tàu 3 (Imperial Sapphire)</option>
            </select>
          </div>
          <button
            onClick={() => setActiveTab('DECKS')}
            className={`px-4 py-2 font-semibold rounded-xl text-sm transition-colors ${
              activeTab === 'DECKS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sơ Đồ Boong (Decks)
          </button>
          <button
            onClick={() => setActiveTab('POLICIES')}
            className={`px-4 py-2 font-semibold rounded-xl text-sm transition-colors ${
              activeTab === 'POLICIES' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chính Sách Hoàn Hủy
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Deck Zones */}
      {activeTab === 'DECKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Zones */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Danh Sách Phân Vùng Boong (Tàu #{shipId})
              </h3>
              <button
                onClick={() => void loadData()}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                title="Tải lại"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {zones.length > 0 ? (
                zones.map((z) => (
                  <div key={z.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded">
                          Tầng {z.deckNumber}
                        </span>
                        <span className="font-bold text-slate-800 text-sm">{z.zoneName}</span>
                        <span className="text-xs font-mono text-slate-400">({z.zoneCode})</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>Loại: {z.zoneType}</span>
                        {z.hasLifeboatAccess && (
                          <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                            <LifeBuoy className="w-3.5 h-3.5" /> Xuồng cứu sinh
                          </span>
                        )}
                        {z.isRestricted && (
                          <span className="text-rose-600 flex items-center gap-0.5 font-medium">
                            <ShieldAlert className="w-3.5 h-3.5" /> Khu vực hạn chế
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Sức Chứa An Toàn
                      </span>
                      <span className="font-black text-indigo-600 text-base">{z.maxSafetyCapacity} khách</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có khu vực boong nào được thiết lập</p>
              )}
            </div>
          </div>

          {/* Create Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Thêm Phân Vùng Boong Mới
            </h3>
            <form onSubmit={handleCreateZone} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số Tầng (Deck) *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newZone.deckNumber}
                  onChange={(e) => setNewZone({ ...newZone, deckNumber: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên Khu Vực *</label>
                <input
                  type="text"
                  placeholder="VD: Quầy Bar Hồ Bơi Phía Đông"
                  value={newZone.zoneName}
                  onChange={(e) => setNewZone({ ...newZone, zoneName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mã Phân Vùng *</label>
                <input
                  type="text"
                  placeholder="VD: DECK9-POOL-EAST"
                  value={newZone.zoneCode}
                  onChange={(e) => setNewZone({ ...newZone, zoneCode: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Sức Chứa An Toàn Tối Đa *</label>
                <input
                  type="number"
                  min="1"
                  value={newZone.maxSafetyCapacity}
                  onChange={(e) => setNewZone({ ...newZone, maxSafetyCapacity: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phân Loại Khu Vực *</label>
                <select
                  value={newZone.zoneType}
                  onChange={(e) => setNewZone({ ...newZone, zoneType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="POOL_DECK">Hồ Bơi & Boong Tắm Nắng</option>
                  <option value="THEATER">Nhà Hát & Hội Trường</option>
                  <option value="DINING">Nhà Hàng & Quầy Bar</option>
                  <option value="CABIN_CORRIDOR">Hành Lang Cabin</option>
                  <option value="LIFEBOAT_STATION">Trạm Tập Trung Xuồng Cứu Sinh</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={newZone.hasLifeboatAccess}
                    onChange={(e) => setNewZone({ ...newZone, hasLifeboatAccess: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Gần trạm xuồng</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={newZone.isRestricted}
                    onChange={(e) => setNewZone({ ...newZone, isRestricted: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>Hạn chế tiếp cận</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition-colors disabled:opacity-50"
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
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              Ma Trận Chính Sách Hoàn Hủy & Phí Phạt Vận Hành
            </h3>

            <div className="divide-y divide-slate-100">
              {policies.length > 0 ? (
                policies.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{p.policyName}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-indigo-600">{p.serviceType}</span>
                        <span>Hủy trước {p.hoursBeforeCutoff} giờ</span>
                        <span>Phí hủy: ${p.cancellationFee || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Tỷ Lệ Hoàn
                      </span>
                      <span className="font-black text-emerald-600 text-base">{p.refundPercentage}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">Chưa có chính sách hoàn hủy nào</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Tạo Chính Sách Hủy Mới
            </h3>
            <form onSubmit={handleCreatePolicy} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tên Chính Sách *</label>
                <input
                  type="text"
                  placeholder="VD: Tour Bờ Hoàn Tiền 100% 24h"
                  value={newPolicy.policyName}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policyName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Loại Dịch Vụ *</label>
                <select
                  value={newPolicy.serviceType}
                  onChange={(e) => setNewPolicy({ ...newPolicy, serviceType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="EXCURSION">Tour Tham Quan Bờ (Excursion)</option>
                  <option value="ONBOARD_ACTIVITY">Hoạt Động Trên Tàu</option>
                  <option value="SPA">Dịch Vụ Spa & Trị Liệu</option>
                  <option value="DINING">Nhà Hàng Đặc Biệt</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số Giờ Trước Khởi Hành (Cut-off) *</label>
                <input
                  type="number"
                  min="0"
                  value={newPolicy.hoursBeforeCutoff}
                  onChange={(e) => setNewPolicy({ ...newPolicy, hoursBeforeCutoff: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tỷ Lệ Hoàn Tiền (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newPolicy.refundPercentage}
                  onChange={(e) => setNewPolicy({ ...newPolicy, refundPercentage: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow transition-colors disabled:opacity-50"
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
