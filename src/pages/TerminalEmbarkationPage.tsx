import React, { useState, useEffect } from 'react';
import {
  Search,
  Radio,
  Camera,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  ShieldCheck,
  Ship,
  Sparkles,
  Download,
  Users,
  Activity,
  Zap,
} from 'lucide-react';
import {
  embarkationService,
  type PassengerEmbarkationProfile,
  type EmbarkationSummary,
} from '../services/embarkationService';

export const TerminalEmbarkationPage: React.FC = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [profile, setProfile] = useState<PassengerEmbarkationProfile | null>(null);
  const [summary, setSummary] = useState<EmbarkationSummary | null>(null);
  const [loadingLookup, setLoadingLookup] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // RFID Binding State
  const [rfidInput, setRfidInput] = useState<string>('');
  const [rfidStatusMsg, setRfidStatusMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Check-In Action State
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState<boolean>(false);
  const [checkInResultMsg, setCheckInResultMsg] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Camera & Device Sim State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [activeLane, setActiveLane] = useState<string>('GATE-LANE-01');

  const loadSummary = async () => {
    try {
      const data = await embarkationService.getEmbarkationSummary(1);
      setSummary(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setLoadingLookup(true);
    setLookupError(null);
    setCheckInResultMsg(null);
    setRfidStatusMsg(null);

    try {
      const result = await embarkationService.lookupPassenger(keyword.trim());
      setProfile(result);
      if (result.rfidTag) {
        setRfidInput(result.rfidTag);
      }
    } catch {
      setLookupError('Không tìm thấy hành khách với từ khóa đã nhập.');
      setProfile(null);
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleSimulateCameraScan = () => {
    setIsCameraActive(true);
    setTimeout(() => {
      setIsCameraActive(false);
      setKeyword('B9827361');
      void embarkationService.lookupPassenger('B9827361').then((res) => {
        setProfile(res);
        if (res.rfidTag) setRfidInput(res.rfidTag);
      });
    }, 800);
  };

  const handleBindRfid = async () => {
    if (!profile || !rfidInput.trim()) return;
    try {
      const res = await embarkationService.bindRfid(profile.id, {
        rfidTag: rfidInput.trim(),
        activateFolio: true,
      });
      setProfile({
        ...profile,
        rfidTag: res.rfidTag,
        folioStatus: res.folioStatus,
      });
      setRfidStatusMsg({ text: res.message, type: 'success' });
    } catch {
      setRfidStatusMsg({
        text: 'Lỗi gán thẻ RFID hoặc thẻ đã được gán cho người khác.',
        type: 'error',
      });
    }
  };

  const handleExecuteCheckIn = async () => {
    if (!profile) return;
    setIsProcessingCheckIn(true);
    setCheckInResultMsg(null);

    try {
      const res = await embarkationService.processCheckIn(profile.id, {
        staffId: 'STAFF-TERMINAL-01',
        terminalDeviceId: 'TERM-IPAD-PRO-4',
        gateLane: activeLane,
        rfidTag: rfidInput.trim() || profile.rfidTag,
        verificationMethod: 'TERMINAL_SCANNER',
      });

      setProfile({
        ...profile,
        checkInStatus: 'BOARDED',
        boardedAt: res.boardedAt,
        folioStatus: res.folioStatus,
        rfidTag: res.rfidTag,
      });
      setCheckInResultMsg({ text: res.message, type: 'success' });
      void loadSummary();
    } catch {
      setCheckInResultMsg({
        text: 'Hành khách đã làm thủ tục lên tàu trước đó.',
        type: 'error',
      });
    } finally {
      setIsProcessingCheckIn(false);
    }
  };

  const handleExportManifest = async () => {
    try {
      const blob = await embarkationService.exportBorderControlManifest(1);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `border_control_manifest_tour_1.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Port Gate Monitor */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                PORT TERMINAL EMBARKATION SYSTEM • LIVE
              </span>
            </div>
            <h1 className="text-2xl font-bold font-display text-white tracking-wide">
              Quầy Làm Thủ Tục Lên Tàu & Cấp Phát Thẻ RFID
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cổng quốc tế • Khung giờ đón khách: 08:00 - 12:00 • Kiểm soát Biên phòng & Hải quân
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportManifest}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl text-xs font-medium text-slate-200 transition shadow"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Xuất Manifest Biên Phòng (CSV)
            </button>
          </div>
        </div>

        {/* Real-time Headcount Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Tổng Dự Kiến</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">{summary.expectedTotal}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Đã Lên Tàu (Boarded)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-300 font-mono">
                {summary.boardedCount}{' '}
                <span className="text-xs font-normal text-emerald-400/80">
                  ({summary.boardingProgressPercent}%)
                </span>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Chưa Đến Cảng (Pending)</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-amber-300 font-mono">
                {summary.remainingCount}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Hội Viên VIP Đã Lên</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xl font-bold text-purple-300 font-mono">
                {summary.vipBoarded} / {summary.vipTotal}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Interaction Area: Lookup & Terminal Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Verification */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              Tra Cứu Hồ Sơ Hành Khách
            </h3>

            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Mã Đặt Chỗ (Booking) / Số Hộ Chiếu / Tên
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="VD: B9827361 hoặc BK-202688"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={loadingLookup}
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-medium text-white transition disabled:opacity-50"
                  >
                    {loadingLookup ? '...' : 'Tìm'}
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
            </form>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[11px] text-slate-400 mb-2">Hoặc quét nhanh qua thiết bị:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSimulateCameraScan}
                  className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  Quét Hộ Chiếu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('CRUISE-PASS-8899');
                    void handleLookup();
                  }}
                  className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Quét QR App
                </button>
              </div>

              {isCameraActive && (
                <div className="mt-3 p-3 bg-black/80 rounded-xl border border-cyan-500/40 text-center animate-pulse">
                  <Camera className="w-6 h-6 text-cyan-400 mx-auto mb-1 animate-bounce" />
                  <p className="text-[11px] text-cyan-300">Đang quét mã nhận dạng qua Camera...</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <label className="text-[11px] text-slate-400 block mb-1">Cửa / Làn Check-in Hiện Tại</label>
              <select
                value={activeLane}
                onChange={(e) => setActiveLane(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="GATE-LANE-01">Làn Thường 01 (Gate 01)</option>
                <option value="GATE-LANE-02">Làn Thường 02 (Gate 02)</option>
                <option value="VIP-PRIORITY-LANE">Làn Ưu Tiên VIP / Suite (Priority Lane)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Identity Verification, RFID Writer & Boarding Execution */}
        <div className="lg:col-span-2 space-y-4">
          {profile ? (
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Profile Header & VIP Routing */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{profile.fullName}</h2>
                    {profile.isVip && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ★ VIP ROYAL SUITE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Số Hộ Chiếu: <span className="font-mono text-slate-200">{profile.passportNumber}</span> • Quốc Tịch: {profile.nationality}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block">Số Phòng / Cabin</span>
                  <span className="text-lg font-bold font-mono text-cyan-300">{profile.cabinNumber}</span>
                </div>
              </div>

              {/* Status Checks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block">Khai Báo Y Tế</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {profile.healthDeclarationCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300">Đã khai báo</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-semibold text-rose-300">Chưa khai báo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block">Tài Khoản Folio</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-300">
                      {profile.folioStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block">Trạng Thái Lên Tàu</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {profile.checkInStatus === 'BOARDED' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-300">Đã lên tàu</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-300">Chờ boarding</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RFID Issuance & Hardware Writer Section */}
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Cấp Phát Thẻ Cruise Card / Vòng Tay RFID (NFC)
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">Đầu Đọc USB: SẴN SÀNG</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder="Chạm thẻ trắng vào đầu đọc RFID..."
                    className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleBindRfid}
                    className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-medium transition shadow flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gán Mã Thẻ
                  </button>
                </div>

                {rfidStatusMsg && (
                  <p
                    className={`text-xs ${
                      rfidStatusMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {rfidStatusMsg.text}
                  </p>
                )}
              </div>

              {/* Check-in / Boarding Transition CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExecuteCheckIn}
                  disabled={isProcessingCheckIn || profile.checkInStatus === 'BOARDED'}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Ship className="w-5 h-5" />
                  {profile.checkInStatus === 'BOARDED'
                    ? 'HÀNH KHÁCH ĐÃ LÀM THỦ TỤC LÊN TÀU'
                    : isProcessingCheckIn
                    ? 'Đang Xác Nhận Lên Tàu...'
                    : 'XÁC NHẬN BOARDING & KÍCH HOẠT HỒ SƠ'}
                </button>

                {checkInResultMsg && (
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      checkInResultMsg.type === 'success'
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {checkInResultMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{checkInResultMsg.text}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-dashed border-white/10 rounded-2xl p-12 text-center">
              <User className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-slate-300">Chưa Chọn Hồ Sơ Hành Khách</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Nhập số hộ chiếu hoặc mã đặt chỗ ở bảng bên trái hoặc chạm thẻ/quét QR để bắt đầu quy trình tiếp đón.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
