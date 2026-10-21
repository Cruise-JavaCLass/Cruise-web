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
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100 p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/passenger-home"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang Chủ
        </Link>
        <button
          onClick={() => fetchProfile()}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Đang tạo thẻ lên tàu kỹ thuật số...</p>
        </div>
      )}

      {error && !loading && (
        <div className="max-w-md w-full p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
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
