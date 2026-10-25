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

  const handleLookup = async (e?: React.FormEvent, keywordOverride?: string) => {
    if (e) e.preventDefault();
    const term = (keywordOverride !== undefined ? keywordOverride : keyword).trim();
    if (!term) return;

    setLoadingLookup(true);
    setLookupError(null);
    setCheckInResultMsg(null);
    setRfidStatusMsg(null);

    try {
      const result = await embarkationService.lookupPassenger(term);
      setProfile(result);
      setRfidInput(result.rfidTag || '');
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
        setRfidInput(res.rfidTag || '');
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
      {/* Top Banner / Port Gate Monitor — Editorial Neo-Brutalist Terminal Display */}
      <div className="neo-card bg-white p-6 shadow-[6px_6px_0px_#171717]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="neo-badge bg-[#D9FF43] text-[#171717]">LIVE GATE MONITOR</span>
              <span className="text-[10px] font-mono text-[#171717]/60 font-bold">
                • SOLAS PORT TERMINAL EMBARKATION
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-[#171717] uppercase tracking-tight">
              Quầy Làm Thủ Tục Lên Tàu & Cấp Phát Thẻ RFID
            </h1>
            <p className="text-xs font-mono text-[#171717]/70 mt-1">
              Cổng quốc tế • Khung giờ đón khách: 08:00 - 12:00 • Kiểm soát Biên phòng & Hải quân
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportManifest}
              className="neo-btn neo-btn-secondary py-2 px-3 text-xs inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#3155E7]" />
              Xuất Manifest Biên Phòng (CSV)
            </button>
          </div>
        </div>

        {/* Real-time Headcount Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t-2 border-[#171717]">
            <div className="p-3.5 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              <div className="flex items-center justify-between text-[#171717]/70 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Tổng Dự Kiến</span>
                <Users className="w-4 h-4 text-[#3155E7]" />
              </div>
              <p className="text-2xl font-display font-black text-[#171717]">{summary.expectedTotal}</p>
            </div>

            <div className="p-3.5 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              <div className="flex items-center justify-between text-[#171717]/70 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Đã Lên Tàu (Boarded)</span>
                <CheckCircle2 className="w-4 h-4 text-[#171717]" />
              </div>
              <p className="text-2xl font-display font-black text-[#171717]">
                {summary.boardedCount}{' '}
                <span className="text-xs font-mono font-bold text-[#3155E7]">
                  ({summary.boardingProgressPercent}%)
                </span>
              </p>
            </div>

            <div className="p-3.5 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              <div className="flex items-center justify-between text-[#171717]/70 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Chưa Đến Cảng (Pending)</span>
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-display font-black text-amber-600">
                {summary.remainingCount}
              </p>
            </div>

            <div className="p-3.5 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              <div className="flex items-center justify-between text-[#171717]/70 text-[10px] font-mono font-bold uppercase mb-1">
                <span>Hội Viên VIP Đã Lên</span>
                <Sparkles className="w-4 h-4 text-[#3155E7]" />
              </div>
              <p className="text-2xl font-display font-black text-[#3155E7]">
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
          <div className="neo-card bg-white p-5 shadow-[4px_4px_0px_#171717]">
            <h3 className="text-sm font-display font-black text-[#171717] uppercase mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#3155E7]" />
              Tra Cứu Hồ Sơ Hành Khách
            </h3>

            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label htmlFor="embarkation-keyword" className="text-[11px] font-mono font-bold text-[#171717] uppercase block mb-1">
                  Mã Đặt Chỗ (Booking) / Số Hộ Chiếu / Tên
                </label>
                <div className="relative">
                  <input
                    id="embarkation-keyword"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="VD: B9827361 hoặc BK-202688"
                    className="neo-input w-full pr-14 text-xs font-mono font-bold bg-[#F7F5F0]"
                  />
                  <button
                    type="submit"
                    disabled={loadingLookup}
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-[#3155E7] text-white text-xs font-mono font-bold border border-[#171717] hover:bg-[#3155E7]/90 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
                  >
                    {loadingLookup ? '...' : 'Tìm'}
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="flex items-center gap-2 p-2.5 bg-[#DC2626] border border-[#171717] text-white text-xs font-mono font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#D9FF43]" />
                  <span>{lookupError}</span>
                </div>
              )}
            </form>

            <div className="mt-4 pt-4 border-t-2 border-[#171717]">
              <p className="text-[11px] font-mono font-bold text-[#171717]/70 uppercase mb-2">Hoặc quét nhanh qua thiết bị:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSimulateCameraScan}
                  className="flex-1 py-2 px-3 bg-white hover:bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-xs font-mono font-bold text-[#171717] transition flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Camera className="w-3.5 h-3.5 text-[#3155E7]" />
                  Quét Hộ Chiếu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const scannedCode = 'CRUISE-PASS-8899';
                    setKeyword(scannedCode);
                    void handleLookup(undefined, scannedCode);
                  }}
                  className="flex-1 py-2 px-3 bg-[#D9FF43] hover:bg-[#D9FF43]/90 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-xs font-mono font-bold text-[#171717] transition flex items-center justify-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Zap className="w-3.5 h-3.5 text-[#171717]" />
                  Quét QR App
                </button>
              </div>

              {isCameraActive && (
                <div className="mt-3 p-3 bg-[#F7F5F0] border-2 border-[#3155E7] text-center">
                  <Camera className="w-6 h-6 text-[#3155E7] mx-auto mb-1 animate-bounce" />
                  <p className="text-[11px] font-mono font-bold text-[#3155E7]">Đang quét mã nhận dạng qua Camera...</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-[#171717]">
              <label htmlFor="embarkation-lane" className="text-[11px] font-mono font-bold text-[#171717] uppercase block mb-1">
                Cửa / Làn Check-in Hiện Tại
              </label>
              <select
                id="embarkation-lane"
                value={activeLane}
                onChange={(e) => setActiveLane(e.target.value)}
                className="neo-input w-full text-xs font-mono font-bold bg-[#F7F5F0]"
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
            <div className="neo-card bg-white p-6 shadow-[6px_6px_0px_#171717] space-y-6">
              {/* Profile Header & VIP Routing */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-[#171717] gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-display font-black text-[#171717] uppercase">{profile.fullName}</h2>
                    {profile.isVip && (
                      <span className="neo-badge bg-[#D9FF43] text-[#171717]">
                        ★ VIP ROYAL SUITE
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-[#171717]/70 mt-0.5">
                    Số Hộ Chiếu: <span className="font-bold text-[#171717]">{profile.passportNumber}</span> • Quốc Tịch: {profile.nationality}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase block">Số Phòng / Cabin</span>
                  <span className="text-xl font-display font-black text-[#3155E7]">{profile.cabinNumber}</span>
                </div>
              </div>

              {/* Status Checks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase block">Khai Báo Y Tế</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {profile.healthDeclarationCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#171717]" />
                        <span className="text-xs font-mono font-bold text-[#171717]">Đã khai báo</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                        <span className="text-xs font-mono font-bold text-[#DC2626]">Chưa khai báo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase block">Tài Khoản Folio</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CreditCard className="w-4 h-4 text-[#3155E7]" />
                    <span className="text-xs font-mono font-bold text-[#3155E7]">
                      {profile.folioStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7F5F0] border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
                  <span className="text-[10px] font-mono font-bold text-[#171717]/70 uppercase block">Trạng Thái Lên Tàu</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {profile.checkInStatus === 'BOARDED' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#171717]" />
                        <span className="text-xs font-mono font-bold text-[#171717]">Đã lên tàu</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-mono font-bold text-amber-600">Chờ boarding</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RFID Issuance & Hardware Writer Section */}
              <div className="p-4 bg-[#F7F5F0] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#3155E7]" />
                    <h4 className="text-xs font-mono font-black text-[#171717] uppercase tracking-wider">
                      Cấp Phát Thẻ Cruise Card / Vòng Tay RFID (NFC)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#3155E7]">Đầu Đọc USB: SẴN SÀNG</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder="Chạm thẻ trắng vào đầu đọc RFID..."
                    className="neo-input flex-1 text-xs font-mono font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleBindRfid}
                    className="neo-btn neo-btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gán Mã Thẻ
                  </button>
                </div>

                {rfidStatusMsg && (
                  <p
                    className={`text-xs font-mono font-bold ${
                      rfidStatusMsg.type === 'success' ? 'text-[#3155E7]' : 'text-[#DC2626]'
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
                  className={`w-full py-4 px-6 border-2 border-[#171717] shadow-[4px_4px_0px_#171717] font-display font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 ${
                    profile.checkInStatus === 'BOARDED'
                      ? 'bg-[#E7E4DC] text-[#171717]'
                      : 'bg-[#D9FF43] hover:bg-[#D9FF43]/90 text-[#171717]'
                  }`}
                >
                  <Ship className="w-5 h-5 text-[#171717]" />
                  {profile.checkInStatus === 'BOARDED'
                    ? 'HÀNH KHÁCH ĐÃ LÀM THỦ TỤC LÊN TÀU'
                    : isProcessingCheckIn
                    ? 'Đang Xác Nhận Lên Tàu...'
                    : 'XÁC NHẬN BOARDING & KÍCH HOẠT HỒ SƠ'}
                </button>

                {checkInResultMsg && (
                  <div
                    className={`mt-3 p-3 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] text-xs font-mono font-bold flex items-center gap-2 ${
                      checkInResultMsg.type === 'success'
                        ? 'bg-[#D9FF43] text-[#171717]'
                        : 'bg-[#DC2626] text-white'
                    }`}
                  >
                    {checkInResultMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#171717]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#D9FF43]" />
                    )}
                    <span>{checkInResultMsg.text}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="neo-card bg-white p-12 text-center border-dashed">
              <User className="w-12 h-12 text-[#171717]/40 mx-auto mb-3" />
              <h3 className="text-base font-display font-black text-[#171717] uppercase">Chưa Chọn Hồ Sơ Hành Khách</h3>
              <p className="text-xs font-mono text-[#171717]/70 mt-1 max-w-sm mx-auto">
                Nhập số hộ chiếu hoặc mã đặt chỗ ở bảng bên trái hoặc chạm thẻ/quét QR để bắt đầu quy trình tiếp đón.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TerminalEmbarkationPage;
