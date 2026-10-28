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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div className="bg-white border-2 border-rose-600 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden text-[#252B32] flex flex-col">
        {/* Flashing Top Banner */}
        <div className="bg-rose-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-8 h-8 text-white animate-spin" />
            <div>
              <h2 id="solas-alarm-title" className="text-xl font-bold uppercase tracking-wider text-white">
                Báo Động Khẩn Cấp SOLAS Hàng Hải
              </h2>
              <p className="text-xs font-semibold text-rose-100 uppercase tracking-widest">
                {activeMuster.emergencyType} • TÍN HIỆU: 7 NGẮN 1 DÀI
              </p>
            </div>
          </div>
          <div className="p-2 bg-black/20 rounded-xl">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center">
            <p className="text-lg font-bold text-rose-900">
              "{activeMuster.announcementText}"
            </p>
            <p className="text-xs text-rose-700 mt-2 font-mono">
              Chỉ huy phát lệnh: {activeMuster.triggeredBy} • Mã sự cố: {activeMuster.incidentCode}
            </p>
          </div>

          {/* Passenger Evacuation Instructions */}
          <div className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#102A43] flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-amber-600" />
              Hướng Dẫn Khẩn Cấp Dành Cho Hành Khách:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-[#E5E0D7] shadow-2xs">
                <span className="text-xs text-[#252B32]/70 block font-semibold">Trạm Tập Trung Của Bạn:</span>
                <span className="text-lg font-extrabold text-[#102A43] mt-0.5 block flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-amber-600 shrink-0" />
                  {passengerMusterStation || 'Kiểm tra trạm tập trung trên thẻ phòng của bạn'}
                </span>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#E5E0D7] shadow-2xs">
                <span className="text-xs text-[#252B32]/70 block font-semibold">Xuồng Cứu Sinh (Lifeboat):</span>
                <span className="text-sm font-bold text-[#397C80] mt-1 block">
                  {assignedLifeboat || 'Theo hướng dẫn tại trạm tập trung'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E5E0D7] shadow-2xs">
              <span className="text-xs text-[#252B32]/70 block font-semibold">Trang Bị Bắt Buộc:</span>
              <span className="text-sm font-bold text-emerald-700 mt-1 block">
                Áo phao cứu sinh (Trong tủ cabin) + Thẻ tàu RFID
              </span>
            </div>

            <ol className="list-decimal list-inside text-xs text-[#252B32] space-y-1.5 pt-1 leading-relaxed">
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
              className="w-full py-4 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-bold text-base uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-rose-500/30"
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
