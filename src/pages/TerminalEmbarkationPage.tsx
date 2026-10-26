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
      {/* Top Banner / Port Gate Monitor — Luxury Maritime Terminal Display */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/40 tracking-wider">
                LIVE GATE MONITOR
              </span>
              <span className="text-[11px] font-medium text-[#687787]">
                • SOLAS PORT TERMINAL EMBARKATION
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43] tracking-tight">
              Quầy Làm Thủ Tục Lên Tàu & Cấp Phát Thẻ RFID
            </h1>
            <p className="text-xs text-[#687787] mt-1">
              Cổng quốc tế • Khung giờ đón khách: 08:00 - 12:00 • Kiểm soát Biên phòng & Hải quân
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportManifest}
              className="py-2 px-3 text-xs font-semibold bg-white border border-[#E5E0D7] hover:bg-[#F7F4ED] text-[#102A43] rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#102A43]" />
              Xuất Manifest Biên Phòng (CSV)
            </button>
          </div>
        </div>

        {/* Real-time Headcount Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-[#E5E0D7]">
            <div className="p-3.5 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase mb-1">
                <span>Tổng Dự Kiến</span>
                <Users className="w-4 h-4 text-[#102A43]" />
              </div>
              <p className="text-2xl font-serif font-bold text-[#102A43]">{summary.expectedTotal}</p>
            </div>

            <div className="p-3.5 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase mb-1">
                <span>Đã Lên Tàu (Boarded)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-2xl font-serif font-bold text-emerald-700">
                {summary.boardedCount}{' '}
                <span className="text-xs font-medium text-[#102A43]">
                  ({summary.boardingProgressPercent}%)
                </span>
              </p>
            </div>

            <div className="p-3.5 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase mb-1">
                <span>Chưa Đến Cảng (Pending)</span>
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-serif font-bold text-amber-700">
                {summary.remainingCount}
              </p>
            </div>

            <div className="p-3.5 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl shadow-xs">
              <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase mb-1">
                <span>Hội Viên VIP Đã Lên</span>
                <Sparkles className="w-4 h-4 text-[#C5A572]" />
              </div>
              <p className="text-2xl font-serif font-bold text-[#102A43]">
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
          <div className="bg-white border border-[#E5E0D7] rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-serif font-bold text-[#102A43] uppercase mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#102A43]" />
              Tra Cứu Hồ Sơ Hành Khách
            </h3>

            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label htmlFor="embarkation-keyword" className="text-[11px] font-semibold text-[#252B32] uppercase block mb-1">
                  Mã Đặt Chỗ (Booking) / Số Hộ Chiếu / Tên
                </label>
                <div className="relative">
                  <input
                    id="embarkation-keyword"
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="VD: B9827361 hoặc BK-202688"
                    className="w-full pr-14 text-xs font-medium bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg p-2.5 text-[#252B32] focus:outline-none focus:border-[#102A43]"
                  />
                  <button
                    type="submit"
                    disabled={loadingLookup}
                    className="absolute right-1.5 top-1.5 px-3 py-1 bg-[#102A43] text-white text-xs font-semibold rounded-md hover:bg-[#183B5B] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loadingLookup ? '...' : 'Tìm'}
                  </button>
                </div>
              </div>

              {lookupError && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{lookupError}</span>
                </div>
              )}
            </form>

            <div className="mt-4 pt-4 border-t border-[#E5E0D7]">
              <p className="text-[11px] font-semibold text-[#687787] uppercase mb-2">Hoặc quét nhanh qua thiết bị:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSimulateCameraScan}
                  className="flex-1 py-2 px-3 bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg shadow-xs text-xs font-semibold text-[#102A43] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#102A43]" />
                  Quét Hộ Chiếu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const scannedCode = 'CRUISE-PASS-8899';
                    setKeyword(scannedCode);
                    void handleLookup(undefined, scannedCode);
                  }}
                  className="flex-1 py-2 px-3 bg-[#102A43] hover:bg-[#183B5B] text-white rounded-lg shadow-xs text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[#C5A572]" />
                  Quét QR App
                </button>
              </div>

              {isCameraActive && (
                <div className="mt-3 p-3 bg-[#F7F4ED] border border-[#102A43] rounded-lg text-center">
                  <Camera className="w-6 h-6 text-[#102A43] mx-auto mb-1 animate-bounce" />
                  <p className="text-[11px] font-medium text-[#102A43]">Đang quét mã nhận dạng qua Camera...</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E5E0D7]">
              <label htmlFor="embarkation-lane" className="text-[11px] font-semibold text-[#252B32] uppercase block mb-1">
                Cửa / Làn Check-in Hiện Tại
              </label>
              <select
                id="embarkation-lane"
                value={activeLane}
                onChange={(e) => setActiveLane(e.target.value)}
                className="w-full text-xs font-semibold bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg p-2.5 text-[#252B32] focus:outline-none focus:border-[#102A43]"
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
            <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 shadow-xs space-y-6">
              {/* Profile Header & VIP Routing */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E0D7] gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43]">{profile.fullName}</h2>
                    {profile.isVip && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C5A572]/20 text-[#102A43] border border-[#C5A572]/40">
                        ★ VIP ROYAL SUITE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#687787] mt-0.5">
                    Số Hộ Chiếu: <span className="font-semibold text-[#252B32]">{profile.passportNumber}</span> • Quốc Tịch: {profile.nationality}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-semibold text-[#687787] uppercase block">Số Phòng / Cabin</span>
                  <span className="text-xl font-serif font-bold text-[#102A43]">{profile.cabinNumber}</span>
                </div>
              </div>

              {/* Status Checks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl">
                  <span className="text-[10px] font-semibold text-[#687787] uppercase block">Khai Báo Y Tế</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {profile.healthDeclarationCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-800">Đã khai báo</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-semibold text-rose-700">Chưa khai báo</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl">
                  <span className="text-[10px] font-semibold text-[#687787] uppercase block">Tài Khoản Folio</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CreditCard className="w-4 h-4 text-[#102A43]" />
                    <span className="text-xs font-semibold text-[#102A43]">
                      {profile.folioStatus === 'ACTIVE' ? 'Đã kích hoạt' : 'Chờ kích hoạt'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl">
                  <span className="text-[10px] font-semibold text-[#687787] uppercase block">Trạng Thái Lên Tàu</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {profile.checkInStatus === 'BOARDED' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-800">Đã lên tàu</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700">Chờ boarding</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RFID Issuance & Hardware Writer Section */}
              <div className="p-4 bg-[#F7F4ED] border border-[#E5E0D7] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#102A43]" />
                    <h4 className="text-xs font-semibold text-[#102A43] uppercase tracking-wider">
                      Cấp Phát Thẻ Cruise Card / Vòng Tay RFID (NFC)
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700">Đầu Đọc USB: SẴN SÀNG</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    placeholder="Chạm thẻ trắng vào đầu đọc RFID..."
                    className="flex-1 text-xs bg-white border border-[#E5E0D7] rounded-lg px-3 py-2 text-[#252B32] focus:outline-none focus:border-[#102A43]"
                  />
                  <button
                    type="button"
                    onClick={handleBindRfid}
                    className="py-2 px-4 text-xs font-semibold bg-[#102A43] hover:bg-[#183B5B] text-white rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gán Mã Thẻ
                  </button>
                </div>

                {rfidStatusMsg && (
                  <p
                    className={`text-xs font-medium ${
                      rfidStatusMsg.type === 'success' ? 'text-[#102A43]' : 'text-rose-600'
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
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 ${
                    profile.checkInStatus === 'BOARDED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-[#102A43] hover:bg-[#183B5B] text-white'
                  }`}
                >
                  <Ship className="w-5 h-5 text-current" />
                  {profile.checkInStatus === 'BOARDED'
                    ? 'HÀNH KHÁCH ĐÃ LÀM THỦ TỤC LÊN TÀU'
                    : isProcessingCheckIn
                    ? 'Đang Xác Nhận Lên Tàu...'
                    : 'XÁC NHẬN BOARDING & KÍCH HOẠT HỒ SƠ'}
                </button>

                {checkInResultMsg && (
                  <div
                    className={`mt-3 p-3 border rounded-xl text-xs font-medium flex items-center gap-2 ${
                      checkInResultMsg.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {checkInResultMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    )}
                    <span>{checkInResultMsg.text}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-[#E5E0D7] rounded-2xl p-12 text-center">
              <User className="w-12 h-12 text-[#687787]/40 mx-auto mb-3" />
              <h3 className="text-base font-serif font-bold text-[#102A43] uppercase">Chưa Chọn Hồ Sơ Hành Khách</h3>
              <p className="text-xs text-[#687787] mt-1 max-w-sm mx-auto">
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
