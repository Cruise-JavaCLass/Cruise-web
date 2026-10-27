import { useState, useEffect } from 'react';
import {
  X,
  Compass,
  AlertTriangle,
  Clock,
  Building2,
  DollarSign,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  type ShoreExcursion,
  type ExcursionFormData,
  type ExcursionFormErrors,
  type ExcursionCategory,
  type ExcursionDifficulty,
  validateExcursionForm,
  createExcursion,
  updateExcursion,
  EXCURSION_CATEGORY_LABELS,
} from '../../services/excursionService';
import { getTours, INITIAL_TOURS, type CruiseTour } from '../../services/tourService';
import { getPorts, INITIAL_PORTS, type Port } from '../../services/portStopService';

interface ExcursionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  excursionToEdit?: ShoreExcursion | null;
  defaultTourId?: number;
}

const getDefaultFormData = (tourId: number): ExcursionFormData => ({
  tourId,
  portId: 1,
  title: '',
  code: '',
  description: '',
  category: 'SIGHTSEEING',
  difficulty: 'EASY',
  operatorName: '',
  operatorContact: '',
  guideName: '',
  guidePhone: '',
  busNumber: '',
  excursionDate: '2026-10-15',
  meetingTime: '08:30',
  departureTime: '09:00',
  returnToShipTime: '11:30',
  allAboardTime: '12:00',
  maxCapacity: 50,
  price: 0,
  currency: 'VND',
  isIncluded: true,
  status: 'SCHEDULED',
  imageUrl: '',
});

export function ExcursionModal({
  isOpen,
  onClose,
  onSuccess,
  excursionToEdit,
  defaultTourId = 1,
}: ExcursionModalProps) {
  const isEditMode = Boolean(excursionToEdit);

  const [tours, setTours] = useState<CruiseTour[]>(INITIAL_TOURS);
  const [ports, setPorts] = useState<Port[]>(INITIAL_PORTS);
  const [formData, setFormData] = useState<ExcursionFormData>(() =>
    getDefaultFormData(defaultTourId)
  );
  const [errors, setErrors] = useState<ExcursionFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      void Promise.all([getTours(), getPorts()]).then(([tourList, portList]) => {
        if (tourList.length > 0) {
          setTours(tourList);
          if (!excursionToEdit) {
            setFormData((prev) => ({
              ...prev,
              tourId: tourList.some((t) => t.id === prev.tourId) ? prev.tourId : tourList[0].id,
            }));
          }
        }
        if (portList.length > 0) {
          setPorts(portList);
          if (!excursionToEdit) {
            setFormData((prev) => ({
              ...prev,
              portId: portList.some((p) => p.id === prev.portId) ? prev.portId : portList[0].id,
            }));
          }
        }
      });
    }
  }, [isOpen, excursionToEdit]);

  useEffect(() => {
    if (excursionToEdit) {
      setFormData({
        tourId: excursionToEdit.tourId,
        portId: excursionToEdit.portId,
        title: excursionToEdit.title,
        code: excursionToEdit.code,
        description: excursionToEdit.description,
        category: excursionToEdit.category,
        difficulty: excursionToEdit.difficulty,
        operatorName: excursionToEdit.operatorName,
        operatorContact: excursionToEdit.operatorContact,
        guideName: excursionToEdit.guideName,
        guidePhone: excursionToEdit.guidePhone,
        busNumber: excursionToEdit.busNumber,
        excursionDate: excursionToEdit.excursionDate,
        meetingTime: excursionToEdit.meetingTime,
        departureTime: excursionToEdit.departureTime,
        returnToShipTime: excursionToEdit.returnToShipTime,
        allAboardTime: excursionToEdit.allAboardTime,
        maxCapacity: excursionToEdit.maxCapacity,
        price: excursionToEdit.price,
        currency: excursionToEdit.currency || 'VND',
        isIncluded: excursionToEdit.isIncluded,
        status: excursionToEdit.status,
        imageUrl: excursionToEdit.imageUrl || '',
      });
    } else {
      setFormData(getDefaultFormData(defaultTourId));
    }
    setErrors({});
    setApiError(null);
  }, [excursionToEdit, defaultTourId, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    field: keyof ExcursionFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setApiError(null);
  };

  const calculateReturnMargin = () => {
    if (!formData.returnToShipTime || !formData.allAboardTime) return null;
    const [retH, retM] = formData.returnToShipTime.split(':').map(Number);
    const [aboardH, aboardM] = formData.allAboardTime.split(':').map(Number);
    const diffMinutes = aboardH * 60 + aboardM - (retH * 60 + retM);
    return diffMinutes;
  };

  const marginMinutes = calculateReturnMargin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateExcursionForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setApiError(null);

    const selectedPort = ports.find((p) => p.id === Number(formData.portId));
    const portName = selectedPort?.name || 'Cảng Dừng Chân';
    const portCity = selectedPort?.city || 'Điểm Dừng';

    try {
      if (isEditMode && excursionToEdit) {
        await updateExcursion(excursionToEdit.id, formData, portName, portCity);
      } else {
        await createExcursion(formData, portName, portCity);
      }
      onSuccess();
      onClose();
    } catch {
      setApiError('Không thể lưu thông tin excursion. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excursion-modal-title"
    >
      <div className="bg-white border border-[#E5E0D7] w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden my-8 text-[#252B32]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#102A43]/10 border border-[#102A43]/15 flex items-center justify-center text-[#102A43] shadow-inner">
              <Compass className="w-5 h-5 text-[#397C80]" />
            </div>
            <div>
              <h3 id="excursion-modal-title" className="font-serif text-base font-bold text-[#102A43]">
                {isEditMode ? 'Chỉnh Sửa Tour Trên Bờ (Shore Excursion)' : 'Tạo Tour Trên Bờ Mới (Shore Excursion)'}
              </h3>
              <p className="text-xs text-[#252B32]/70">
                Điều phối nhà cung cấp • Giờ All-Aboard an toàn • Sức chứa đoàn khách
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#252B32]/60 hover:text-[#102A43] rounded-lg hover:bg-[#ECE7DC] transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-white">
          {apiError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Group 1: General Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5 border-b border-[#E5E0D7] pb-2">
              <Compass className="w-4 h-4 text-[#397C80]" /> 1. Thông Tin Chung & Địa Điểm Cập Cảng
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="excursion-tour-id" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Tour Du Thuyền <span className="text-rose-600">*</span>
                </label>
                <select
                  id="excursion-tour-id"
                  value={formData.tourId}
                  onChange={(e) => handleChange('tourId', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                >
                  {tours.length === 0 ? (
                    <option value={1}>Tour #1 (Mặc định)</option>
                  ) : (
                    tours.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))
                  )}
                </select>
                {errors.tourId && <p className="text-[11px] text-rose-600 mt-1">{errors.tourId}</p>}
              </div>

              <div>
                <label htmlFor="excursion-port-id" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Cảng Dừng Chân (Port of Call) <span className="text-rose-600">*</span>
                </label>
                <select
                  id="excursion-port-id"
                  value={formData.portId}
                  onChange={(e) => handleChange('portId', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                >
                  {ports.length === 0 ? (
                    <option value={1}>Cảng #1 (Mặc định)</option>
                  ) : (
                    ports.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.city} ({p.code})
                      </option>
                    ))
                  )}
                </select>
                {errors.portId && <p className="text-[11px] text-rose-600 mt-1">{errors.portId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="excursion-title" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Tên Tour Trên Bờ <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-title"
                  type="text"
                  placeholder="Ví dụ: Khám phá Hang Sửng Sốt & Đảo Ti Tốp"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 ${
                    errors.title ? 'border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43]'
                  }`}
                />
                {errors.title && <p className="text-[11px] text-rose-600 mt-1">{errors.title}</p>}
              </div>

              <div>
                <label htmlFor="excursion-code" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Mã Excursion <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-code"
                  type="text"
                  placeholder="EXC-HL-01"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-[#252B32] uppercase placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 ${
                    errors.code ? 'border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43]'
                  }`}
                />
                {errors.code && <p className="text-[11px] text-rose-600 mt-1">{errors.code}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="excursion-category" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Chủ Đề / Thể Loại
                </label>
                <select
                  id="excursion-category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value as ExcursionCategory)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                >
                  {Object.entries(EXCURSION_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                    <option key={catKey} value={catKey}>
                      {catLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="excursion-difficulty" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Mức Độ Vận Động
                </label>
                <select
                  id="excursion-difficulty"
                  value={formData.difficulty}
                  onChange={(e) => handleChange('difficulty', e.target.value as ExcursionDifficulty)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                >
                  <option value="EASY">Nhẹ nhàng (Phù hợp mọi lứa tuổi)</option>
                  <option value="MODERATE">Trung bình (Đi bộ nhiều, leo bậc thang)</option>
                  <option value="CHALLENGING">Thử thách (Leo núi, thể thao mạo hiểm)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="excursion-description" className="block text-xs font-semibold text-[#102A43] mb-1">
                Mô Tả Lịch Trình Tour
              </label>
              <textarea
                id="excursion-description"
                rows={2}
                placeholder="Tóm tắt điểm tham quan, lưu ý trang phục, bữa ăn đi kèm..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
              />
            </div>
          </div>

          {/* Group 2: Operational Timing & Ship Safety */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5 border-b border-[#E5E0D7] pb-2">
              <Clock className="w-4 h-4 text-[#397C80]" /> 2. Lịch Trình Giờ Giấc & Cảnh Báo An Toàn Quay Lại Tàu (All-Aboard)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label htmlFor="excursion-date" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Ngày Đi <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-date"
                  type="date"
                  value={formData.excursionDate}
                  onChange={(e) => handleChange('excursionDate', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                />
                {errors.excursionDate && <p className="text-[11px] text-rose-600 mt-1">{errors.excursionDate}</p>}
              </div>

              <div>
                <label htmlFor="excursion-meeting-time" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Giờ Tập Trung <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-meeting-time"
                  type="time"
                  value={formData.meetingTime}
                  onChange={(e) => handleChange('meetingTime', e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                />
                {errors.meetingTime && <p className="text-[11px] text-rose-600 mt-1">{errors.meetingTime}</p>}
              </div>

              <div>
                <label htmlFor="excursion-departure-time" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Giờ Xuất Bến <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-departure-time"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => handleChange('departureTime', e.target.value)}
                  className={`w-full px-2.5 py-2 bg-white border rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 ${
                    errors.departureTime ? 'border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43]'
                  }`}
                />
                {errors.departureTime && <p className="text-[11px] text-rose-600 mt-1">{errors.departureTime}</p>}
              </div>

              <div>
                <label htmlFor="excursion-return-time" className="block text-xs font-semibold text-amber-700 mb-1">
                  Về Lại Tàu <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-return-time"
                  type="time"
                  value={formData.returnToShipTime}
                  onChange={(e) => handleChange('returnToShipTime', e.target.value)}
                  className={`w-full px-2.5 py-2 bg-white border rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${
                    errors.returnToShipTime ? 'border-rose-500' : 'border-amber-400 focus:border-amber-600'
                  }`}
                />
                {errors.returnToShipTime && <p className="text-[11px] text-rose-600 mt-1">{errors.returnToShipTime}</p>}
              </div>

              <div>
                <label htmlFor="excursion-all-aboard-time" className="block text-xs font-semibold text-rose-700 mb-1">
                  All-Aboard <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-all-aboard-time"
                  type="time"
                  value={formData.allAboardTime}
                  onChange={(e) => handleChange('allAboardTime', e.target.value)}
                  className={`w-full px-2.5 py-2 bg-white border rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${
                    errors.allAboardTime ? 'border-rose-500' : 'border-rose-400 focus:border-rose-600'
                  }`}
                />
                {errors.allAboardTime && <p className="text-[11px] text-rose-600 mt-1">{errors.allAboardTime}</p>}
              </div>
            </div>

            {/* Time Safety Margin Indicator */}
            {marginMinutes !== null && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  marginMinutes < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : marginMinutes < 30
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {marginMinutes < 30 ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>
                    Khoảng đệm an toàn All-Aboard:{' '}
                    <strong>{marginMinutes >= 0 ? `${marginMinutes} phút` : `Trễ ${Math.abs(marginMinutes)} phút!`}</strong>
                  </span>
                </div>
                <span className="text-[11px] opacity-90 hidden sm:inline">
                  {marginMinutes >= 30
                    ? 'Đạt chuẩn an toàn hải hành (>= 30 phút)'
                    : marginMinutes >= 0
                    ? 'Cảnh báo: Khoảng cách ngắn dưới 30 phút nguy cơ trễ tàu'
                    : 'Nguy hiểm: Giờ về tàu muộn hơn giờ xuất bến'}
                </span>
              </div>
            )}
          </div>

          {/* Group 3: Operator & Transport */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5 border-b border-[#E5E0D7] pb-2">
              <Building2 className="w-4 h-4 text-[#397C80]" /> 3. Đối Tác Địa Phương & Điều Phối Phương Tiện
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="excursion-operator" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Nhà Cung Cấp Tour Địa Phương <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-operator"
                  type="text"
                  placeholder="Halong Heritage Travel Co."
                  value={formData.operatorName}
                  onChange={(e) => handleChange('operatorName', e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 ${
                    errors.operatorName ? 'border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43]'
                  }`}
                />
                {errors.operatorName && <p className="text-[11px] text-rose-600 mt-1">{errors.operatorName}</p>}
              </div>

              <div>
                <label htmlFor="excursion-operator-contact" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Hotline / Liên Hệ Khẩn Cấp
                </label>
                <input
                  id="excursion-operator-contact"
                  type="text"
                  placeholder="+84 203 384 6688"
                  value={formData.operatorContact}
                  onChange={(e) => handleChange('operatorContact', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="excursion-guide" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Hướng Dẫn Viên Phụ Trách
                </label>
                <input
                  id="excursion-guide"
                  type="text"
                  placeholder="Hoàng Hải Đăng"
                  value={formData.guideName}
                  onChange={(e) => handleChange('guideName', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                />
              </div>

              <div>
                <label htmlFor="excursion-guide-phone" className="block text-xs font-semibold text-[#102A43] mb-1">
                  SĐT Hướng Dẫn Viên
                </label>
                <input
                  id="excursion-guide-phone"
                  type="text"
                  placeholder="+84 912 888 999"
                  value={formData.guidePhone}
                  onChange={(e) => handleChange('guidePhone', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                />
              </div>

              <div>
                <label htmlFor="excursion-bus" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Phương Tiện Đưa Đón (Xe/Tàu)
                </label>
                <input
                  id="excursion-bus"
                  type="text"
                  placeholder="XE-VIP-01 (45 chỗ)"
                  value={formData.busNumber}
                  onChange={(e) => handleChange('busNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
                />
              </div>
            </div>
          </div>

          {/* Group 4: Capacity & Pricing */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#102A43] flex items-center gap-1.5 border-b border-[#E5E0D7] pb-2">
              <DollarSign className="w-4 h-4 text-[#397C80]" /> 4. Sức Chứa & Biểu Phí Tham Gia
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label htmlFor="excursion-capacity" className="block text-xs font-semibold text-[#102A43] mb-1">
                  Sức Chứa Tối Đa (Khách) <span className="text-rose-600">*</span>
                </label>
                <input
                  id="excursion-capacity"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.maxCapacity}
                  onChange={(e) => handleChange('maxCapacity', e.target.value ? Number(e.target.value) : '')}
                  className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 ${
                    errors.maxCapacity ? 'border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43]'
                  }`}
                />
                {errors.maxCapacity && <p className="text-[11px] text-rose-600 mt-1">{errors.maxCapacity}</p>}
              </div>

              <div className="pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isIncluded}
                    onChange={(e) => handleChange('isIncluded', e.target.checked)}
                    className="w-4 h-4 text-[#102A43] rounded border-[#E5E0D7] focus:ring-[#102A43]"
                  />
                  <span className="text-xs text-[#252B32] font-semibold">
                    Đã bao gồm trong giá vé Cruise (Miễn phí)
                  </span>
                </label>
              </div>

              {!formData.isIncluded && (
                <div>
                  <label htmlFor="excursion-price" className="block text-xs font-semibold text-[#102A43] mb-1">
                    Giá Vé Bổ Sung (VND) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="excursion-price"
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="850000"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value ? Number(e.target.value) : '')}
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 ${
                      errors.price ? 'border-rose-500' : 'border-[#E5E0D7] focus:border-[#102A43]'
                    }`}
                  />
                  {errors.price && <p className="text-[11px] text-rose-600 mt-1">{errors.price}</p>}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="excursion-image-url" className="block text-xs font-semibold text-[#102A43] mb-1">
                Link Ảnh Minh Họa (URL)
              </label>
              <input
                id="excursion-image-url"
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={formData.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/20 focus:border-[#102A43]"
              />
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="pt-4 border-t border-[#E5E0D7] flex items-center justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 bg-[#F7F4ED] hover:bg-[#ECE7DC] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#102A43] hover:bg-[#0B1F33] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Đang lưu...' : isEditMode ? 'Lưu Cập Nhật' : 'Tạo Excursion'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
