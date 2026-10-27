import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import type { RegisterPassengerPayload } from '../../services/passengerService';

export const generateRandomRfidTag = () => `RFID-${Math.floor(10000 + Math.random() * 90000)}`;

interface RegisterPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: number;
  onSuccess: (payload: RegisterPassengerPayload) => Promise<void>;
}

export const RegisterPassengerModal: React.FC<RegisterPassengerModalProps> = ({
  isOpen,
  onClose,
  tourId,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cabinNumber, setCabinNumber] = useState('');
  const [rfidTag, setRfidTag] = useState(() => generateRandomRfidTag());
  const [tourPackage, setTourPackage] = useState('Classic Cruise');
  const [bleZone, setBleZone] = useState('Zone A - Sky Lounge');
  const [registrationStatus, setRegistrationStatus] = useState<'CONFIRMED' | 'PENDING' | 'CANCELLED'>('CONFIRMED');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Họ và tên không được để trống';
    if (!cabinNumber.trim()) newErrors.cabinNumber = 'Số phòng cabin không được để trống';
    if (!tourPackage.trim()) newErrors.tourPackage = 'Vui lòng chọn gói tour';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const effectiveRfid = rfidTag.trim() || generateRandomRfidTag();
      await onSuccess({
        tourId,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        cabinNumber: cabinNumber.trim(),
        rfidTag: effectiveRfid,
        qrCode: `QR-${effectiveRfid}`,
        tourPackage: tourPackage.trim(),
        bleZone: bleZone.trim(),
        registrationStatus,
        checkInStatus: 'NOT_CHECKED_IN',
      });
      onClose();
    } catch {
      setErrors({ form: 'Đã có lỗi xảy ra khi lưu thông tin hành khách.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <h3 className="font-serif font-bold text-base text-[#102A43] flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#102A43]" /> Đăng Ký Hành Khách Mới
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng modal đăng ký"
            className="text-[#687787] hover:text-[#102A43] p-1.5 rounded-lg hover:bg-[#E5E0D7]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.form}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#252B32] mb-1">
              Họ và Tên <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              aria-label="Họ và tên hành khách"
              placeholder="VD: Trần Đình Trọng"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43]"
            />
            {errors.fullName && <p className="text-[11px] text-rose-600 mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1">Email</label>
              <input
                type="email"
                aria-label="Email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1">Số điện thoại</label>
              <input
                type="text"
                aria-label="Số điện thoại"
                placeholder="0912345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1">
                Số Cabin <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                aria-label="Số cabin"
                placeholder="VD: 502 (Ban công)"
                value={cabinNumber}
                onChange={(e) => setCabinNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43]"
              />
              {errors.cabinNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.cabinNumber}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#252B32]">
                  Mã Thẻ / RFID Tag
                </label>
                <button
                  type="button"
                  onClick={() => setRfidTag(generateRandomRfidTag())}
                  aria-label="Tạo mã ngẫu nhiên"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#397C80] hover:text-[#2b5e61] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tạo mã khác</span>
                </button>
              </div>
              <input
                type="text"
                aria-label="Mã thẻ RFID"
                placeholder="Tự động sinh mã nếu để trống"
                value={rfidTag}
                onChange={(e) => setRfidTag(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43] font-mono"
              />
              <p className="text-[10px] text-[#687787] mt-1">
                Mặc định hệ thống tự sinh ngẫu nhiên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1">Gói Tour</label>
              <select
                aria-label="Gói tour"
                value={tourPackage}
                onChange={(e) => setTourPackage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43]"
              >
                <option value="Classic Cruise">Classic Cruise</option>
                <option value="Premium Tour">Premium Tour</option>
                <option value="All-Inclusive VIP">All-Inclusive VIP</option>
                <option value="Deluxe Ocean">Deluxe Ocean</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#252B32] mb-1">Khu vực BLE định vị</label>
              <input
                type="text"
                aria-label="Khu vực BLE"
                placeholder="VD: Zone A - Sky Lounge"
                value={bleZone}
                onChange={(e) => setBleZone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#687787]/60 focus:outline-none focus:border-[#102A43]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252B32] mb-1">Trạng thái đăng ký</label>
            <select
              aria-label="Trạng thái đăng ký"
              value={registrationStatus}
              onChange={(e) => setRegistrationStatus(e.target.value as 'CONFIRMED' | 'PENDING' | 'CANCELLED')}
              className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:border-[#102A43]"
            >
              <option value="CONFIRMED">CONFIRMED (Đã xác nhận)</option>
              <option value="PENDING">PENDING (Chờ duyệt)</option>
              <option value="CANCELLED">CANCELLED (Đã hủy)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#E5E0D7] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#102A43] hover:bg-[#183B5B] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Hành Khách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
