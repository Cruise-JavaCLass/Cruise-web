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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-blue-200" />
            <div>
              <h2 className="text-lg font-bold">Quét Vé / Thẻ Điểm Danh</h2>
              <p className="text-xs text-blue-100">
                Chế độ: <strong className="text-white">{targetStatus === 'RETURNED_SAFE' ? 'Về Tàu An Toàn' : targetStatus === 'CHECKED_IN' ? 'Tập Trung Xuất Bến' : 'Khởi Hành Tour'}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated Camera Viewfinder */}
        <div className="p-6 text-center bg-slate-900 relative flex flex-col items-center justify-center min-h-[220px]">
          <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-2xl relative flex items-center justify-center bg-emerald-500/10">
            <QrCode className="w-24 h-24 text-emerald-400/60 animate-pulse" />
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 translate-x-1 translate-y-1"></div>
          </div>
          <p className="text-xs text-slate-300 mt-4">
            Đang tìm mã QR vé tour hoặc thẻ RFID qua camera...
          </p>
        </div>

        {/* Input fallback */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setCodeType('TICKET')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${codeType === 'TICKET' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <QrCode className="w-3.5 h-3.5" /> Vé Tour (QR)
            </button>
            <button
              type="button"
              onClick={() => setCodeType('RFID')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${codeType === 'RFID' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Radio className="w-3.5 h-3.5" /> Thẻ RFID
            </button>
            <button
              type="button"
              onClick={() => setCodeType('CABIN')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${codeType === 'CABIN' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
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
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              {errorMsg}
            </div>
          )}

          {lastResult && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{lastResult.passengerName} (Cabin {lastResult.cabinNumber})</span>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {lastResult.currentStatus}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isScanning || !manualCode.trim()}
              className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition"
            >
              {isScanning ? 'Đang xác thực...' : 'Xác nhận Điểm Danh'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
