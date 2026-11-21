import { useEffect, useState, useSyncExternalStore } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, QrCode, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';
import { QrScannerModal } from '../components/excursions/QrScannerModal';
import { fetchExcursions, getAttendanceSummary, checkInPassenger,
  type ShoreExcursion, type AttendanceSummary, type ExcursionCheckInPayload } from '../services/excursionService';
import { ExcursionAttendancePage } from './ExcursionAttendancePage';

const statusLabels = { REGISTERED: 'Chưa điểm danh', CHECKED_IN: 'Đã tập trung', ON_TOUR: 'Đang đi tour', RETURNED_SAFE: 'Đã về tàu' };
const scanModes = [ ['CHECKED_IN', 'Tập trung'], ['ON_TOUR', 'Lên xe'], ['RETURNED_SAFE', 'Về tàu'] ] as const;
const subscribeNetwork = (callback: () => void) => {
  window.addEventListener('online', callback); window.addEventListener('offline', callback);
  return () => { window.removeEventListener('online', callback); window.removeEventListener('offline', callback); };
};
const subscribeViewport = (callback: () => void) => {
  const query = window.matchMedia?.('(max-width: 767px)');
  query?.addEventListener('change', callback);
  return () => query?.removeEventListener('change', callback);
};

/** Preserve the desktop overview; phones go directly to the standalone crew view. */
export function ExcursionAttendanceEntry() {
  const { search } = useLocation();
  const handheld = useSyncExternalStore(subscribeViewport, () => window.matchMedia?.('(max-width: 767px)').matches ?? false, () => false);
  const forceDesktop = new URLSearchParams(search).get('view') === 'desktop';
  return handheld && !forceDesktop ? <Navigate to={`/excursion-attendance/mobile${search}`} replace /> : <ExcursionAttendancePage />;
}

export function ExcursionHandheldPage() {
  const { search } = useLocation();
  const [requestedId, setRequestedId] = useState(() => Number(new URLSearchParams(search).get('excursionId')) || null);
  const [mode, setMode] = useState<ExcursionCheckInPayload['targetStatus']>('CHECKED_IN');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [revision, setRevision] = useState(0);
  const online = useSyncExternalStore(subscribeNetwork, () => navigator.onLine, () => true);
  const [snapshot, setSnapshot] = useState<{
    key: string; excursions: ShoreExcursion[]; selectedId: number | null;
    summary: AttendanceSummary | null; error: string;
  }>({ key: '', excursions: [], selectedId: null, summary: null, error: '' });
  const requestKey = `${requestedId}:${revision}`;
  const { excursions, selectedId, summary, error } = snapshot;
  const loading = snapshot.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const items = await fetchExcursions(undefined, { allowMockFallback: false });
        if (cancelled) return;
        if (requestedId !== null && !items.some((item) => item.id === requestedId)) {
          throw new Error('Tour đã chọn không còn trong danh sách. Hãy về bảng điều phối để chọn lại.');
        }
        const id = items.find((item) => item.id === requestedId)?.id ?? items[0]?.id ?? null;
        const data = id === null ? null : await getAttendanceSummary(id);
        if (!cancelled) setSnapshot({ key: requestKey, excursions: items, selectedId: id, summary: data, error: '' });
      } catch (err) {
        if (!cancelled) setSnapshot((previous) => ({ ...previous, key: requestKey, summary: null,
          error: err instanceof Error ? err.message : 'Không tải được dữ liệu điểm danh.' }));
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [requestedId, requestKey]);

  useEffect(() => {
    const closeScanner = () => setScannerOpen(false);
    window.addEventListener('offline', closeScanner);
    return () => window.removeEventListener('offline', closeScanner);
  }, []);

  const selected = excursions.find((item) => item.id === selectedId);
  const passengers = (selected?.passengers ?? []).filter((passenger) => {
    const matches = `${passenger.passengerName} ${passenger.cabinNumber} ${passenger.ticketCode} ${passenger.busNumber}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    return matches && (!missingOnly || passenger.status !== 'RETURNED_SAFE');
  });
  const scan = async (payload: ExcursionCheckInPayload) => {
    if (selectedId === null || !navigator.onLine) throw new Error('Đang mất mạng. Chưa gửi điểm danh; hãy kết nối lại rồi thử.');
    const response = await checkInPassenger(selectedId, payload);
    // A successful write stays successful even when a later summary refresh fails.
    setRevision((value) => value + 1);
    return response;
  };

  return (
    <div className="min-h-dvh bg-[#F7F4ED] text-[#102A43] pb-32">
      <header className="sticky top-0 z-10 bg-[#102A43] text-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <Link to="/excursion-attendance?view=desktop" aria-label="Về bảng điều phối" className="min-w-12 min-h-12 flex items-center justify-center rounded-xl border border-white/25"><ArrowLeft size={20} /></Link>
          <div className="min-w-0 flex-1"><p className="text-xs text-[#D8C49E] tracking-widest uppercase">Tour bờ · Tại bến</p><h1 className="font-bold text-xl">Điểm danh cầm tay</h1></div>
          <ShieldCheck className="text-[#D8C49E] shrink-0" size={26} />
        </div>
      </header>
      <main className="max-w-xl mx-auto p-4 space-y-5">
        {!online && <p role="alert" className="flex items-center gap-2 rounded-xl bg-amber-100 p-4 text-amber-950"><WifiOff size={22} />Mất kết nối. Điểm danh tạm dừng cho đến khi có mạng.</p>}
        {error && <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800"><p>{error}</p><button onClick={() => setRevision((value) => value + 1)} disabled={!online || scannerOpen} className="min-h-12 underline font-semibold disabled:opacity-50">Thử tải lại</button></div>}
        <section className="rounded-2xl bg-white border border-[#E5E0D7] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3"><label htmlFor="handheld-excursion" className="text-sm font-bold">Tour đang điểm danh</label><button aria-label="Làm mới điểm danh" disabled={loading || !online || scannerOpen} onClick={() => setRevision((value) => value + 1)} className="min-h-12 min-w-12 border rounded-xl flex items-center justify-center disabled:opacity-50"><RefreshCw size={18} /></button></div>
          <select id="handheld-excursion" value={requestedId ?? selectedId ?? ''} disabled={!excursions.length || scannerOpen || loading} onChange={(event) => { setRequestedId(Number(event.target.value)); setQuery(''); setMissingOnly(false); }} className="min-h-14 w-full min-w-0 rounded-xl border border-[#E5E0D7] px-3 text-base font-semibold bg-[#F7F4ED]">
            {!excursions.length && <option value="">{loading ? 'Đang tải tour…' : 'Chưa có tour'}</option>}
            {excursions.map((item) => <option key={item.id} value={item.id}>{item.title} ({item.code})</option>)}
          </select>
          {selected && <div className="text-sm text-[#526777] flex flex-wrap justify-between gap-2"><span>{selected.portName} · {selected.excursionDate}</span><span>Hạn về tàu: <strong className="text-rose-700">{selected.allAboardTime || selected.returnToShipTime || 'Chưa cập nhật'}</strong></span></div>}
        </section>
        <fieldset disabled={scannerOpen} className="space-y-2"><legend className="font-bold text-sm mb-2">Bước điểm danh</legend><div className="grid grid-cols-3 gap-2">{scanModes.map(([value, label], index) => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-16 px-2 rounded-xl border text-sm font-semibold ${mode === value ? 'bg-[#102A43] text-white border-[#102A43]' : 'bg-white border-[#E5E0D7]'}`}><span className="block text-xs mb-1 opacity-70">0{index + 1}</span>{label}</button>)}</div></fieldset>
        <section aria-label="Tổng hợp điểm danh" className="grid grid-cols-2 gap-3">
          {([['Đăng ký', summary?.totalRegistered], ['Đã tập trung', summary?.totalCheckedIn], ['Đang đi tour', summary?.totalOnTour], ['Đã về tàu', summary?.totalReturnedSafe]] as const).map(([label, count]) => <div key={label} className="rounded-xl border border-[#E5E0D7] bg-white p-4"><p className="text-xs text-[#526777]">{label}</p><p className="text-3xl font-bold mt-1">{loading || count === undefined ? '—' : count}</p></div>)}
        </section>
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2"><h2 className="font-bold">Danh sách khách</h2><button aria-pressed={missingOnly} onClick={() => setMissingOnly((value) => !value)} className={`min-h-12 px-3 rounded-xl text-sm border ${missingOnly ? 'bg-rose-700 text-white' : 'bg-white text-rose-700 border-rose-200'}`}>Chưa về ({summary?.totalMissingReturn ?? '—'})</button></div>
          <input aria-label="Tìm khách hoặc xe" type="search" placeholder="Tìm tên, cabin, mã vé hoặc xe" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-14 w-full rounded-xl bg-white border border-[#E5E0D7] px-4 text-base" />
          {loading ? <p role="status">Đang tải dữ liệu điểm danh…</p> : passengers.length === 0 ? <p className="py-6 text-center text-[#526777]">Không có hành khách phù hợp.</p> : <ul className="space-y-3">{passengers.map((passenger) => <li key={passenger.id} className="rounded-xl border border-[#E5E0D7] bg-white p-4 space-y-2"><div className="flex items-start justify-between gap-2"><strong className="break-words min-w-0">{passenger.passengerName}</strong>{passenger.status === 'RETURNED_SAFE' && <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />}</div><p className="text-sm text-[#526777]">Cabin {passenger.cabinNumber} · {passenger.busNumber || 'Chưa phân xe'}</p><p className="text-xs break-all">{passenger.ticketCode}</p><p className={`text-sm font-semibold ${passenger.status === 'RETURNED_SAFE' ? 'text-emerald-700' : 'text-[#397C80]'}`}>{statusLabels[passenger.status]}</p></li>)}</ul>}
        </section>
      </main>
      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-[#E5E0D7] bg-white/95 backdrop-blur-sm px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-xl mx-auto"><button disabled={!online || loading || selectedId === null || Boolean(error)} onClick={() => setScannerOpen(true)} className="min-h-16 w-full rounded-2xl bg-[#102A43] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md disabled:opacity-50"><QrCode size={25} />Quét QR / Thẻ</button><p className="mt-2 text-xs text-center text-[#526777]">{scanModes.find(([value]) => value === mode)?.[1]} · Xác nhận từng khách từ máy chủ</p></div>
      </footer>
      <QrScannerModal key={selectedId} isOpen={scannerOpen && online} onClose={() => setScannerOpen(false)} onScanSubmit={scan} targetStatus={mode} />
    </div>
  );
}
