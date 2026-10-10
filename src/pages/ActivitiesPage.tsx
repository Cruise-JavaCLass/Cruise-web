import { Activity, Plus, Users, Clock, MapPin, Tag } from 'lucide-react';

export function ActivitiesPage() {
  const activities = [
    { name: 'Gala Dinner & Vũ Điệu Hoàng Gia', type: 'Onboard', location: 'Tầng 7 - Grand Ballroom', time: '19:30', fee: 'Miễn phí (Tour)', capacity: '450/500', status: 'Đang mở' },
    { name: 'Tour Tham Quan Phố Cổ Hội An', type: 'Shore Excursion', location: 'Cảng Tiên Sa -> Hội An', time: '09:00', fee: '$65 USD', capacity: '120/120', status: 'Hết chỗ' },
    { name: 'Lớp Học Pha Chế Cocktail Hoàng Hôn', type: 'Onboard', location: 'Tầng 12 - Sky Deck Bar', time: '17:00', fee: '$25 USD', capacity: '28/35', status: 'Đang mở' },
    { name: 'Lặn Ngắm San Hô Hòn Mun', type: 'Shore Excursion', location: 'Nha Trang Bay', time: '08:30', fee: '$80 USD', capacity: '45/60', status: 'Đang mở' },
    { name: 'Spa Thảo Dược & Massage Trị Liệu', type: 'Onboard', location: 'Tầng 4 - Lotus Wellness', time: 'Theo lịch hẹn', fee: '$95 USD', capacity: '14/20', status: 'Đang mở' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Quản Lý Hoạt Động & Tour Trên Bờ
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Đăng ký trước & trong chuyến đi • Giới hạn chỗ ngồi • Phân biệt dịch vụ miễn phí / trả phí phát sinh
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all">
          <Plus className="w-4 h-4" /> Tạo Hoạt Động Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((act, index) => (
          <div key={index} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  act.type === 'Onboard' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {act.type}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  act.status === 'Đang mở' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {act.status}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-100">{act.name}</h3>
              <div className="space-y-1.5 mt-3 text-xs text-slate-400">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> {act.location}</p>
                <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400" /> {act.time}</p>
                <p className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-400" /> Đã đăng ký: {act.capacity}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> {act.fee}
              </span>
              <button className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                Chi tiết & Check-in &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
