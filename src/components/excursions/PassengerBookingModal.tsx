import React, { useState, useId } from 'react';
import { Bus, Users, ShieldCheck, CreditCard, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import type { ShoreExcursion } from '../../services/excursionService';
import { bookExcursion } from '../../services/excursionService';

interface PassengerBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  excursion: ShoreExcursion | null;
  onBookingSuccess?: () => void;
}

export const PassengerBookingModal: React.FC<PassengerBookingModalProps> = ({
  isOpen,
  onClose,
  excursion,
  onBookingSuccess,
}) => {
  const [passengerName, setPassengerName] = useState('Trần Gia Huy');
  const [cabinNumber, setCabinNumber] = useState('Suite-801');
  const [passengerId] = useState(1);
  const [emergencyPhone, setEmergencyPhone] = useState('0987654321');
  const [selectedBus, setSelectedBus] = useState('XE-01 (45 Chỗ)');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [linkedCabins, setLinkedCabins] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<{ ticketCode: string; chargedAmount: number; busNumber: string } | null>(null);
  const passengerNameId = useId();
  const cabinNumberId = useId();
  const selectedBusId = useId();
  const linkedCabinsId = useId();
  const emergencyPhoneId = useId();
  const specialReqId = useId();

  const formatMoney = (amount: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  };


  if (!isOpen || !excursion) return null;

  const isIncluded = excursion.isIncluded;
  const price = isIncluded ? 0 : excursion.price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const linked = linkedCabins
        ? linkedCabins.split(',').map((c) => c.trim()).filter(Boolean)
        : undefined;

      const res = await bookExcursion(excursion.id, {
        passengerId,
        passengerName,
        cabinNumber,
        busNumber: selectedBus,
        groupName: `Nhóm ${selectedBus}`,
        emergencyPhone,
        specialRequirements: specialRequirements || undefined,
        linkedCabins: linked,
      });

      setSuccessTicket({
        ticketCode: res.ticketCode,
        chargedAmount: res.chargedAmount,
        busNumber: res.busNumber,
      });

      if (onBookingSuccess) onBookingSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đặt tour thất bại, vui lòng thử lại';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-fade-in" role="dialog" aria-modal="true">
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-lg p-6 shadow-xl relative text-[#252B32] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#687787] hover:text-[#102A43] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {successTicket ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#102A43]">Đặt Chỗ & Xuất Vé Thành Công!</h3>
            <p className="text-sm text-[#687787]">
              Mã vé điện tử đã được liên kết với thẻ phòng cabin của quý khách.
            </p>

            <div className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl p-4 text-left space-y-2 font-mono text-sm">
              <div className="flex justify-between border-b border-[#E5E0D7] pb-2">
                <span className="text-[#687787]">Mã vé điện tử:</span>
                <span className="text-[#102A43] font-bold">{successTicket.ticketCode}</span>
              </div>
              <div className="flex justify-between border-b border-[#E5E0D7] pb-2">
                <span className="text-[#687787]">Xe chỉ định:</span>
                <span className="text-[#102A43] font-bold">{successTicket.busNumber}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#687787]">Phí tính vào Folio:</span>
                <span className="text-emerald-700 font-bold">
                  {successTicket.chargedAmount === 0 ? 'MIỄN PHÍ (Included)' : formatMoney(successTicket.chargedAmount, excursion.currency)}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Hoàn Tất & Xem Vé Của Tôi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/40 mb-2">
                Shore Excursion Booking
              </span>
              <h3 className="text-xl font-serif font-bold text-[#102A43]">{excursion.title}</h3>
              <p className="text-xs text-[#687787] mt-1">
                Cảng: {excursion.portName} | Tập trung: {excursion.meetingTime} | Khởi hành: {excursion.departureTime}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={passengerNameId} className="block text-xs font-semibold text-[#252B32] mb-1">Tên hành khách</label>
                <input
                  id={passengerNameId}
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:border-[#102A43]"
                  required
                />
              </div>
              <div>
                <label htmlFor={cabinNumberId} className="block text-xs font-semibold text-[#252B32] mb-1">Số cabin</label>
                <input
                  id={cabinNumberId}
                  type="text"
                  value={cabinNumber}
                  onChange={(e) => setCabinNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:border-[#102A43]"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor={selectedBusId} className="block text-xs font-semibold text-[#252B32] mb-1">
                <span className="flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-[#102A43]" />
                  Chọn xe du lịch (Vehicle Seat Allocation)
                </span>
              </label>
              <select
                id={selectedBusId}
                value={selectedBus}
                onChange={(e) => setSelectedBus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:border-[#102A43]"
              >
                <option value="XE-01 (45 Chỗ)">Xe 01 (45 chỗ - Hướng dẫn Tiếng Việt/Anh)</option>
                <option value="XE-02 (29 Chỗ)">Xe 02 (29 chỗ - Khám phá ẩm thực)</option>
                <option value="XE-03 (45 Chỗ)">Xe 03 (45 chỗ - Gia đình & Trẻ em)</option>
                <option value="BUS-VIP-01 (16 Chỗ)">Xe VIP Limousine (16 chỗ)</option>
              </select>
            </div>

            <div>
              <label htmlFor={linkedCabinsId} className="block text-xs font-semibold text-[#252B32] mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#102A43]" />
                  Cabin gia đình liên kết (Group Cohabitation - ưu tiên cùng xe)
                </span>
              </label>
              <input
                id={linkedCabinsId}
                type="text"
                placeholder="Ví dụ: Suite-802, Balcony-614"
                value={linkedCabins}
                onChange={(e) => setLinkedCabins(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:border-[#102A43] placeholder:text-[#687787]/60"
              />
            </div>

            <div>
              <label htmlFor={emergencyPhoneId} className="block text-xs font-semibold text-[#252B32] mb-1">Số điện thoại liên hệ khẩn cấp</label>
              <input
                id={emergencyPhoneId}
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:border-[#102A43]"
                required
              />
            </div>

            <div>
              <label htmlFor={specialReqId} className="block text-xs font-semibold text-[#252B32] mb-1">Yêu cầu đặc biệt (Ăn kiêng / Ghế xe)</label>
              <input
                id={specialReqId}
                type="text"
                placeholder="Ghế gần cửa, ăn chay..."
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5E0D7] rounded-xl text-sm text-[#252B32] focus:outline-none focus:border-[#102A43] placeholder:text-[#687787]/60"
              />
            </div>

            {/* Price & Billing Box */}
            <div className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[#102A43]" />
                <div>
                  <div className="text-xs text-[#687787]">Hình thức thanh toán</div>
                  <div className="text-xs font-semibold text-[#252B32]">Ghi nợ Cabin Folio Account</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#687787]">Tổng thanh toán</div>
                <div className="text-base font-bold text-[#102A43]">
                  {isIncluded ? 'MIỄN PHÍ' : formatMoney(price, excursion.currency)}
                </div>
              </div>
            </div>

            {/* Port Cut-off Policy Notice */}
            <div className="flex items-start gap-2 text-[11px] text-[#687787] bg-white p-2.5 rounded-lg border border-[#E5E0D7]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Chính sách hủy tour: Miễn phí trước 24 giờ trước giờ tàu cập cảng. Hủy từ 12-24 giờ phạt 50%. Miễn phạt 100% trong trường hợp bất khả kháng do thời tiết.
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] font-semibold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl text-sm shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Đang Xử Lý...' : 'Xác Nhận Đặt Tour'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
