import React, { useState, useEffect } from 'react';
import { MobileBoardingPass } from '../../components/passenger/MobileBoardingPass';
import {
  embarkationService,
  type PassengerEmbarkationProfile,
} from '../../services/embarkationService';
import { resolvePassengerId } from '../../services/passengerIdentity';
import { RefreshCw, ArrowLeft, RotateCcw, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MaritimeLottie } from '../../components/common/MaritimeLottie';

export const BoardingPassPage: React.FC = () => {
  const [profile, setProfile] = useState<PassengerEmbarkationProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const passengerId = resolvePassengerId(1);
      if (!passengerId) {
        throw new Error('Không xác định được danh tính hành khách (Passenger ID is missing)');
      }
      // Lookup passenger boarding pass profile
      const data = await embarkationService.lookupPassenger(String(passengerId));
      if (!signal?.aborted) {
        setProfile(data);
      }
    } catch {
      if (!signal?.aborted) {
        setError('Không thể tải thông tin thẻ lên tàu. Vui lòng thử lại.');
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfile(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div
      className="min-h-screen bg-[#F7F4ED] text-[#252B32] p-4 md:p-8 flex flex-col justify-center items-center"
    >
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase text-[#102A43] bg-white border border-[#E5E0D7] rounded-xl hover:text-[#397C80] hover:border-[#397C80] shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang Chủ
        </Link>
        <button
          onClick={() => { void fetchProfile(); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase text-[#102A43] bg-white border border-[#E5E0D7] rounded-xl hover:text-[#397C80] hover:border-[#397C80] shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#397C80]" /> Làm mới
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <MaritimeLottie variant="radar" className="w-20 h-20 mb-4" />
          <p className="text-xs font-semibold uppercase tracking-widest text-[#102A43] animate-pulse">
            Đang tạo thẻ lên tàu kỹ thuật số...
          </p>
          <span className="text-[10px] text-[#252B32]/70 mt-1">HỆ THỐNG ĐANG ĐỒNG BỘ // MÃ HÓA RFID & QR</span>
        </div>
      )}

      {error && !loading && (
        <div className="max-w-md w-full p-6 sm:p-8 bg-white border border-amber-300 rounded-2xl shadow-sm text-center relative overflow-hidden">
          {/* Diagnostic Radar Graphic */}
          <MaritimeLottie variant="radar" className="w-24 h-24 mx-auto mb-4" title="Chẩn đoán Radar hàng hải" />

          {/* Technical Diagnostic Header */}
          <div className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-bold text-amber-900 tracking-wider uppercase mb-3">
            [LỖI ĐỒNG BỘ THẺ // TERMINAL NGOẠI TUYẾN]
          </div>

          <h3 className="text-base font-bold text-[#102A43] mb-2 font-display">
            Không Thể Đồng Bộ Thẻ Lên Tàu
          </h3>

          <p className="text-xs text-[#252B32]/70 mb-6 leading-relaxed">
            {error}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { void fetchProfile(); }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Thử lại
            </button>
            <Link
              to="/passenger-home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <Home className="w-4 h-4" /> Về Trang Chủ Khách
            </Link>
          </div>
        </div>
      )}

      {!loading && profile && (
        <MobileBoardingPass
          profile={profile}
          onHealthDeclared={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
};
