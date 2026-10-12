import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import type { RegisterPassengerPayload } from '../../services/passengerService';

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
  const [rfidTag, setRfidTag] = useState('');
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
    if (!rfidTag.trim()) newErrors.rfidTag = 'Mã thẻ RFID không được để trống';
    if (!tourPackage.trim()) newErrors.tourPackage = 'Vui lòng chọn gói tour';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      await onSuccess({
        tourId,
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        cabinNumber: cabinNumber.trim(),
        rfidTag: rfidTag.trim(),
        qrCode: `QR-${rfidTag.trim()}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-400" /> Đăng Ký Hành Khách Mới
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng modal đăng ký"
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errors.form && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Họ và Tên <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              aria-label="Họ và tên hành khách"
              placeholder="VD: Trần Đình Trọng"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {errors.fullName && <p className="text-[11px] text-rose-400 mt-1">{errors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                aria-label="Email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Số điện thoại</label>
              <input
                type="text"
                aria-label="Số điện thoại"
                placeholder="0912345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Số Cabin <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                aria-label="Số cabin"
                placeholder="VD: 502 (Ban công)"
                value={cabinNumber}
                onChange={(e) => setCabinNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {errors.cabinNumber && <p className="text-[11px] text-rose-400 mt-1">{errors.cabinNumber}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mã Thẻ / RFID Tag <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                aria-label="Mã thẻ RFID"
                placeholder="VD: RFID-99420"
                value={rfidTag}
                onChange={(e) => setRfidTag(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              {errors.rfidTag && <p className="text-[11px] text-rose-400 mt-1">{errors.rfidTag}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gói Tour</label>
              <select
                aria-label="Gói tour"
                value={tourPackage}
                onChange={(e) => setTourPackage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Classic Cruise">Classic Cruise</option>
                <option value="Premium Tour">Premium Tour</option>
                <option value="All-Inclusive VIP">All-Inclusive VIP</option>
                <option value="Deluxe Ocean">Deluxe Ocean</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Khu vực BLE định vị</label>
              <input
                type="text"
                aria-label="Khu vực BLE"
                placeholder="VD: Zone A - Sky Lounge"
                value={bleZone}
                onChange={(e) => setBleZone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Trạng thái đăng ký</label>
            <select
              aria-label="Trạng thái đăng ký"
              value={registrationStatus}
              onChange={(e) => setRegistrationStatus(e.target.value as 'CONFIRMED' | 'PENDING' | 'CANCELLED')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="CONFIRMED">CONFIRMED (Đã xác nhận)</option>
              <option value="PENDING">PENDING (Chờ duyệt)</option>
              <option value="CANCELLED">CANCELLED (Đã hủy)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Hành Khách'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
