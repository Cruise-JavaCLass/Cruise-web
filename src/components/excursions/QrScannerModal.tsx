import React, { useState } from 'react';
import {
  QrCode,
  X,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Radio,
} from 'lucide-react';
import type { ExcursionCheckInPayload, ExcursionCheckInResult } from '../../services/excursionService';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSubmit: (payload: ExcursionCheckInPayload) => Promise<ExcursionCheckInResult | null>;
  targetStatus: 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE';
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSubmit,
  targetStatus,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [codeType, setCodeType] = useState<'TICKET' | 'RFID' | 'CABIN'>('TICKET');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ExcursionCheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setErrorMsg('');
    setLastResult(null);
    setIsScanning(true);

    try {
      const payload: ExcursionCheckInPayload = {
        targetStatus,
      };

      if (codeType === 'TICKET') payload.ticketCode = manualCode.trim();
      else if (codeType === 'RFID') payload.rfidTag = manualCode.trim();
      else if (codeType === 'CABIN') payload.cabinNumber = manualCode.trim();

      const result = await onScanSubmit(payload);
      if (result) {
        setLastResult(result);
        setManualCode('');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Điểm danh không thành công');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#E5E0D7] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#397C80]/10 border border-[#397C80]/20 flex items-center justify-center text-[#397C80]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#102A43]">Quét Vé / Thẻ Điểm Danh</h2>
              <p className="text-xs text-[#252B32]/70">
                Chế độ: <strong className="text-[#102A43]">{targetStatus === 'RETURNED_SAFE' ? 'Về Tàu An Toàn' : targetStatus === 'CHECKED_IN' ? 'Tập Trung Xuất Bến' : 'Khởi Hành Tour'}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#252B32]/60 hover:text-[#102A43] rounded-lg hover:bg-slate-100 transition cursor-pointer" title="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated Camera Viewfinder */}
        <div className="p-6 text-center bg-[#0B1F33] relative flex flex-col items-center justify-center min-h-[220px]">
          <div className="w-48 h-48 border-2 border-dashed border-[#C5A572] rounded-2xl relative flex items-center justify-center bg-[#C5A572]/10">
            <QrCode className="w-24 h-24 text-[#C5A572]/60 animate-pulse" />
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#C5A572] -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#C5A572] translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#C5A572] -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#C5A572] translate-x-1 translate-y-1"></div>
          </div>
          <p className="text-xs text-[#F7F4ED]/80 mt-4">
            Đang tìm mã QR vé tour hoặc thẻ RFID qua camera...
          </p>
        </div>

        {/* Input fallback */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex rounded-xl bg-[#F7F4ED] p-1 border border-[#E5E0D7]">
            <button
              type="button"
              onClick={() => setCodeType('TICKET')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${codeType === 'TICKET' ? 'bg-white shadow-xs text-[#102A43]' : 'text-[#252B32]/60 hover:text-[#102A43]'}`}
            >
              <QrCode className="w-3.5 h-3.5" /> Vé Tour (QR)
            </button>
            <button
              type="button"
              onClick={() => setCodeType('RFID')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${codeType === 'RFID' ? 'bg-white shadow-xs text-[#102A43]' : 'text-[#252B32]/60 hover:text-[#102A43]'}`}
            >
              <Radio className="w-3.5 h-3.5" /> Thẻ RFID
            </button>
            <button
              type="button"
              onClick={() => setCodeType('CABIN')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${codeType === 'CABIN' ? 'bg-white shadow-xs text-[#102A43]' : 'text-[#252B32]/60 hover:text-[#102A43]'}`}
            >
              <Keyboard className="w-3.5 h-3.5" /> Số Cabin
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={codeType === 'TICKET' ? 'Nhập mã vé (VD: EXC-TKT-001)...' : codeType === 'RFID' ? 'Nhập mã thẻ RFID...' : 'Nhập số cabin (VD: 402)...'}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full px-4 py-2.5 text-xs bg-white border border-[#E5E0D7] rounded-xl text-[#102A43] placeholder-[#252B32]/40 focus:bg-white focus:outline-none focus:border-[#397C80] focus:ring-1 focus:ring-[#397C80]"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              {errorMsg}
            </div>
          )}

          {lastResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{lastResult.passengerName} (Cabin {lastResult.cabinNumber})</span>
              </div>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                {lastResult.currentStatus}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#252B32] hover:bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isScanning || !manualCode.trim()}
              className="px-5 py-2 text-xs font-semibold bg-[#102A43] hover:bg-[#0B1F33] disabled:opacity-50 text-white rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              {isScanning ? 'Đang xác thực...' : 'Xác nhận Điểm Danh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
