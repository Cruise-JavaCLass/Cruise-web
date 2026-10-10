import { useState } from 'react';
import { Users, QrCode, Search, Radio } from 'lucide-react';

export function PassengersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const passengers = [
    { name: 'Nguyễn Văn Minh', cabin: '402 (Ban công)', rfid: 'RFID-99412', package: 'All-Inclusive VIP', zone: 'Zone A - Sky Lounge', checkIn: 'Đã lên tàu' },
    { name: 'Trần Thị Thu Thảo', cabin: '718 (Suite)', rfid: 'RFID-99413', package: 'All-Inclusive VIP', zone: 'Zone C - Pool Deck', checkIn: 'Đã lên tàu' },
    { name: 'Lê Hoàng Nam', cabin: '505 (Tiêu chuẩn)', rfid: 'RFID-88102', package: 'Classic Cruise', zone: 'Zone B - Main Dining', checkIn: 'Đã lên tàu' },
    { name: 'Phạm Hồng Ánh', cabin: '812 (Oceanview)', rfid: 'RFID-77291', package: 'Premium Tour', zone: 'Zone E - Theater', checkIn: 'Đã lên tàu' },
    { name: 'Đỗ Quốc Bảo', cabin: '304 (Tiêu chuẩn)', rfid: 'RFID-66230', package: 'Classic Cruise', zone: 'Chưa cập nhật', checkIn: 'Chưa check-in' },
  ];

  const filteredPassengers = passengers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cabin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rfid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Danh Sách Hành Khách & Định Vị BLE
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gán thẻ QR / Vòng đeo RFID • Phân biệt gói tour bao gồm và trả phí • Hỗ trợ định vị vùng (Zone-level)
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            role="searchbox"
            aria-label="Tìm kiếm hành khách"
            placeholder="Tìm theo tên, cabin, mã thẻ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
          />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">Danh Sách Hành Khách Trên Tàu (2,450 Khách)</h3>
          <span className="text-xs text-purple-400 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> BLE Zone Tracking: Hoạt động
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Hành khách</th>
                <th className="p-3.5">Cabin</th>
                <th className="p-3.5">Thẻ / Vòng RFID</th>
                <th className="p-3.5">Gói Tour</th>
                <th className="p-3.5">Vị trí BLE ước lượng</th>
                <th className="p-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Không tìm thấy hành khách nào phù hợp với từ khóa "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-100">{p.name}</td>
                    <td className="p-3.5 text-slate-300">{p.cabin}</td>
                    <td className="p-3.5 font-mono text-cyan-400 flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" /> {p.rfid}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                        {p.package}
                      </span>
                    </td>
                    <td className="p-3.5 text-purple-300 font-medium">{p.zone}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.checkIn === 'Đã lên tàu' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {p.checkIn}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
