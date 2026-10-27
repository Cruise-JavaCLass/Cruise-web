import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Users,
  Bus,
  Phone,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Compass,
} from 'lucide-react';
import {
  type ShoreExcursion,
  type ExcursionPassenger,
  getExcursionById,
  deleteExcursion,
  EXCURSION_STATUS_MAP,
  EXCURSION_CATEGORY_LABELS,
  EXCURSION_DIFFICULTY_LABELS,
  INITIAL_EXCURSION_PASSENGERS,
} from '../services/excursionService';
import { ExcursionModal } from '../components/excursions/ExcursionModal';
import { ExcursionStatusModal } from '../components/excursions/ExcursionStatusModal';
import { ExcursionManifestModal } from '../components/excursions/ExcursionManifestModal';
import { ExcursionScheduleTimeline } from '../components/excursions/ExcursionScheduleTimeline';

export function ExcursionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [excursion, setExcursion] = useState<ShoreExcursion | null>(null);
  const [passengers, setPassengers] = useState<ExcursionPassenger[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [passengerSearch, setPassengerSearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadExcursion = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getExcursionById(Number(id));
      if (data) {
        setExcursion(data);
        setPassengers(
          data.passengers && data.passengers.length > 0
            ? data.passengers
            : []
        );
      } else {
        setExcursion(null);
      }
    } catch {
      showToast('Không thể tải chi tiết tour trên bờ.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadExcursion();
  }, [loadExcursion]);

  const handleDelete = async () => {
    if (!excursion) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tour "${excursion.title}"?`)) return;

    try {
      await deleteExcursion(excursion.id);
      navigate('/excursions');
    } catch {
      showToast('Không thể xóa tour.');
    }
  };

  const handleTogglePassengerStatus = (pid: number) => {
    setPassengers((prev) =>
      prev.map((p) => {
        if (p.id !== pid) return p;
        let nextStatus: ExcursionPassenger['status'] = 'CHECKED_IN';
        if (p.status === 'REGISTERED') nextStatus = 'CHECKED_IN';
        else if (p.status === 'CHECKED_IN') nextStatus = 'ON_TOUR';
        else if (p.status === 'ON_TOUR') nextStatus = 'RETURNED_SAFE';
        else if (p.status === 'RETURNED_SAFE') nextStatus = 'REGISTERED';
        return { ...p, status: nextStatus };
      })
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#252B32] space-y-4">
        <div className="w-12 h-12 bg-white border border-[#E5E0D7] rounded-xl shadow-sm flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#102A43] animate-spin" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wider text-[#687787]">Đang tải thông tin tour trên bờ...</span>
      </div>
    );
  }

  if (!excursion) {
    return (
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto mt-8 shadow-xs">
        <div className="w-16 h-16 mx-auto mb-2 bg-[#F7F4ED] rounded-xl flex items-center justify-center">
          <Compass className="w-8 h-8 text-[#C5A572]" />
        </div>
        <h3 className="text-xl font-bold text-[#102A43] font-serif uppercase">Không tìm thấy thông tin tour trên bờ</h3>
        <p className="text-xs text-[#687787]">Tour có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link
          to="/excursions"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-lg text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </Link>
      </div>
    );
  }

  const statusConfig = EXCURSION_STATUS_MAP[excursion.status];
  const diffConfig = EXCURSION_DIFFICULTY_LABELS[excursion.difficulty];

  // Return margin calculation
  const [retH, retM] = excursion.returnToShipTime.split(':').map(Number);
  const [aboardH, aboardM] = excursion.allAboardTime.split(':').map(Number);
  const marginMinutes = aboardH * 60 + aboardM - (retH * 60 + retM);

  const filteredPassengers = passengers.filter(
    (p) =>
      p.passengerName.toLowerCase().includes(passengerSearch.toLowerCase()) ||
      p.cabinNumber.toLowerCase().includes(passengerSearch.toLowerCase()) ||
      p.ticketCode.toLowerCase().includes(passengerSearch.toLowerCase())
  );

  const returnedSafeCount = passengers.filter((p) => p.status === 'RETURNED_SAFE').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-white border border-[#E5E0D7] text-[#252B32] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action bar — Luxury Maritime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E0D7]">
        <div className="flex items-center gap-3">
          <Link
            to="/excursions"
            className="w-10 h-10 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-lg shadow-xs flex items-center justify-center transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-semibold text-[#687787] uppercase">Tour Trên Bờ</span>
              <span className="text-[#687787]/40">/</span>
              <span className="font-mono text-[10px] font-bold text-[#397C80] uppercase">{excursion.code}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#102A43] font-serif uppercase tracking-tight">{excursion.title}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManifestModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#C5A572]" /> Đoàn & Xe
          </button>
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#397C80]" /> Đổi Trạng Thái
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-medium bg-white hover:bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7] rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#687787]" /> Chỉnh Sửa
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 bg-white hover:bg-rose-50 text-rose-600 border border-[#E5E0D7] rounded-lg shadow-xs flex items-center justify-center transition-colors"
            title="Xóa tour"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Alert Banner if DELAYED */}
      {excursion.status === 'DELAYED' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950 uppercase text-sm">CẢNH BÁO: CHUYẾN TOUR ĐANG BỊ TRỄ GIỜ</h4>
            <p className="text-[#252B32]">
              Lý do ghi nhận:{' '}
              <strong className="text-amber-800">{excursion.delayReason || 'Xe trung chuyển bị kẹt do thời tiết mưa lớn cục bộ'}</strong>
            </p>
            <p className="text-[11px] text-[#687787]">
              Bộ phận hải trình và trưởng tàu đã nhận được cảnh báo để điều phối phao tiêu cập cảng an toàn.
            </p>
          </div>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info & Operational Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card — Luxury Maritime White Block */}
          <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 space-y-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D7] pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#102A43] text-white">
                  {statusConfig.label}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7]">
                  {EXCURSION_CATEGORY_LABELS[excursion.category]}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-[#397C80]/10 text-[#285E61] border border-[#397C80]/20">
                  Độ khó: {diffConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#252B32]">
                <MapPin className="w-4 h-4 text-[#397C80]" />
                <span>{excursion.portName} ({excursion.portCity})</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-[#687787] uppercase tracking-wider">
                Mô tả chương trình tham quan
              </h4>
              <p className="text-xs sm:text-sm text-[#252B32] leading-relaxed">
                {excursion.description || 'Chưa có thông tin mô tả chi tiết cho tour trên bờ này.'}
              </p>
            </div>

            {/* Operational Timing Strip */}
            <ExcursionScheduleTimeline
              meetingTime={excursion.meetingTime}
              departureTime={excursion.departureTime}
              returnToShipTime={excursion.returnToShipTime}
              allAboardTime={excursion.allAboardTime}
              marginMinutes={marginMinutes}
            />
          </div>

          {/* Passenger Manifest Table */}
          <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D7]">
              <div>
                <h3 className="text-base font-bold text-[#102A43] font-serif uppercase flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#397C80]" /> Danh Sách Hành Khách Đi Theo Đoàn
                </h3>
                <p className="text-xs text-[#687787] mt-0.5">
                  Đã về tàu an toàn: <strong className="text-[#102A43] font-semibold">{returnedSafeCount}</strong> / {passengers.length} hành khách
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#687787] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Lọc tên, cabin..."
                  value={passengerSearch}
                  onChange={(e) => setPassengerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F4ED]/60 border border-[#E5E0D7] rounded-lg text-[#252B32] placeholder-[#687787]/60 focus:ring-2 focus:ring-[#102A43]/15 focus:border-[#102A43]"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-[#E5E0D7] rounded-lg">
              <table className="w-full text-left text-xs text-[#252B32]">
                <thead className="bg-[#F7F4ED] text-[#687787] uppercase font-semibold text-[10px] border-b border-[#E5E0D7]">
                  <tr>
                    <th className="py-2.5 px-3">Hành Khách</th>
                    <th className="py-2.5 px-3">Cabin</th>
                    <th className="py-2.5 px-3">Xe</th>
                    <th className="py-2.5 px-3">SĐT</th>
                    <th className="py-2.5 px-3">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D7] bg-white text-[#252B32]">
                  {filteredPassengers.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F7F4ED]/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#252B32]">
                        {p.passengerName}
                        {p.specialRequirements && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            {p.specialRequirements}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#102A43] font-semibold">{p.cabinNumber}</td>
                      <td className="py-2.5 px-3">{p.busNumber}</td>
                      <td className="py-2.5 px-3 text-[#687787]">{p.emergencyPhone}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md border ${
                            p.status === 'RETURNED_SAFE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'ON_TOUR'
                              ? 'bg-[#102A43]/10 text-[#102A43] border-[#102A43]/20'
                              : 'bg-[#F7F4ED] text-[#687787] border-[#E5E0D7]'
                          }`}
                        >
                          {p.status === 'RETURNED_SAFE'
                            ? 'Về Tàu An Toàn'
                            : p.status === 'ON_TOUR'
                            ? 'Đang Tour'
                            : 'Đã Lên Xe'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleTogglePassengerStatus(p.id)}
                          className="px-2 py-1 bg-white hover:bg-[#F7F4ED] text-[#252B32] border border-[#E5E0D7] rounded-md text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          Cập nhật
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Logistics & Partner Card */}
        <div className="space-y-6">
          {/* Partner & Logistics Info */}
          <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-semibold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E5E0D7] pb-2">
              <Building2 className="w-4 h-4 text-[#397C80]" /> Đối Tác & Điều Phối Phương Tiện
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#687787] block text-[10px] font-semibold uppercase">Đơn vị điều hành địa phương:</span>
                <span className="font-semibold text-[#252B32] text-sm">{excursion.operatorName}</span>
                {excursion.operatorContact && (
                  <span className="text-[11px] text-[#687787] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-[#397C80]" /> {excursion.operatorContact}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-[#E5E0D7]">
                <span className="text-[#687787] block text-[10px] font-semibold uppercase">Hướng dẫn viên phụ trách:</span>
                <span className="font-semibold text-[#102A43]">{excursion.guideName || 'Chưa gán'}</span>
                {excursion.guidePhone && (
                  <span className="text-[11px] text-[#687787] flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-[#687787]" /> {excursion.guidePhone}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-[#E5E0D7]">
                <span className="text-[#687787] block text-[10px] font-semibold uppercase">Phương tiện đưa đón:</span>
                <span className="font-semibold text-[#252B32] flex items-center gap-1 mt-0.5">
                  <Bus className="w-3.5 h-3.5 text-[#397C80]" /> {excursion.busNumber || 'Xe hợp đồng'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Capacity Stats */}
          <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-semibold text-[#102A43] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#E5E0D7] pb-2">
              <DollarSign className="w-4 h-4 text-[#397C80]" /> Chi Phí & Doanh Thu Dự Kiến
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#687787]">Hình thức tham gia:</span>
                {excursion.isIncluded ? (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                    Bao gồm trong vé
                  </span>
                ) : (
                  <span className="text-[#102A43] font-semibold bg-[#102A43]/10 border border-[#102A43]/20 rounded-md px-2 py-0.5">
                    Phụ thu dịch vụ
                  </span>
                )}
              </div>

              {!excursion.isIncluded && (
                <div className="flex items-center justify-between">
                  <span className="text-[#687787]">Đơn giá vé:</span>
                  <span className="font-semibold text-[#252B32] tabular-nums">
                    {excursion.price.toLocaleString('vi-VN')} {excursion.currency}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[#687787]">Số lượng đã đặt:</span>
                <span className="font-semibold text-[#252B32] tabular-nums">
                  {excursion.bookedCount} / {excursion.maxCapacity} khách
                </span>
              </div>

              {!excursion.isIncluded && (
                <div className="pt-2 border-t border-[#E5E0D7] flex items-center justify-between">
                  <span className="text-[#687787] font-semibold uppercase">Doanh thu dự kiến:</span>
                  <span className="font-bold text-[#102A43] text-base tabular-nums">
                    {(excursion.price * excursion.bookedCount).toLocaleString('vi-VN')} {excursion.currency}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <ExcursionModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            showToast('Đã lưu cập nhật tour trên bờ thành công!');
            void loadExcursion();
          }}
          excursionToEdit={excursion}
        />
      )}

      {/* Status Modal */}
      {isStatusModalOpen && (
        <ExcursionStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          onSuccess={() => {
            showToast('Đã cập nhật trạng thái tour!');
            void loadExcursion();
          }}
          excursion={excursion}
        />
      )}

      {/* Manifest Modal */}
      {isManifestModalOpen && excursion && (
        <ExcursionManifestModal
          isOpen={isManifestModalOpen}
          onClose={() => setIsManifestModalOpen(false)}
          excursion={{ ...excursion, passengers }}
          onUpdatePassengers={(updatedPassengers) => {
            setPassengers(updatedPassengers);
            setExcursion((prev) =>
              prev
                ? {
                    ...prev,
                    passengers: updatedPassengers,
                    bookedCount: updatedPassengers.length,
                  }
                : null
            );
          }}
        />
      )}
    </div>
  );
}
export default ExcursionDetailPage;
