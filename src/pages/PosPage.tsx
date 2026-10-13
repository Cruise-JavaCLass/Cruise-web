import { useState } from 'react';
import {
  CreditCard,
  QrCode,
  WifiOff,
  RefreshCw,
  DollarSign,
  Receipt,
  CheckCircle2,
  Search,
} from 'lucide-react';

export function PosPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(14);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.guest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.cabin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-amber-400" /> Hệ Thống POS & Tài Khoản Phi Tiền Mặt
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ghi nhận giao dịch chi tiêu vào tài khoản cabin/hành khách • Hỗ trợ lưu trữ ngoại tuyến khi mất sóng biển
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing || offlineCount === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Đang đồng bộ...' : `Đồng bộ ngoại tuyến (${offlineCount} Tx)`}
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Chế độ mạng POS</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <WifiOff className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-400">Đã kết nối máy chủ</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Đồng bộ tự động mỗi 60s</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Giao dịch chờ đồng bộ</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-400">{offlineCount} Giao dịch</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Lưu trữ bảo mật cục bộ tại POS</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Tổng chi tiêu chuyến đi</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">$184,350 USD</p>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">Quyết toán khi cập bến</span>
        </div>
      </div>

      {/* Transaction List Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400" /> Nhật Ký Giao Dịch Chi Tiêu Gần Nhất
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Xác thực: QR Code / RFID Wristband</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm khách hoặc mã cabin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-800/70">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 rounded-lg">
                  {tx.id}
                </span>
                <div>
                  <h4 className="font-semibold text-sm text-slate-100">
                    {tx.guest} <span className="text-slate-400 font-normal text-xs">• {tx.cabin}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tx.service} • Lúc {tx.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="text-sm font-bold text-emerald-400">{tx.amount}</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                    tx.status === 'Đã đồng bộ'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" /> {tx.status}
                </span>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Không tìm thấy giao dịch nào phù hợp với từ khóa "{searchTerm}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
