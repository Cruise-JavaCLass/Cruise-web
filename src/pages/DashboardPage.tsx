import {
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  MapPin,
  QrCode,
  ChevronRight
} from 'lucide-react';

export function DashboardPage() {
  return (
    <>
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-cyan-950/80 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Frontend Client v1.0.0
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Hệ Thống Quản Lý Dịch Vụ & Hoạt Động Du Thuyền
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Quản lý xuyên suốt hải trình, hoạt động giải trí trên tàu, tour trên bờ, xác thực thẻ QR/RFID và hệ thống tài khoản phi tiền mặt (Cashless POS) hỗ trợ đồng bộ ngoại tuyến.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Hành khách trên tàu</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">2,450 <span className="text-xs font-normal text-slate-400">/ 2,800</span></p>
          <div className="mt-2 flex items-center text-[11px] text-emerald-400">
            <TrendingUp className="w-3 h-3 mr-1" /> 87.5% công suất phòng
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Hoạt động hôm nay</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">18 Sự kiện</p>
          <div className="mt-2 text-[11px] text-cyan-300">
            12 Onboard • 6 Shore Excursion
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Doanh thu POS hôm nay</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">$42,850 <span className="text-xs font-normal text-slate-400">USD</span></p>
          <div className="mt-2 text-[11px] text-emerald-400">
            Cashless Onboard Accounts
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">An toàn & Tập trung</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">100% Onboard</p>
          <div className="mt-2 text-[11px] text-slate-400">
            0 khách trễ giờ nhổ neo
          </div>
        </div>
      </div>

      {/* Module Details Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary Preview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" /> Lịch trình & Điểm dừng du thuyền (Itinerary)
            </h3>
            <span className="text-xs text-cyan-400 font-medium">Hành trình 5 Ngày 4 Đêm</span>
          </div>
          <div className="space-y-3">
            {[
              { day: 'Ngày 1', port: 'Cảng Quốc Tế Tuần Châu (Hạ Long)', time: 'Xuất bến 16:00', status: 'Hoàn thành' },
              { day: 'Ngày 2', port: 'Cảng Tiên Sa (Đà Nẵng & Hội An)', time: '08:00 — 20:00', status: 'Đang diễn ra' },
              { day: 'Ngày 3', port: 'Nha Trang Bay & Đảo Hòn Tre', time: '07:30 — 18:00', status: 'Kế tiếp' },
              { day: 'Ngày 4', port: 'Cảng An Thới (Phú Quốc)', time: '09:00 — 22:00', status: 'Lên lịch' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-12 text-slate-400 font-bold">{item.day}</span>
                  <div>
                    <p className="font-medium text-slate-200">{item.port}</p>
                    <p className="text-[11px] text-slate-400">{item.time}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                  item.status === 'Đang diễn ra' ? 'bg-cyan-500/20 text-cyan-300' :
                  item.status === 'Hoàn thành' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Offline POS & QR Check-in preview */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2 mb-4">
              <QrCode className="w-4 h-4 text-amber-400" /> POS & Offline Sync
            </h3>
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 mb-4 text-xs text-amber-200/90">
              <p className="font-semibold text-amber-300 mb-1">Mô hình ngoại tuyến (Offline Ready):</p>
              Thiết bị POS & tablet ghi nhận giao dịch chi tiêu không dùng tiền mặt qua Cruise Card / QR / RFID khi tàu mất sóng và tự động sync khi có mạng.
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                <span>Xác thực:</span>
                <span className="font-semibold text-cyan-400">QR Code / RFID Wristband</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                <span>Mô hình tài khoản:</span>
                <span className="font-semibold text-emerald-400">Cashless Cabin Account</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40">
                <span>Định vị BLE (Tùy chọn):</span>
                <span className="font-semibold text-purple-400">Zone-level Tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Frontend: React 19 + Vite</span>
            <span className="text-cyan-400 font-medium flex items-center gap-1">
              Ready <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
