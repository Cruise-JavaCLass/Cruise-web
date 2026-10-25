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
    <div className="max-w-md mx-auto bg-[#151F33] border border-[#42E8F5]/30 rounded-2xl shadow-[0_10px_35px_rgba(7,11,22,0.8)] p-6 text-[#F4F4F0] font-sans relative overflow-hidden">
      {/* Decorative HUD Corner Accents */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#42E8F5]/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-[#4169FF]/10 to-transparent pointer-events-none" />

      {/* Boarding Pass Header */}
      <div className="flex items-center justify-between border-b border-[#42E8F5]/20 pb-4 mb-5">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#42E8F5] uppercase block">
            BOARDING PASS // MARITIME TRANSIT
          </span>
          <h2 className="text-xl font-black uppercase text-[#F4F4F0] mt-0.5 tracking-wide font-display">
            CRUISE EMBARKATION
          </h2>
        </div>
        {profile.isVip && (
          <span className="px-2.5 py-1 text-xs font-mono font-bold uppercase rounded bg-[#FFBD59]/20 text-[#FFBD59] border border-[#FFBD59]/40 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FFBD59]" /> ★ VIP SUITE
          </span>
        )}
      </div>

      {/* Passenger Info & Cabin */}
      <div className="bg-[#10182A] border border-[#42E8F5]/25 rounded-xl p-4 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#151F33] border border-[#42E8F5]/40 flex items-center justify-center text-[#42E8F5]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase text-[#A7B4C9]">Hành khách (Passenger)</p>
              <p className="text-base font-bold text-[#F4F4F0] leading-tight">{profile.fullName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono uppercase text-[#A7B4C9]">Số Cabin</p>
            <p className="text-base font-mono font-bold text-[#42E8F5]">{profile.cabinNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#42E8F5]/15 text-xs">
          <div>
            <span className="text-[#A7B4C9] uppercase text-[10px] font-mono block">Mã Đặt chỗ:</span>{' '}
            <span className="font-mono text-[#F4F4F0] font-semibold">{profile.bookingCode || 'BK-DEFAULT'}</span>
          </div>
          <div>
            <span className="text-[#A7B4C9] uppercase text-[10px] font-mono block">Hộ chiếu:</span>{' '}
            <span className="font-mono text-[#F4F4F0] font-semibold">{profile.passportNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#A7B4C9] uppercase text-[10px] font-mono block">Hạng phòng:</span>{' '}
            <span className="text-[#F4F4F0] font-semibold">{profile.cabinCategory || 'Standard'}</span>
          </div>
          <div>
            <span className="text-[#A7B4C9] uppercase text-[10px] font-mono block">Quốc tịch:</span>{' '}
            <span className="text-[#F4F4F0] font-semibold">{profile.nationality || 'Việt Nam'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic QR Code Area */}
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl mb-5 shadow-inner">
        <QRCodeSVG
          value={profile.qrCode || profile.bookingCode || 'PASSENGER'}
          size={160}
          className="w-40 h-40"
        />
        <p className="font-mono text-xs text-[#070B16] font-bold tracking-wider mt-3">
          {profile.qrCode || `QR-${profile.bookingCode || 'PASSENGER'}`}
        </p>
        <p className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-600 mt-0.5">
          Xuất trình mã này tại quầy thủ tục cảng
        </p>
      </div>

      {/* RFID & Folio Status Badges */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-[#10182A] border border-[#42E8F5]/20 rounded-xl flex items-center gap-2.5">
          <CreditCard className="w-4 h-4 text-[#42E8F5]" />
          <div>
            <p className="text-[10px] font-mono uppercase text-[#A7B4C9]">Tài khoản Folio</p>
            <p className="text-xs font-mono font-bold text-[#42E8F5]">
              {profile.folioStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
            </p>
          </div>
        </div>
        <div className="p-3 bg-[#10182A] border border-[#42E8F5]/20 rounded-xl flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#FFBD59]" />
          <div>
            <p className="text-[10px] font-mono uppercase text-[#A7B4C9]">Thẻ Cruise RFID</p>
            <p className="text-xs font-mono font-bold text-[#FFBD59]">
              {profile.rfidTag ? 'Đã cấp phát' : 'Cấp tại quầy'}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-cruise Health & ID Declaration Section */}
      <div className="p-4 bg-[#10182A] border border-[#42E8F5]/25 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="w-4 h-4 text-[#42E8F5]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F4F4F0]">
            Khai Báo Y Tế & An Toàn Hàng Hải
          </h3>
        </div>

        {isDeclared ? (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Hồ sơ khai báo sức khỏe của bạn đã được xác nhận hợp lệ.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 text-xs text-[#A7B4C9] cursor-pointer hover:text-[#F4F4F0] transition-colors">
              <input
                type="checkbox"
                checked={hasHealthSymptoms}
                onChange={(e) => setHasHealthSymptoms(e.target.checked)}
                className="mt-0.5 rounded border border-[#42E8F5]/40 bg-[#151F33] text-[#42E8F5] focus:ring-0"
              />
              <span>Tôi có triệu chứng sốt/ho/khó thở trong vòng 48 giờ qua.</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-[#A7B4C9] cursor-pointer hover:text-[#F4F4F0] transition-colors">
              <input
                type="checkbox"
                checked={safetyBriefingRead}
                onChange={(e) => setSafetyBriefingRead(e.target.checked)}
                className="mt-0.5 rounded border border-[#42E8F5]/40 bg-[#151F33] text-[#42E8F5] focus:ring-0"
              />
              <span>Tôi đã đọc và cam kết tuân thủ quy định an toàn SOLAS quốc tế.</span>
            </label>

            <button
              onClick={handleCompleteHealthDeclaration}
              disabled={isSubmitting || !safetyBriefingRead}
              className="w-full py-2.5 px-4 rounded-lg bg-[#4169FF] hover:bg-[#3458db] text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-[#4169FF]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi xác nhận...' : 'Xác Nhận Khai Báo Sức Khỏe'}
            </button>
          </div>
        )}

        {successToast && (
          <p className="mt-2 text-center text-xs text-emerald-400 font-medium">{successToast}</p>
        )}
        {needsMedicalReview && (
          <div className="mt-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-[#FFBD59] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FFBD59]" />
            <span>Bạn đã ghi nhận có triệu chứng sức khỏe. Vui lòng di chuyển đến quầy Kiểm Tra Y Tế tại Cảng trước khi lên tàu.</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-2 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Boarding Status Banner */}
      <div className="mt-5 text-center">
        {profile.checkInStatus === 'BOARDED' ? (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Đã hoàn thành thủ tục lên tàu
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FFBD59]/15 border border-[#FFBD59]/40 text-[#FFBD59] text-xs font-mono font-bold uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-[#FFBD59]" />
            Chưa làm thủ tục lên tàu tại cổng
          </div>
        )}
      </div>
    </div>
  );
};
