import React, { useState, useEffect } from 'react';
import { MobileBoardingPass } from '../../components/passenger/MobileBoardingPass';
import {
  embarkationService,
  type PassengerEmbarkationProfile,
} from '../../services/embarkationService';
import { resolvePassengerId } from '../../services/passengerIdentity';
import { RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-[#F7F5F0] text-[#171717] p-4 md:p-8 flex flex-col justify-center items-center dark:bg-slate-900 dark:text-white">
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 border-2 border-[#171717] bg-white px-3.5 py-1.5 text-xs font-black uppercase text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] transition active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang Chủ
        </Link>
        <button
          onClick={() => { void fetchProfile(); }}
          className="inline-flex items-center gap-1 border-2 border-[#171717] bg-white px-3.5 py-1.5 text-xs font-black uppercase text-black shadow-[2px_2px_0px_#171717] hover:bg-[#E7E4DC] transition active:translate-x-[1px] active:translate-y-[1px] dark:bg-slate-800 dark:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-[#3155E7] animate-spin mb-3" />
          <p className="text-sm font-bold uppercase tracking-wider text-neutral-500">Đang tạo thẻ lên tàu kỹ thuật số...</p>
        </div>
      )}

      {error && !loading && (
        <div className="max-w-md w-full p-4 border-2 border-[#171717] bg-rose-100 text-rose-800 shadow-[4px_4px_0px_#171717] flex items-center gap-3 font-bold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <p className="text-xs">{error}</p>
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
