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
  Sparkles,
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
    <div className="max-w-md mx-auto bg-white border border-[#E5E0D7] rounded-2xl shadow-xl p-6 text-[#252B32] font-sans relative overflow-hidden">
      {/* Boarding Pass Header */}
      <div className="flex items-center justify-between border-b border-[#E5E0D7] pb-4 mb-5">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#397C80] uppercase block">
            BOARDING PASS // MARITIME TRANSIT
          </span>
          <h2 className="text-xl font-bold uppercase text-[#102A43] mt-0.5 tracking-wide">
            CRUISE EMBARKATION
          </h2>
        </div>
        {profile.isVip && (
          <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-lg bg-[#C5A572]/15 text-[#9E7A3E] border border-[#C5A572]/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C5A572]" /> ★ VIP SUITE
          </span>
        )}
      </div>

      {/* Passenger Info & Cabin */}
      <div className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl p-4 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white border border-[#E5E0D7] flex items-center justify-center text-[#102A43]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase text-[#5A6B7C]">Hành khách (Passenger)</p>
              <p className="text-base font-bold text-[#102A43] leading-tight">{profile.fullName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-[#5A6B7C]">Số Cabin</p>
            <p className="text-base font-mono font-bold text-[#102A43]">{profile.cabinNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#E5E0D7] text-xs">
          <div>
            <span className="text-[#5A6B7C] uppercase text-[10px] block">Mã Đặt chỗ:</span>{' '}
            <span className="font-mono text-[#102A43] font-semibold">{profile.bookingCode || 'BK-DEFAULT'}</span>
          </div>
          <div>
            <span className="text-[#5A6B7C] uppercase text-[10px] block">Hộ chiếu:</span>{' '}
            <span className="font-mono text-[#102A43] font-semibold">{profile.passportNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#5A6B7C] uppercase text-[10px] block">Hạng phòng:</span>{' '}
            <span className="text-[#102A43] font-semibold">{profile.cabinCategory || 'Standard'}</span>
          </div>
          <div>
            <span className="text-[#5A6B7C] uppercase text-[10px] block">Quốc tịch:</span>{' '}
            <span className="text-[#102A43] font-semibold">{profile.nationality || 'Việt Nam'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic QR Code Area */}
      <div className="flex flex-col items-center justify-center p-6 bg-white border border-[#E5E0D7] rounded-xl mb-5 shadow-inner">
        <QRCodeSVG
          value={profile.qrCode || profile.bookingCode || 'PASSENGER'}
          size={160}
          fgColor="#102A43"
          className="w-40 h-40"
        />
        <p className="font-mono text-xs text-[#102A43] font-bold tracking-wider mt-3">
          {profile.qrCode || `QR-${profile.bookingCode || 'PASSENGER'}`}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#5A6B7C] mt-0.5">
          Xuất trình mã này tại quầy thủ tục cảng
        </p>
      </div>

      {/* RFID & Folio Status Badges */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center gap-2.5">
          <CreditCard className="w-4 h-4 text-[#397C80]" />
          <div>
            <p className="text-[10px] uppercase text-[#5A6B7C]">Tài khoản Folio</p>
            <p className="text-xs font-bold text-[#397C80]">
              {profile.folioStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
            </p>
          </div>
        </div>
        <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#C5A572]" />
          <div>
            <p className="text-[10px] uppercase text-[#5A6B7C]">Thẻ Cruise RFID</p>
            <p className="text-xs font-bold text-[#9E7A3E]">
              {profile.rfidTag ? 'Đã cấp phát' : 'Cấp tại quầy'}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-cruise Health & ID Declaration Section */}
      <div className="p-4 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="w-4 h-4 text-[#397C80]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#102A43]">
            Khai Báo Y Tế & An Toàn Hàng Hải
          </h3>
        </div>

        {isDeclared ? (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#397C80]" />
            <span>Hồ sơ khai báo sức khỏe của bạn đã được xác nhận hợp lệ.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 text-xs text-[#5A6B7C] cursor-pointer hover:text-[#102A43] transition-colors">
              <input
                type="checkbox"
                checked={hasHealthSymptoms}
                onChange={(e) => setHasHealthSymptoms(e.target.checked)}
                className="mt-0.5 rounded border border-[#E5E0D7] text-[#397C80] focus:ring-0"
              />
              <span>Tôi có triệu chứng sốt/ho/khó thở trong vòng 48 giờ qua.</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-[#5A6B7C] cursor-pointer hover:text-[#102A43] transition-colors">
              <input
                type="checkbox"
                checked={safetyBriefingRead}
                onChange={(e) => setSafetyBriefingRead(e.target.checked)}
                className="mt-0.5 rounded border border-[#E5E0D7] text-[#397C80] focus:ring-0"
              />
              <span>Tôi đã đọc và cam kết tuân thủ quy định an toàn SOLAS quốc tế.</span>
            </label>

            <button
              onClick={handleCompleteHealthDeclaration}
              disabled={isSubmitting || !safetyBriefingRead}
              className="w-full py-2.5 px-4 rounded-xl bg-[#397C80] hover:bg-[#2D6468] text-white font-semibold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi xác nhận...' : 'Xác Nhận Khai Báo Sức Khỏe'}
            </button>
          </div>
        )}

        {successToast && (
          <p className="mt-2 text-center text-xs text-teal-800 font-medium">{successToast}</p>
        )}
        {needsMedicalReview && (
          <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
            <span>Bạn đã ghi nhận có triệu chứng sức khỏe. Vui lòng di chuyển đến quầy Kiểm Tra Y Tế tại Cảng trước khi lên tàu.</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Boarding Status Banner */}
      <div className="mt-5 text-center">
        {profile.checkInStatus === 'BOARDED' ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-300 text-teal-800 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-[#397C80]" />
            Đã hoàn thành thủ tục lên tàu
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            Chưa làm thủ tục lên tàu tại cổng
          </div>
        )}
      </div>
    </div>
  );
};
