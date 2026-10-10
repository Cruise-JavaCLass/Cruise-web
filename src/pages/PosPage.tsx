import { useState } from 'react';
import { CreditCard, QrCode, WifiOff, RefreshCw, DollarSign, Receipt, CheckCircle2 } from 'lucide-react';

export function PosPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(14);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setOfflineCount(0);
      setIsSyncing(false);
    }, 1500);
  };

  const transactions = [
    { id: 'TX-9842', cabin: 'Cabin 402 - Deck 4', guest: 'Nguyễn Văn Minh', amount: '$45.00', service: 'Sky Bar & Cocktail', time: '19:15', status: 'Đã đồng bộ' },
    { id: 'TX-9841', cabin: 'Cabin 718 - Deck 7', guest: 'Trần Thị Thu Thảo', amount: '$120.00', service: 'Lotus Spa Trị Liệu', time: '18:50', status: 'Đã đồng bộ' },
    { id: 'TX-9840', cabin: 'Cabin 505 - Deck 5', guest: 'Lê Hoàng Nam', amount: '$18.50', service: 'Café & Bakery', time: '18:22', status: 'Lưu offline' },
    { id: 'TX-9839', cabin: 'Cabin 812 - Deck 8', guest: 'Phạm Hồng Ánh', amount: '$210.00', service: 'Cửa Hàng Miễn Thuế', time: '17:40', status: 'Đã đồng bộ' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" /> Hệ Thống POS & Tài Khoản Phi Tiền Mặt
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận giao dịch chi tiêu vào tài khoản cabin/hành khách • Hỗ trợ lưu trữ ngoại tuyến khi mất sóng biển
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing || offlineCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Đang đồng bộ...' : `Đồng bộ ngoại tuyến (${offlineCount} Tx)`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Chế độ mạng POS</span>
            <WifiOff className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400">Đã kết nối máy chủ</p>
          <span className="text-[11px] text-slate-400">Đồng bộ tự động mỗi 60s</span>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Giao dịch chờ đồng bộ</span>
            <Receipt className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-amber-400">{offlineCount} Giao dịch</p>
          <span className="text-[11px] text-slate-400">Lưu trữ bảo mật cục bộ tại POS</span>
        </div>
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs">Tổng chi tiêu chuyến đi</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-white">$184,350 USD</p>
          <span className="text-[11px] text-emerald-400">Quyết toán khi cập bến</span>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-cyan-400" /> Nhật Ký Giao Dịch Chi Tiêu Gần Nhất
          </h3>
          <span className="text-xs text-slate-400">Xác thực: QR Code / RFID Wristband</span>
        </div>
        <div className="divide-y divide-slate-800/80">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-800 px-2 py-1 rounded-md">
                  {tx.id}
                </span>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">{tx.guest} — <span className="text-slate-400 font-normal">{tx.cabin}</span></h4>
                  <p className="text-xs text-slate-400">{tx.service} • Lúc {tx.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-emerald-400">{tx.amount}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                  tx.status === 'Đã đồng bộ' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  <CheckCircle2 className="w-3 h-3" /> {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
