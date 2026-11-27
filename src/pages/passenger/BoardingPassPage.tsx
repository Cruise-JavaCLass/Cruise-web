import React, { useState, useEffect } from 'react';
import { MobileBoardingPass } from '../../components/passenger/MobileBoardingPass';
import {
  embarkationService,
  type PassengerEmbarkationProfile,
} from '../../services/embarkationService';
import {
  getPassengerBookingSummary,
  INITIAL_PASSENGERS,
} from '../../services/passengerService';
import {
  ArrowLeft,
  Search,
  Ticket,
  ShieldCheck,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { MaritimeLottie } from '../../components/common/MaritimeLottie';

export const BoardingPassPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<PassengerEmbarkationProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Verification Form State
  const [lookupKeyword, setLookupKeyword] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const mapToProfile = (summary: any): PassengerEmbarkationProfile => ({
    id: summary.passengerId ?? summary.id,
    tourId: summary.tourId ?? 1,
    bookingCode: summary.tourCode ?? summary.bookingCode ?? `BK-${summary.passengerId ?? summary.id}026`,
    fullName: summary.fullName,
    passportNumber: summary.passportNumber ?? 'B' + (9827360 + (summary.passengerId ?? summary.id)),
    nationality: summary.nationality ?? 'Việt Nam',
    emergencyContact: summary.emergencyContact ?? '+84 912 345 678',
    email: summary.email,
    phoneNumber: summary.phoneNumber,
    cabinNumber: summary.cabinNumber,
    cabinCategory: summary.cabinCategory || 'Tiêu chuẩn',
    isVip: Boolean(
      summary.cabinCategory?.includes('VIP') ||
        summary.cabinCategory?.includes('Suite') ||
        summary.tourPackage?.includes('VIP') ||
        summary.isVip
    ),
    healthDeclarationCompleted: true,
    rfidTag: summary.rfidTag || `RFID-9941${summary.passengerId ?? summary.id}`,
    qrCode: summary.qrCode || `QR-9941${summary.passengerId ?? summary.id}`,
    tourPackage: summary.tourPackage,
    bleZone: summary.bleZone || 'Zone A',
    folioStatus: 'ACTIVE',
    checkInStatus: summary.checkInStatus === 'NOT_CHECKED_IN' ? 'NOT_CHECKED_IN' : 'BOARDED',
    boardedAt: summary.boardedAt,
  });

  const getAuthenticatedPassengerId = (): number | null => {
    try {
      const rawUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      if (!rawUser) return null;
      const user = JSON.parse(rawUser) as { role?: string; passengerId?: number; id?: number };
      if (user?.role === 'PASSENGER') {
        const parsedId = Number(user.passengerId ?? user.id);
        return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
      }
    } catch {
      // Ignore parse error
    }
    return null;
  };

  const loadPassengerById = async (id: number) => {
    const authPassengerId = getAuthenticatedPassengerId();
    const isCrossPassengerPreview = authPassengerId !== null && id !== authPassengerId;

    if (!isCrossPassengerPreview) {
      try {
        const summary = await getPassengerBookingSummary(id);
        if (summary) {
          setProfile(mapToProfile(summary));
          localStorage.setItem('currentPassenger', JSON.stringify({ id: summary.passengerId, ...summary }));
          return true;
        }
      } catch {
        // Fallback to local sample passengers
      }
    }

    const local = INITIAL_PASSENGERS.find((p) => p.id === id);
    if (local) {
      setProfile(mapToProfile(local));
      if (!isCrossPassengerPreview) {
        localStorage.setItem('currentPassenger', JSON.stringify(local));
      }
      return true;
    }
    return false;
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = lookupKeyword.trim().toLowerCase();
    if (!query) {
      setVerificationError('Vui lòng nhập Mã Đặt Chỗ, Số Phòng hoặc Họ Tên.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      // 1. Try finding in known passengers
      const match = INITIAL_PASSENGERS.find(
        (p) =>
          String(p.id) === query ||
          p.cabinNumber.toLowerCase().includes(query) ||
          p.fullName.toLowerCase().includes(query) ||
          (p.rfidTag && p.rfidTag.toLowerCase().includes(query)) ||
          (p.qrCode && p.qrCode.toLowerCase().includes(query)) ||
          (p.phoneNumber && p.phoneNumber.includes(query))
      );

      if (match) {
        await loadPassengerById(match.id);
      } else {
        // Try backend embarkation lookup
        const backendProfile = await embarkationService.lookupPassenger(query);
        if (backendProfile) {
          setProfile(backendProfile);
          localStorage.setItem('currentPassenger', JSON.stringify(backendProfile));
        } else {
          setVerificationError('Không tìm thấy thông tin đặt chỗ khớp với dữ liệu đã nhập. Vui lòng kiểm tra lại.');
        }
      }
    } catch {
      setVerificationError('Không tìm thấy thông tin đặt phòng hợp lệ. Vui lòng kiểm tra lại số phòng hoặc mã vé.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetSession = () => {
    setProfile(null);
    localStorage.removeItem('currentPassenger');
    sessionStorage.removeItem('currentPassenger');
    setLookupKeyword('');
    setVerificationError(null);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // Check if URL specifies passengerId or if session exists
      const queryId = searchParams.get('passengerId') || searchParams.get('id');
      if (queryId) {
        const parsed = Number(queryId);
        if (!Number.isNaN(parsed) && parsed > 0) {
          await loadPassengerById(parsed);
          setLoading(false);
          return;
        }
      }

      // Check stored passenger
      try {
        const stored = localStorage.getItem('currentPassenger') || sessionStorage.getItem('currentPassenger');
        if (stored) {
          const parsed = JSON.parse(stored);
          const candidateId = parsed?.id ?? parsed?.passengerId;
          if (candidateId) {
            await loadPassengerById(Number(candidateId));
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore parse error
      }

      setLoading(false);
    };

    void init();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#F7F4ED] text-[#252B32] p-4 md:p-8 flex flex-col justify-center items-center font-sans">
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase text-[#102A43] bg-white border border-[#E5E0D7] rounded-xl hover:text-[#397C80] hover:border-[#397C80] shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Về Cổng Khách Hàng
        </Link>
        <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-md bg-white text-[#102A43] border border-[#C5A572] flex items-center gap-1 shadow-xs">
          <ShieldCheck className="w-3 h-3 text-[#397C80]" /> Smart Pass • SOLAS
        </span>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <MaritimeLottie variant="radar" className="w-20 h-20 mb-4" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#102A43] animate-pulse">
            Đang tải thẻ lên tàu kỹ thuật số...
          </p>
          <span className="text-[10px] text-[#252B32]/70 mt-1">HỆ THỐNG ĐANG ĐỒNG BỘ // MÃ HÓA RFID & QR</span>
        </div>
      )}

      {/* Guest Boarding Pass Verification Portal (When not yet identified) */}
      {!loading && !profile && (
        <div className="max-w-md w-full p-6 sm:p-8 bg-white border border-[#E5E0D7] rounded-2xl shadow-xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#102A43] text-[#C5A572] border border-[#C5A572]/40 shadow-xs mb-3">
              <Ticket className="w-6 h-6 text-[#C5A572]" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#102A43] uppercase font-display">
              XÁC THỰC THẺ LÊN TÀU
            </h2>
            <p className="text-xs font-mono font-semibold text-[#C5A572] uppercase tracking-wider mt-1">
              GRAND PEARL VOYAGER • MOBILE BOARDING PASS
            </p>
            <p className="text-xs text-[#627D98] mt-2">
              Vui lòng nhập số phòng hoặc mã đặt chỗ để hiển thị thẻ lên tàu và mã QR an ninh của quý khách.
            </p>
          </div>

          {verificationError && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2.5 shadow-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{verificationError}</span>
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label htmlFor="lookup-input" className="block text-xs font-semibold uppercase tracking-wider text-[#102A43] mb-1.5">
                Số Phòng (Cabin) hoặc Mã Đặt Chỗ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#627D98]">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  id="lookup-input"
                  type="text"
                  value={lookupKeyword}
                  onChange={(e) => setLookupKeyword(e.target.value)}
                  placeholder="Ví dụ: 402 hoặc 718 hoặc Nguyễn Văn Minh"
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E0D7] bg-[#F7F4ED] rounded-xl text-xs font-medium text-[#252B32] placeholder-[#627D98]/70 shadow-xs transition-all focus:bg-white focus:border-[#C5A572] focus:ring-1 focus:ring-[#C5A572] focus:outline-none"
                  disabled={isVerifying}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 px-4 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              {isVerifying ? 'Đang xác thực...' : 'Tra Cứu & Tải Thẻ Lên Tàu'}
            </button>
          </form>

          {/* Quick Verified Cabins Suggestions */}
          <div className="mt-6 pt-5 border-t border-[#E5E0D7]">
            <p className="text-[11px] font-semibold text-[#102A43] mb-2 uppercase flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#C5A572]" />
              <span>Gợi ý phòng thử nghiệm nhanh:</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => { void loadPassengerById(1); }}
                className="p-2.5 text-[11px] rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] text-[#102A43] font-medium transition-all text-left shadow-xs cursor-pointer"
              >
                <div className="font-bold text-xs">Phòng 402 (Ban công)</div>
                <div className="text-[10px] text-[#627D98]">Nguyễn Văn Minh • VIP</div>
              </button>
              <button
                type="button"
                onClick={() => { void loadPassengerById(2); }}
                className="p-2.5 text-[11px] rounded-xl border border-[#E5E0D7] bg-[#F7F4ED] hover:bg-white hover:border-[#C5A572] text-[#102A43] font-medium transition-all text-left shadow-xs cursor-pointer"
              >
                <div className="font-bold text-xs">Phòng 718 (Suite)</div>
                <div className="text-[10px] text-[#627D98]">Trần Thị Thu Thảo • VIP</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render Official Luxury Boarding Pass */}
      {!loading && profile && (
        <div className="w-full max-w-md flex flex-col items-center">
          <MobileBoardingPass
            profile={profile}
            onHealthDeclared={(updated) => setProfile(updated)}
          />

          {/* Switch Passenger / Log out Boarding Pass */}
          <button
            type="button"
            onClick={handleResetSession}
            className="mt-6 text-xs font-semibold text-[#627D98] hover:text-[#102A43] underline decoration-[#C5A572] underline-offset-4 cursor-pointer transition-colors"
          >
            ← Tra cứu thẻ lên tàu của hành khách hoặc phòng khác
          </button>
        </div>
      )}
    </div>
  );
};

export default BoardingPassPage;
