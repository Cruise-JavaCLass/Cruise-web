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
      const passengerId = resolvePassengerId();
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
      data-theme="passenger-retro"
      className="min-h-screen bg-[#070B16] text-[#F4F4F0] p-4 md:p-8 flex flex-col justify-center items-center bg-[linear-gradient(to_right,rgba(66,232,245,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(66,232,245,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"
    >
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium uppercase text-[#A7B4C9] bg-[#151F33] border border-[#42E8F5]/30 rounded-lg hover:text-[#42E8F5] hover:border-[#42E8F5] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang Chủ
        </Link>
        <button
          onClick={() => { void fetchProfile(); }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-medium uppercase text-[#42E8F5] bg-[#151F33] border border-[#42E8F5]/40 rounded-lg hover:bg-[#10182A] transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <MaritimeLottie variant="radar" className="w-20 h-20 mb-4" />
          <p className="text-xs font-mono font-semibold uppercase tracking-widest text-[#42E8F5] animate-pulse">
            Đang tạo thẻ lên tàu kỹ thuật số...
          </p>
          <span className="text-[10px] font-mono text-[#A7B4C9] mt-1">TELEMETRY_SYNC // ENCRYPTING RFID & QR</span>
        </div>
      )}

      {error && !loading && (
        <div className="max-w-md w-full p-6 sm:p-8 bg-[#151F33] border border-[#FFBD59]/40 rounded-2xl shadow-[0_4px_30px_rgba(255,189,89,0.12)] text-center relative overflow-hidden">
          {/* Diagnostic Radar Graphic */}
          <MaritimeLottie variant="radar" className="w-28 h-28 mx-auto mb-4" title="Chẩn đoán Radar hàng hải" />

          {/* Technical Diagnostic Header */}
          <div className="inline-block px-3 py-1 bg-[#FFBD59]/15 border border-[#FFBD59]/40 rounded-full text-[10px] font-mono font-bold text-[#FFBD59] tracking-wider uppercase mb-3">
            [ERR_PASS_SYNC_04 // BOARDING_TERMINAL_OFFLINE]
          </div>

          <h3 className="text-base font-bold text-[#F4F4F0] mb-2 font-display">
            Không Thể Đồng Bộ Thẻ Lên Tàu
          </h3>

          <p className="text-xs text-[#A7B4C9] mb-6 leading-relaxed">
            {error}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => { void fetchProfile(); }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#FFBD59] hover:bg-[#ffa929] text-[#070B16] font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#FFBD59]/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Thử lại
            </button>
            <Link
              to="/passenger-home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#10182A] hover:bg-[#0c1221] text-[#42E8F5] border border-[#42E8F5]/30 font-mono font-semibold text-xs uppercase tracking-wider transition-all"
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
