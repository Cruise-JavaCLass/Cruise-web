import React, { useState } from 'react';
import {
  QrCode,
  ShieldCheck,
  HeartPulse,
  CreditCard,
  User,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import type { PassengerEmbarkationProfile } from '../../services/embarkationService';

interface MobileBoardingPassProps {
  profile: PassengerEmbarkationProfile;
  onHealthDeclared?: (updatedProfile: PassengerEmbarkationProfile) => void;
}

export const MobileBoardingPass: React.FC<MobileBoardingPassProps> = ({
  profile,
  onHealthDeclared,
}) => {
  const [hasHealthSymptoms, setHasHealthSymptoms] = useState<boolean>(false);
  const [safetyBriefingRead, setSafetyBriefingRead] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isDeclared = Boolean(profile.healthDeclarationCompleted);

  const handleCompleteHealthDeclaration = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessToast('Khai báo y tế & an toàn hàng hải thành công!');
      if (onHealthDeclared) {
        onHealthDeclared({
          ...profile,
          healthDeclarationCompleted: true,
        });
      }
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-cyan-500/30 rounded-2xl shadow-2xl p-6 text-white font-sans">
      {/* Boarding Pass Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            BOARDING PASS & MARITIME TRANSIT
          </span>
          <h2 className="text-xl font-bold font-display text-white mt-0.5">CRUISE EMBARKATION</h2>
        </div>
        {profile.isVip && (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ★ VIP SUITE
          </span>
        )}
      </div>

      {/* Passenger Info & Cabin */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-xs text-slate-400 font-medium">Hành khách (Passenger)</p>
              <p className="text-base font-bold text-white">{profile.fullName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Số Cabin</p>
            <p className="text-base font-bold text-cyan-300">{profile.cabinNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
          <div>
            <span className="text-slate-400">Mã Đặt chỗ:</span>{' '}
            <span className="font-mono text-slate-200">{profile.bookingCode || 'BK-DEFAULT'}</span>
          </div>
          <div>
            <span className="text-slate-400">Hộ chiếu:</span>{' '}
            <span className="font-mono text-slate-200">{profile.passportNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400">Hạng phòng:</span>{' '}
            <span className="text-slate-200">{profile.cabinCategory || 'Standard'}</span>
          </div>
          <div>
            <span className="text-slate-400">Quốc tịch:</span>{' '}
            <span className="text-slate-200">{profile.nationality || 'Việt Nam'}</span>
          </div>
        </div>
      </div>

      {/* Dynamic QR Code Area */}
      <div className="flex flex-col items-center justify-center p-5 bg-white rounded-xl shadow-inner mb-5">
        <QrCode className="w-40 h-40 text-slate-900" />
        <p className="font-mono text-[11px] text-slate-700 font-semibold tracking-wider mt-2">
          {profile.qrCode || `QR-${profile.bookingCode || 'PASSENGER'}`}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">Xuất trình mã này tại quầy thủ tục cảng</p>
      </div>

      {/* RFID & Folio Status Badges */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2.5">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase">Tài khoản Folio</p>
            <p className="text-xs font-bold text-emerald-300">
              {profile.folioStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
            </p>
          </div>
        </div>
        <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase">Thẻ Cruise RFID</p>
            <p className="text-xs font-bold text-cyan-300">
              {profile.rfidTag ? 'Đã cấp phát' : 'Cấp tại quầy'}
            </p>
          </div>
        </div>
      </div>

      {/* Pre-cruise Health & ID Declaration Section */}
      <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-bold text-white">Khai Báo Y Tế & An Toàn Hàng Hải</h3>
        </div>

        {isDeclared ? (
          <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Hồ sơ khai báo sức khỏe của bạn đã được xác nhận hợp lệ.</span>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHealthSymptoms}
                onChange={(e) => setHasHealthSymptoms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Tôi có triệu chứng sốt/ho/khó thở trong vòng 48 giờ qua.</span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyBriefingRead}
                onChange={(e) => setSafetyBriefingRead(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
              />
              <span>Tôi đã đọc và cam kết tuân thủ quy định an toàn SOLAS quốc tế.</span>
            </label>

            <button
              onClick={handleCompleteHealthDeclaration}
              disabled={isSubmitting || !safetyBriefingRead}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <FileCheck className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi xác nhận...' : 'Xác Nhận Khai Báo Sức Khỏe'}
            </button>
          </div>
        )}

        {successToast && (
          <p className="mt-2 text-center text-xs text-emerald-400 font-medium">{successToast}</p>
        )}
      </div>

      {/* Boarding Status Banner */}
      <div className="mt-5 text-center">
        {profile.checkInStatus === 'BOARDED' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Đã hoàn thành thủ tục lên tàu
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
            <AlertCircle className="w-4 h-4" />
            Chưa làm thủ tục lên tàu tại cổng
          </div>
        )}
      </div>
    </div>
  );
};
