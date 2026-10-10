import { MapPin, Calendar, Clock, Ship, Plus, ArrowRight } from 'lucide-react';

export function ItineraryPage() {
  const ports = [
    { day: 'Day 1', date: '10/10/2026', port: 'Cảng Tuần Châu (Hạ Long)', arrival: '12:00', departure: '16:00', status: 'Đã xuất bến' },
    { day: 'Day 2', date: '11/10/2026', port: 'Cảng Tiên Sa (Đà Nẵng)', arrival: '08:00', departure: '20:00', status: 'Cảng hiện tại' },
    { day: 'Day 3', date: '12/10/2026', port: 'Nha Trang Bay (Khánh Hòa)', arrival: '07:30', departure: '18:00', status: 'Kế tiếp' },
    { day: 'Day 4', date: '13/10/2026', port: 'Cảng An Thới (Phú Quốc)', arrival: '09:00', departure: '22:00', status: 'Dự kiến' },
    { day: 'Day 5', date: '14/10/2026', port: 'Cảng Sài Gòn (TP.HCM)', arrival: '08:00', departure: 'Kết thúc tour', status: 'Dự kiến' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" /> Quản Lý Hải Trình & Cảng Dừng (Itinerary)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bộ phận Điều phối Hải trình • Thiết lập tour, cập nhật giờ tàu đến/rời bến và cảnh báo thời tiết
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all">
          <Plus className="w-4 h-4" /> Thêm Cảng Dừng
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Tour đang chạy</span>
          <p className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            <Ship className="w-4 h-4 text-cyan-400" /> Vịnh Bắc Bộ — Biển Đông (5N4Đ)
          </p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Thời tiết cảng tiếp theo</span>
          <p className="text-lg font-bold text-emerald-400 mt-1">Nha Trang: Nắng nhẹ, Sóng êm</p>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400">Tốc độ hành trình</span>
          <p className="text-lg font-bold text-cyan-400 mt-1">18.5 Knots (Hải lý/h)</p>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">Danh Sách Các Cảng Ghé (Ports of Call)</h3>
          <span className="text-xs text-cyan-400">Tổng cộng: 5 Điểm dừng</span>
        </div>
        <div className="divide-y divide-slate-800/80">
          {ports.map((p, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
                  {p.day}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">{p.port}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-400" /> Đến: {p.arrival} — Rời: {p.departure}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  p.status === 'Cảng hiện tại' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                  p.status === 'Đã xuất bến' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {p.status}
                </span>
                <button className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
