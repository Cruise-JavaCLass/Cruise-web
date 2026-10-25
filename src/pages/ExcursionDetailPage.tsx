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
            : INITIAL_EXCURSION_PASSENGERS
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#171717] space-y-4">
        <div className="w-12 h-12 bg-[#D9FF43] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#171717] animate-spin" />
        </div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider">Đang tải thông tin tour trên bờ...</span>
      </div>
    );
  }

  if (!excursion) {
    return (
      <div className="neo-card p-12 text-center space-y-4 bg-white max-w-lg mx-auto mt-8">
        <div className="w-16 h-16 mx-auto mb-2 bg-[#E7E4DC] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex items-center justify-center">
          <Compass className="w-8 h-8 text-[#DC2626]" />
        </div>
        <h3 className="text-xl font-display font-black text-[#171717] uppercase">Không tìm thấy thông tin tour trên bờ</h3>
        <p className="text-xs font-mono text-[#171717]/70">Tour có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link
          to="/excursions"
          className="neo-btn neo-btn-secondary inline-flex items-center gap-2 mt-4"
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
        <div className="fixed top-20 right-6 z-50 bg-[#171717] border-2 border-[#D9FF43] text-white px-5 py-3 shadow-[4px_4px_0px_#171717] flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#D9FF43] shrink-0" />
          <span className="font-mono font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action bar — Editorial Broadside */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#171717]">
        <div className="flex items-center gap-3">
          <Link
            to="/excursions"
            className="w-10 h-10 bg-white hover:bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono font-bold text-[#171717]/60 uppercase">Tour Trên Bờ</span>
              <span className="text-[#171717]/40">/</span>
              <span className="font-mono text-[10px] font-black text-[#3155E7] uppercase">{excursion.code}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-[#171717] uppercase tracking-tight">{excursion.title}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsManifestModalOpen(true)}
            className="neo-btn neo-btn-acid py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Đoàn & Xe
          </button>
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="neo-btn neo-btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#3155E7]" /> Đổi Trạng Thái
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="neo-btn neo-btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" /> Chỉnh Sửa
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 bg-white hover:bg-[#DC2626] hover:text-white text-[#DC2626] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Xóa tour"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Alert Banner if DELAYED */}
      {excursion.status === 'DELAYED' && (
        <div className="p-4 bg-[#F7F5F0] border-2 border-[#DC2626] shadow-[4px_4px_0px_#DC2626] flex items-start gap-3 text-xs text-[#DC2626]">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-display font-black text-[#DC2626] uppercase text-sm">CẢNH BÁO: CHUYẾN TOUR ĐANG BỊ TRỄ GIỜ</h4>
            <p className="font-mono text-[#171717]">
              Lý do ghi nhận:{' '}
              <strong className="text-[#DC2626]">{excursion.delayReason || 'Xe trung chuyển bị kẹt do thời tiết mưa lớn cục bộ'}</strong>
            </p>
            <p className="text-[11px] font-mono text-[#171717]/70">
              Bộ phận hải trình và trưởng tàu đã nhận được cảnh báo để điều phối phao tiêu cập cảng an toàn.
            </p>
          </div>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info & Operational Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card — Neo-Brutalist White Block */}
          <div className="neo-card bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#171717] pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="neo-badge bg-[#171717] text-white">
                  {statusConfig.label}
                </span>
                <span className="neo-badge bg-[#E7E4DC] text-[#171717]">
                  {EXCURSION_CATEGORY_LABELS[excursion.category]}
                </span>
                <span className="neo-badge bg-[#D9FF43] text-[#171717]">
                  Độ khó: {diffConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#171717]">
                <MapPin className="w-4 h-4 text-[#3155E7]" />
                <span>{excursion.portName} ({excursion.portCity})</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-mono font-bold text-[#171717]/70 uppercase tracking-wider">
                Mô tả chương trình tham quan
              </h4>
              <p className="text-xs sm:text-sm font-sans text-[#171717]/80 leading-relaxed">
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
          <div className="neo-card bg-white p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#171717]">
              <div>
                <h3 className="text-base font-display font-black text-[#171717] uppercase flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#3155E7]" /> Danh Sách Hành Khách Đi Theo Đoàn
                </h3>
                <p className="text-xs font-mono text-[#171717]/70 mt-0.5">
                  Đã về tàu an toàn: <strong className="text-[#3155E7]">{returnedSafeCount}</strong> / {passengers.length} hành khách
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#171717]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Lọc tên, cabin..."
                  value={passengerSearch}
                  onChange={(e) => setPassengerSearch(e.target.value)}
                  className="neo-input w-full pl-8 py-1.5 text-xs bg-[#F7F5F0]"
                />
              </div>
            </div>

            <div className="overflow-x-auto border-2 border-[#171717]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#E7E4DC] text-[#171717] uppercase font-bold text-[10px] border-b-2 border-[#171717]">
                  <tr>
                    <th className="py-2.5 px-3">Hành Khách</th>
                    <th className="py-2.5 px-3">Cabin</th>
                    <th className="py-2.5 px-3">Xe</th>
                    <th className="py-2.5 px-3">SĐT</th>
                    <th className="py-2.5 px-3">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#171717] bg-white text-[#171717]">
                  {filteredPassengers.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F7F5F0] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#171717]">
                        {p.passengerName}
                        {p.specialRequirements && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            {p.specialRequirements}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#3155E7] font-bold">{p.cabinNumber}</td>
                      <td className="py-2.5 px-3">{p.busNumber}</td>
                      <td className="py-2.5 px-3 text-[#171717]/70">{p.emergencyPhone}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] ${
                            p.status === 'RETURNED_SAFE'
                              ? 'bg-[#D9FF43] text-[#171717]'
                              : p.status === 'ON_TOUR'
                              ? 'bg-[#3155E7] text-white'
                              : 'bg-[#E7E4DC] text-[#171717]'
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
                          className="px-2 py-1 bg-white hover:bg-[#E7E4DC] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] text-[10px] font-mono font-bold uppercase active:translate-x-0.5 active:translate-y-0.5"
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
          <div className="neo-card bg-white p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5 border-b-2 border-[#171717] pb-2">
              <Building2 className="w-4 h-4 text-[#3155E7]" /> Đối Tác & Điều Phối Phương Tiện
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-[#171717]/60 block text-[10px] font-bold uppercase">Đơn vị điều hành địa phương:</span>
                <span className="font-bold text-[#171717] text-sm">{excursion.operatorName}</span>
                {excursion.operatorContact && (
                  <span className="text-[11px] text-[#171717]/70 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-[#3155E7]" /> {excursion.operatorContact}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-[#171717]/20">
                <span className="text-[#171717]/60 block text-[10px] font-bold uppercase">Hướng dẫn viên phụ trách:</span>
                <span className="font-bold text-[#3155E7]">{excursion.guideName || 'Chưa gán'}</span>
                {excursion.guidePhone && (
                  <span className="text-[11px] text-[#171717]/70 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-[#171717]/40" /> {excursion.guidePhone}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-[#171717]/20">
                <span className="text-[#171717]/60 block text-[10px] font-bold uppercase">Phương tiện đưa đón:</span>
                <span className="font-bold text-[#171717] flex items-center gap-1 mt-0.5">
                  <Bus className="w-3.5 h-3.5 text-[#3155E7]" /> {excursion.busNumber || 'Xe hợp đồng'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Capacity Stats */}
          <div className="neo-card bg-white p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold text-[#171717] uppercase tracking-wider flex items-center gap-1.5 border-b-2 border-[#171717] pb-2">
              <DollarSign className="w-4 h-4 text-[#3155E7]" /> Chi Phí & Doanh Thu Dự Kiến
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#171717]/70">Hình thức tham gia:</span>
                {excursion.isIncluded ? (
                  <span className="text-[#171717] font-bold bg-[#D9FF43] border border-[#171717] px-2 py-0.5">
                    Bao gồm trong vé
                  </span>
                ) : (
                  <span className="text-white font-bold bg-[#3155E7] border border-[#171717] px-2 py-0.5">
                    Phụ thu dịch vụ
                  </span>
                )}
              </div>

              {!excursion.isIncluded && (
                <div className="flex items-center justify-between">
                  <span className="text-[#171717]/70">Đơn giá vé:</span>
                  <span className="font-bold text-[#171717]">
                    {excursion.price.toLocaleString('vi-VN')} {excursion.currency}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[#171717]/70">Số lượng đã đặt:</span>
                <span className="font-bold text-[#171717]">
                  {excursion.bookedCount} / {excursion.maxCapacity} khách
                </span>
              </div>

              {!excursion.isIncluded && (
                <div className="pt-2 border-t-2 border-[#171717] flex items-center justify-between">
                  <span className="text-[#171717]/70 font-bold uppercase">Doanh thu dự kiến:</span>
                  <span className="font-display font-black text-[#171717] text-base">
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
