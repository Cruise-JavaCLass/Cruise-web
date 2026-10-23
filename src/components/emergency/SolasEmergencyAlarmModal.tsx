import {
  AlertOctagon,
  LifeBuoy,
  MapPin,
  ShieldAlert,
  Volume2,
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { type SolasMusterIncident, solasMusterService } from '../../services/solasMusterService';

interface SolasEmergencyAlarmModalProps {
  passengerMusterStation?: string;
  assignedLifeboat?: string;
}

export const SolasEmergencyAlarmModal: React.FC<SolasEmergencyAlarmModalProps> = ({
  passengerMusterStation,
  assignedLifeboat,
}) => {
  const [activeMuster, setActiveMuster] = useState<SolasMusterIncident | null>(null);
  const [acknowledgedCode, setAcknowledgedCode] = useState<string | null>(null);

  const ackButtonRef = useRef<HTMLButtonElement>(null);
  const isVisible = !!activeMuster && acknowledgedCode !== activeMuster.incidentCode;

  const pollIdRef = useRef(0);

  useEffect(() => {
    const checkActiveMuster = async () => {
      const pollId = ++pollIdRef.current;
      try {
        const incident = await solasMusterService.getActiveMuster();
        if (pollId !== pollIdRef.current) return;
        if (incident && (incident.status === 'ACTIVE_MUSTER' || incident.status === 'DRILL_IN_PROGRESS')) {
          setActiveMuster(incident);
        } else {
          setActiveMuster(null);
          setAcknowledgedCode(null);
        }
      } catch {
        // quiet fallback
      }
    };

    void checkActiveMuster();
    const interval = setInterval(() => {
      void checkActiveMuster();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isVisible) {
      const previous = document.activeElement as HTMLElement | null;
      ackButtonRef.current?.focus();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          ackButtonRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (previous && typeof previous.focus === 'function') {
          previous.focus();
        }
      };
    }
  }, [isVisible]);

  if (!isVisible || !activeMuster) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="solas-alarm-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/90 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div className="bg-slate-900 border-4 border-red-600 rounded-3xl shadow-[0_0_80px_rgba(220,38,38,0.8)] w-full max-w-2xl overflow-hidden text-white flex flex-col animate-pulse">
        {/* Flashing Top Banner */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-8 h-8 text-white animate-spin" />
            <div>
              <h2 id="solas-alarm-title" className="text-xl font-black uppercase tracking-wider">
                Báo Động Khẩn Cấp SOLAS Hàng Hải
              </h2>
              <p className="text-xs font-bold text-red-100 uppercase tracking-widest">
                {activeMuster.emergencyType} • TÍN HIỆU: 7 NGẮN 1 DÀI
              </p>
            </div>
          </div>
          <div className="p-2 bg-black/30 rounded-xl">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          <div className="bg-red-900/40 border border-red-700/60 rounded-2xl p-5 text-center">
            <p className="text-lg font-bold text-red-200">
              "{activeMuster.announcementText}"
            </p>
            <p className="text-xs text-red-400 mt-2 font-mono">
              Chỉ huy phát lệnh: {activeMuster.triggeredBy} • Mã sự cố: {activeMuster.incidentCode}
            </p>
          </div>

          {/* Passenger Evacuation Instructions */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-400" />
              Hướng Dẫn Khẩn Cấp Dành Cho Hành Khách:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-400 block font-semibold">Trạm Tập Trung Của Bạn:</span>
                <span className="text-lg font-black text-amber-300 mt-0.5 block flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  {passengerMusterStation || 'Kiểm tra trạm tập trung trên thẻ phòng của bạn'}
                </span>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <span className="text-xs text-slate-400 block font-semibold">Xuồng Cứu Sinh (Lifeboat):</span>
                <span className="text-sm font-bold text-cyan-300 mt-1 block">
                  {assignedLifeboat || 'Theo hướng dẫn tại trạm tập trung'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 block font-semibold">Trang Bị Bắt Buộc:</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 block">
                Áo phao cứu sinh (Trong tủ cabin) + Thẻ tàu RFID
              </span>
            </div>

            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 pt-1 leading-relaxed">
              <li>Mặc ấm, mang theo áo phao cứu sinh và thuốc men cá nhân cần thiết.</li>
              <li>Tuyệt đối <strong>KHÔNG SỬ DỤNG THANG MÁY</strong>; chỉ di chuyển theo cầu thang bộ thoát hiểm.</li>
              <li>Tuân thủ theo chỉ dẫn của thuyền viên trực chốt tại các boong.</li>
            </ol>
          </div>

          {/* Acknowledge Button */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              ref={ackButtonRef}
              onClick={() => setAcknowledgedCode(activeMuster.incidentCode)}
              className="w-full py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-6 h-6" />
              Tôi Đã Hiểu & Đang Di Chuyển Đến Trạm Tập Trung
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
