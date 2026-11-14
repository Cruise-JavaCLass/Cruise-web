import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Radio, X } from 'lucide-react';
import { startQrCamera, startNfcReader, supportsNfc, scannerError } from '../../services/excursionScanner';
import type { ExcursionCheckInPayload, ExcursionCheckInResult } from '../../services/excursionService';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSubmit: (payload: ExcursionCheckInPayload) => Promise<ExcursionCheckInResult | null>;
  targetStatus: 'CHECKED_IN' | 'ON_TOUR' | 'RETURNED_SAFE';
}

const statusLabels: Record<string, string> = { REGISTERED: 'Chưa điểm danh', CHECKED_IN: 'Đã tập trung', ON_TOUR: 'Đang đi tour', RETURNED_SAFE: 'Đã về tàu an toàn' };

export function QrScannerModal(props: QrScannerModalProps) {
  return props.isOpen ? <ScannerSession {...props} key={props.targetStatus} /> : null;
}

function ScannerSession({ onClose, onScanSubmit, targetStatus }: QrScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [codeType, setCodeType] = useState<'TICKET' | 'RFID' | 'CABIN'>('TICKET');
  const [mode, setMode] = useState<'manual' | 'camera' | 'nfc'>('manual');
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExcursionCheckInResult | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const alive = useRef(true);
  const resumeRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setActive(false);
  };
  useEffect(() => {
    alive.current = true;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    titleRef.current?.focus();
    const onHidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('offline', stop);
    return () => {
      alive.current = false;
      abortRef.current?.abort();
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('offline', stop);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const submit = async (code: string, type: typeof codeType) => {
    if (locked.current || !code.trim() || !alive.current) return;
    locked.current = true;
    stop(); // Stop before sending: repeated frames cannot submit the same passenger.
    setBusy(true); setError(''); setResult(null);
    try {
      const field = type === 'TICKET' ? 'ticketCode' : type === 'RFID' ? 'rfidTag' : 'cabinNumber';
      const response = await onScanSubmit({ targetStatus, [field]: code.trim() });
      if (!alive.current) return;
      if (!response) throw new Error('Chưa nhận được xác nhận điểm danh từ máy chủ.');
      setResult(response); setManualCode('');
    } catch (err) {
      if (alive.current) setError(scannerError(err));
    } finally {
      locked.current = false;
      if (alive.current) { setBusy(false); resumeRef.current?.focus(); }
    }
  };

  const start = async (nextMode: 'camera' | 'nfc') => {
    if (locked.current) return;
    stop(); setMode(nextMode); setError(''); setResult(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setActive(true);
    try {
      if (nextMode === 'camera' && videoRef.current) {
        await startQrCamera(videoRef.current, (code) => { if (!controller.signal.aborted) void submit(code, 'TICKET'); }, controller.signal);
      } else {
        await startNfcReader((code) => { if (!controller.signal.aborted) void submit(code, 'RFID'); }, (message) => {
          if (!controller.signal.aborted) setError(message);
        }, controller.signal);
      }
    } catch (err) {
      if (!controller.signal.aborted && alive.current) { stop(); setError(scannerError(err)); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0B1F33]/70 sm:p-4"
      role="dialog" aria-modal="true" aria-labelledby="excursion-scanner-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
        if (event.key === 'Tab') {
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)'));
          const first = items[0]; const last = items[items.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
            event.preventDefault(); last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <section className="max-h-[100dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white text-[#102A43] shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <header className="flex items-center justify-between border-b border-[#E5E0D7] p-4">
          <div><h2 ref={titleRef} tabIndex={-1} id="excursion-scanner-title" className="font-bold text-lg">Quét Vé / Thẻ Điểm Danh</h2>
            <p className="text-sm text-[#526777]">{targetStatus === 'RETURNED_SAFE' ? 'Về Tàu An Toàn' : targetStatus === 'ON_TOUR' ? 'Khởi Hành Tour' : 'Tập Trung Xuất Bến'}</p></div>
          <button onClick={onClose} aria-label="Đóng bộ quét" className="min-h-12 min-w-12 rounded-xl border border-[#E5E0D7] flex items-center justify-center"><X /></button>
        </header>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button ref={resumeRef} disabled={busy} onClick={() => void start('camera')} className="min-h-14 rounded-xl bg-[#102A43] text-white flex items-center justify-center gap-2 disabled:opacity-50"><Camera size={20} />{result ? 'Quét khách tiếp' : 'Mở camera QR'}</button>
            <button disabled={busy || !supportsNfc()} onClick={() => void start('nfc')} className="min-h-14 rounded-xl border border-[#102A43] flex items-center justify-center gap-2 disabled:opacity-50"><Radio size={20} />Chạm thẻ NFC</button>
          </div>
          <p className="text-xs text-[#526777]">NFC cần Android có Web NFC và thẻ NDEF tương thích. Thiết bị khác: dùng QR, đầu đọc ngoài hoặc nhập mã.</p>
          <div className={mode === 'camera' && active ? 'block' : 'hidden'}>
            <video ref={videoRef} muted playsInline autoPlay aria-label="Camera quét QR" className="w-full aspect-[4/3] rounded-xl bg-[#0B1F33] object-cover" />
          </div>
          {active && <div className="flex items-center justify-between gap-2 text-sm" role="status"><span>{mode === 'nfc' ? 'Đưa thẻ đến gần đầu đọc NFC…' : 'Đưa mã QR vào khung camera…'}</span><button onClick={stop} className="min-h-12 px-4 border rounded-xl">Dừng quét</button></div>}
          {busy && <p role="status">Đang xác thực với máy chủ…</p>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800 text-sm">{error}</p>}
          {result && <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800"><CheckCircle2 className="mb-2" /><strong>{result.passengerName} (Cabin {result.cabinNumber})</strong><p>{result.message}</p><p className="text-sm">{statusLabels[result.currentStatus] ?? 'Máy chủ đã xác nhận'}</p></div>}
          <form onSubmit={(event) => { event.preventDefault(); void submit(manualCode, codeType); }} className="space-y-3 border-t border-[#E5E0D7] pt-4">
            <label className="block text-sm font-semibold">Nhập mã / đầu đọc ngoài
              <select aria-label="Loại mã điểm danh" value={codeType} disabled={busy} onChange={(event) => { stop(); setCodeType(event.target.value as typeof codeType); setManualCode(''); }} className="mt-2 min-h-12 w-full rounded-xl border border-[#E5E0D7] px-3 text-base">
                <option value="TICKET">Vé Tour (QR)</option><option value="RFID">Thẻ RFID</option><option value="CABIN">Số Cabin</option>
              </select>
            </label>
            <input aria-label="Mã điểm danh" value={manualCode} onChange={(event) => setManualCode(event.target.value)} disabled={busy} autoComplete="off" enterKeyHint="go"
              placeholder={codeType === 'TICKET' ? 'Nhập mã vé (VD: EXC-TKT-001)...' : codeType === 'RFID' ? 'Nhập mã thẻ RFID...' : 'Nhập số cabin (VD: 402)...'}
              className="min-h-14 w-full rounded-xl border border-[#E5E0D7] px-4 text-base" />
            <button type="submit" disabled={busy || !manualCode.trim()} className="min-h-14 w-full rounded-xl bg-[#397C80] text-white font-semibold disabled:opacity-50">{busy ? 'Đang xác thực...' : 'Xác nhận Điểm Danh'}</button>
          </form>
        </div>
      </section>
    </div>
  );
}
