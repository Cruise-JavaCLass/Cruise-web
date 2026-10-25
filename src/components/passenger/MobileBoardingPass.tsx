import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldCheck,
  HeartPulse,
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  embarkationService,
  type PassengerEmbarkationProfile,
} from '../../services/embarkationService';

interface MobileBoardingPassProps {
  profile: PassengerEmbarkationProfile;
  onHealthDeclared?: (updatedProfile: PassengerEmbarkationProfile) => void;
}

export const MobileBoardingPass: React.FC<MobileBoardingPassProps> = ({
  profile,
  onHealthDeclared,
}) => {
  const [hasHealthSymptoms, setHasHealthSymptoms] = useState<boolean>(false);
  const [safetyBriefingRead, setSafetyBriefingRead] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsMedicalReview, setNeedsMedicalReview] = useState<boolean>(false);

  const isDeclared = Boolean(profile.healthDeclarationCompleted);

  const handleCompleteHealthDeclaration = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const updatedProfile = await embarkationService.submitHealthDeclaration(profile.id, {
        healthDeclarationCompleted: true,
        hasHealthSymptoms,
      });

      if (hasHealthSymptoms) {
        setNeedsMedicalReview(true);
        setSuccessToast(null);
      } else {
        setSuccessToast('Khai báo y tế & an toàn hàng hải thành công!');
        setNeedsMedicalReview(false);
      }

      if (onHealthDeclared) {
        onHealthDeclared({
          ...profile,
          ...updatedProfile,
          healthDeclarationCompleted: true,
        });
      }
    } catch {
      setErrorMessage('Không thể gửi khai báo y tế. Vui lòng thử lại hoặc liên hệ nhân viên y tế.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto border-4 border-[#171717] bg-[#F7F5F0] shadow-[8px_8px_0px_#171717] p-6 text-[#171717] font-sans dark:bg-slate-900 dark:text-white">
      {/* Boarding Pass Header */}
      <div className="flex items-center justify-between border-b-2 border-[#171717] pb-4 mb-5">
        <div>
          <span className="text-[10px] font-mono font-black tracking-widest text-[#3155E7] uppercase block dark:text-[#D9FF43]">
            BOARDING PASS // MARITIME TRANSIT
          </span>
          <h2 className="text-xl font-black uppercase text-[#171717] mt-0.5 dark:text-white">CRUISE EMBARKATION</h2>
        </div>
        {profile.isVip && (
          <span className="px-2.5 py-1 text-xs font-black uppercase border border-black bg-[#D9FF43] text-black shadow-[1px_1px_0px_#171717]">
            ★ VIP SUITE
          </span>
        )}
      </div>

      {/* Passenger Info & Cabin */}
      <div className="border-2 border-[#171717] bg-white p-4 shadow-[3px_3px_0px_#171717] mb-5 space-y-3 dark:bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#3155E7] dark:text-[#D9FF43]" />
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">Hành khách (Passenger)</p>
              <p className="text-base font-black text-black dark:text-white">{profile.fullName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase text-neutral-500">Số Cabin</p>
            <p className="text-base font-mono font-black text-[#3155E7] dark:text-[#D9FF43]">{profile.cabinNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#171717]/20 text-xs font-bold">
          <div>
            <span className="text-neutral-500 uppercase text-[10px] block">Mã Đặt chỗ:</span>{' '}
            <span className="font-mono text-black dark:text-white">{profile.bookingCode || 'BK-DEFAULT'}</span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase text-[10px] block">Hộ chiếu:</span>{' '}
            <span className="font-mono text-black dark:text-white">{profile.passportNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase text-[10px] block">Hạng phòng:</span>{' '}
            <span className="text-black dark:text-white">{profile.cabinCategory || 'Standard'}</span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase text-[10px] block">Quốc tịch:</span>{' '}
            <span className="text-black dark:text-white">{profile.nationality || 'Việt Nam'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic QR Code Area */}
      <div className="flex flex-col items-center justify-center p-5 border-2 border-[#171717] bg-white shadow-[4px_4px_0px_#171717] mb-5 dark:bg-white dark:text-black">
        <QRCodeSVG
          value={profile.qrCode || profile.bookingCode || 'PASSENGER'}
          size={160}
          className="w-40 h-40"
        />
        <p className="font-mono text-[11px] text-[#171717] font-black tracking-wider mt-3">
          {profile.qrCode || `QR-${profile.bookingCode || 'PASSENGER'}`}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mt-0.5">Xuất trình mã này tại quầy thủ tục cảng</p>
      </div>

      {/* RFID & Folio Status Badges */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 border-2 border-[#171717] bg-white shadow-[2px_2px_0px_#171717] flex items-center gap-2.5 dark:bg-slate-800">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <div>
            <p className="text-[10px] font-black uppercase text-neutral-500">Tài khoản Folio</p>
            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">
              {profile.folioStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
            </p>
          </div>
        </div>
        <div className="p-3 border-2 border-[#171717] bg-white shadow-[2px_2px_0px_#171717] flex items-center gap-2.5 dark:bg-slate-800">
          <ShieldCheck className="w-4 h-4 text-[#3155E7]" />
          <div>
            <p className="text-[10px] font-black uppercase text-neutral-500">Thẻ Cruise RFID</p>
            <p className="text-xs font-black text-[#3155E7] dark:text-blue-400">
              {profile.rfidTag ? 'Đã cấp phát' : 'Cấp tại quầy'}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-cruise Health & ID Declaration Section */}
      <div className="p-4 border-2 border-[#171717] bg-white shadow-[3px_3px_0px_#171717] dark:bg-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="w-5 h-5 text-rose-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#171717] dark:text-white">Khai Báo Y Tế & An Toàn Hàng Hải</h3>
        </div>

        {isDeclared ? (
          <div className="flex items-center gap-2.5 p-3 border border-black bg-emerald-100 text-black text-xs font-bold shadow-[1px_1px_0px_#171717]">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>Hồ sơ khai báo sức khỏe của bạn đã được xác nhận hợp lệ.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 text-xs font-bold text-neutral-700 cursor-pointer dark:text-neutral-300">
              <input
                type="checkbox"
                checked={hasHealthSymptoms}
                onChange={(e) => setHasHealthSymptoms(e.target.checked)}
                className="mt-0.5 rounded border-2 border-[#171717] text-[#3155E7] focus:ring-0"
              />
              <span>Tôi có triệu chứng sốt/ho/khó thở trong vòng 48 giờ qua.</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs font-bold text-neutral-700 cursor-pointer dark:text-neutral-300">
              <input
                type="checkbox"
                checked={safetyBriefingRead}
                onChange={(e) => setSafetyBriefingRead(e.target.checked)}
                className="mt-0.5 rounded border-2 border-[#171717] text-[#3155E7] focus:ring-0"
              />
              <span>Tôi đã đọc và cam kết tuân thủ quy định an toàn SOLAS quốc tế.</span>
            </label>

            <button
              onClick={handleCompleteHealthDeclaration}
              disabled={isSubmitting || !safetyBriefingRead}
              className="w-full py-2.5 px-4 border-2 border-[#171717] bg-[#3155E7] hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[2px_2px_0px_#171717] disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <FileCheck className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi xác nhận...' : 'Xác Nhận Khai Báo Sức Khỏe'}
            </button>
          </div>
        )}

        {successToast && (
          <p className="mt-2 text-center text-xs text-emerald-600 font-black">{successToast}</p>
        )}
        {needsMedicalReview && (
          <div className="mt-2 p-2.5 border-2 border-[#171717] bg-amber-200 text-black text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#171717]">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>Bạn đã ghi nhận có triệu chứng sức khỏe. Vui lòng di chuyển đến quầy Kiểm Tra Y Tế tại Cảng trước khi lên tàu.</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-2 p-2.5 border-2 border-[#171717] bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#171717]">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Boarding Status Banner */}
      <div className="mt-5 text-center">
        {profile.checkInStatus === 'BOARDED' ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border-2 border-[#171717] bg-[#D9FF43] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#171717]">
            <CheckCircle2 className="w-4 h-4" />
            Đã hoàn thành thủ tục lên tàu
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 border-2 border-[#171717] bg-amber-300 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#171717]">
            <AlertCircle className="w-4 h-4" />
            Chưa làm thủ tục lên tàu tại cổng
          </div>
        )}
      </div>
    </div>
  );
};
