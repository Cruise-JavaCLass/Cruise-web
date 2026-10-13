import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Building2,
  Users,
  Bus,
  Phone,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
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
      <div className="flex items-center justify-center p-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mr-3" />
        <span>Đang tải thông tin tour trên bờ...</span>
      </div>
    );
  }

  if (!excursion) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <h3 className="text-base font-bold text-white">Không tìm thấy thông tin tour trên bờ</h3>
        <p className="text-xs text-slate-400">Tour có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link
          to="/excursions"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
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
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/excursions"
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tour Trên Bờ</span>
              <span className="text-slate-600">/</span>
              <span className="font-mono text-xs text-cyan-400">{excursion.code}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">{excursion.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Đổi Trạng Thái
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-400" /> Chỉnh Sửa
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
            title="Xóa tour"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Alert Banner if DELAYED */}
      {excursion.status === 'DELAYED' && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-300">CẢNH BÁO: CHUYẾN TOUR ĐANG BỊ TRỄ GIỜ</h4>
            <p>
              Lý do ghi nhận:{' '}
              <strong>{excursion.delayReason || 'Đang chờ hướng dẫn viên cập nhật tình trạng giao thông.'}</strong>
            </p>
            <p className="text-[11px] text-amber-400">
              Bộ phận hải trình và trưởng tàu đã nhận được cảnh báo để điều phối phao tiêu cập cảng an toàn.
            </p>
          </div>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Info & Operational Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.cls}`}>
                  {statusConfig.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-cyan-300 border border-cyan-500/30">
                  {EXCURSION_CATEGORY_LABELS[excursion.category]}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${diffConfig.color}`}>
                  Độ khó: {diffConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>{excursion.portName} ({excursion.portCity})</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mô tả chương trình tham quan
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {excursion.description || 'Chưa có thông tin mô tả chi tiết cho tour trên bờ này.'}
              </p>
            </div>

            {/* Operational Timing Strip */}
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Lịch Trình Thời Gian & Giờ Tàu Nhổ Neo
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">1. Tập Trung</span>
                  <strong className="text-sm text-white">{excursion.meetingTime}</strong>
                  <span className="text-[10px] text-slate-500 block">Sảnh đón</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">2. Khởi Hành</span>
                  <strong className="text-sm text-cyan-400">{excursion.departureTime}</strong>
                  <span className="text-[10px] text-slate-500 block">Rời bến cảng</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-amber-400 block uppercase">3. Về Tàu</span>
                  <strong className="text-sm text-amber-300">{excursion.returnToShipTime}</strong>
                  <span className="text-[10px] text-slate-500 block">Đón lên tàu</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-rose-400 block uppercase">4. All-Aboard</span>
                  <strong className="text-sm text-rose-300">{excursion.allAboardTime}</strong>
                  <span className="text-[10px] text-rose-500 block">Tàu nhổ neo</span>
                </div>
              </div>

              {/* Buffer Status */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                  marginMinutes < 30
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    Khoảng đệm an toàn hải hành: <strong>{marginMinutes} phút</strong>
                  </span>
                </div>
                <span className="text-[11px] opacity-80">
                  {marginMinutes >= 30 ? 'Chuẩn an toàn hàng hải quốc tế' : 'Cần giám sát liên tục'}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger Manifest Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" /> Danh Sách Hành Khách Đi Theo Đoàn
                </h3>
                <p className="text-xs text-slate-400">
                  Đã về tàu an toàn: {returnedSafeCount} / {passengers.length} hành khách
                </p>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Lọc tên, cabin..."
                  value={passengerSearch}
                  onChange={(e) => setPassengerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Hành Khách</th>
                    <th className="py-2.5 px-3">Cabin</th>
                    <th className="py-2.5 px-3">Xe</th>
                    <th className="py-2.5 px-3">SĐT</th>
                    <th className="py-2.5 px-3">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredPassengers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {p.passengerName}
                        {p.specialRequirements && (
                          <span className="block text-[10px] text-amber-400 font-normal">
                            {p.specialRequirements}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-400">{p.cabinNumber}</td>
                      <td className="py-2.5 px-3">{p.busNumber}</td>
                      <td className="py-2.5 px-3 text-slate-400">{p.emergencyPhone}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            p.status === 'RETURNED_SAFE'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : p.status === 'ON_TOUR'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              : 'bg-slate-500/10 text-slate-300 border-slate-500/20'
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
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-medium transition-colors"
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4" /> Đối Tác & Điều Phối Phương Tiện
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Đơn vị điều hành địa phương:</span>
                <span className="font-semibold text-white">{excursion.operatorName}</span>
                {excursion.operatorContact && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-cyan-400" /> {excursion.operatorContact}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block text-[11px]">Hướng dẫn viên phụ trách:</span>
                <span className="font-semibold text-cyan-300">{excursion.guideName || 'Chưa gán'}</span>
                {excursion.guidePhone && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-500" /> {excursion.guidePhone}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block text-[11px]">Phương tiện đưa đón:</span>
                <span className="font-semibold text-white flex items-center gap-1 mt-0.5">
                  <Bus className="w-3.5 h-3.5 text-cyan-400" /> {excursion.busNumber || 'Xe hợp đồng'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing & Capacity Stats */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <DollarSign className="w-4 h-4" /> Chi Phí & Doanh Thu Dự Kiến
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hình thức tham gia:</span>
                {excursion.isIncluded ? (
                  <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Bao gồm trong vé
                  </span>
                ) : (
                  <span className="text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded">
                    Phụ thu dịch vụ
                  </span>
                )}
              </div>

              {!excursion.isIncluded && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Đơn giá vé:</span>
                  <span className="font-bold text-white">
                    {excursion.price.toLocaleString('vi-VN')} {excursion.currency}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Số lượng đã đặt:</span>
                <span className="font-semibold text-white">
                  {excursion.bookedCount} / {excursion.maxCapacity} khách
                </span>
              </div>

              {!excursion.isIncluded && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Doanh thu dự kiến:</span>
                  <span className="font-bold text-emerald-400 text-sm">
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
    </div>
  );
}
