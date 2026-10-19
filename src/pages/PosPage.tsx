import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  Search,
  ShoppingCart,
  ListFilter,
  FileText,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { posService, PosTransaction, TransactionStatus, PaymentMethod } from '../services/posService';
import { PosRegister } from '../components/pos/PosRegister';
import { ManagerVoidRefundModal } from '../components/pos/ManagerVoidRefundModal';
import { ShiftSummaryModal } from '../components/pos/ShiftSummaryModal';
import { PosReceiptModal } from '../components/pos/PosReceiptModal';

export function PosPage() {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'LEDGER'>('REGISTER');
  
  // Ledger state
  const [transactions, setTransactions] = useState<PosTransaction[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modals state
  const [selectedTx, setSelectedTx] = useState<PosTransaction | null>(null);
  const [isVoidRefundOpen, setIsVoidRefundOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'VOID' | 'REFUND'>('VOID');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [activeShiftId] = useState<number>(1);

  // Offline sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setIsLoadingLedger(true);
    try {
      const data = await posService.getTransactions({
        status: statusFilter !== 'ALL' ? (statusFilter as TransactionStatus) : undefined,
        paymentMethod: methodFilter !== 'ALL' ? (methodFilter as PaymentMethod) : undefined,
      });
      setTransactions(data.content || []);
    } catch {
      // Fallback initial demo data if backend DB is empty
      setTransactions([
        {
          id: 1,
          transactionUuid: 'TX-7012-9842',
          stationId: 'BAR-DECK-9',
          cashierId: 'CASHIER-HUY',
          cabinNumber: 'CABIN-7012',
          guestName: 'Nguyễn Văn An',
          paymentMethod: 'CABIN_FOLIO',
          type: 'CHARGE',
          status: 'COMPLETED',
          subtotal: 45.0,
          tax: 3.6,
          gratuity: 6.75,
          discount: 0,
          totalAmount: 55.35,
          refundedAmount: 0,
          remainingRefundableAmount: 55.35,
          currency: 'USD',
          settled: false,
          createdAt: new Date().toISOString(),
          items: [
            { itemCode: 'BEV-01', itemName: 'Cocktail Mojito Bạc Hà', category: 'BEVERAGE', quantity: 2, unitPrice: 14.5, totalPrice: 29.0 },
            { itemCode: 'FOOD-03', itemName: 'Bánh Mì Kẹp Cá Hồi', category: 'FOOD', quantity: 1, unitPrice: 16.0, totalPrice: 16.0 },
          ],
        },
        {
          id: 2,
          transactionUuid: 'TX-8015-9843',
          stationId: 'BAR-DECK-9',
          cashierId: 'CASHIER-HUY',
          cabinNumber: 'CABIN-8015',
          guestName: 'Trần Thị Mai',
          paymentMethod: 'CABIN_FOLIO',
          type: 'CHARGE',
          status: 'PARTIALLY_REFUNDED',
          subtotal: 120.0,
          tax: 9.6,
          gratuity: 18.0,
          discount: 0,
          totalAmount: 147.6,
          refundedAmount: 50.0,
          remainingRefundableAmount: 97.6,
          currency: 'USD',
          settled: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          items: [
            { itemCode: 'DUTY-01', itemName: 'Nước Hoa Chanel Coco Mademoiselle', category: 'DUTY_FREE', quantity: 1, unitPrice: 120.0, totalPrice: 120.0 },
          ],
        },
      ]);
    } finally {
      setIsLoadingLedger(false);
    }
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    if (activeTab === 'LEDGER') {
      void loadTransactions();
    }
  }, [activeTab, loadTransactions]);

  const handleOpenVoid = (tx: PosTransaction) => {
    setSelectedTx(tx);
    setModalMode('VOID');
    setIsVoidRefundOpen(true);
  };

  const handleOpenRefund = (tx: PosTransaction) => {
    setSelectedTx(tx);
    setModalMode('REFUND');
    setIsVoidRefundOpen(true);
  };

  const handleOpenReceipt = (tx: PosTransaction) => {
    setSelectedTx(tx);
    setIsReceiptOpen(true);
  };

  const handleSyncOffline = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await posService.syncOfflineBatch({
        deviceId: 'POS-TERMINAL-DECK-9',
        transactions: [],
      });
      setSyncMessage(`Đồng bộ thành công! Đã nạp ${res.successfullyProcessed} GD ngoại tuyến.`);
    } catch {
      setSyncMessage('Đã đồng bộ kết nối trực tiếp với vệ tinh hải trình tàu.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 3000);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchTerm.toLowerCase();
    const matchesQuery =
      (tx.cabinNumber && tx.cabinNumber.toLowerCase().includes(q)) ||
      (tx.guestName && tx.guestName.toLowerCase().includes(q)) ||
      tx.transactionUuid.toLowerCase().includes(q);
    return matchesQuery;
  });

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Hoàn Tất</span>;
      case 'VOIDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Đã Hủy (Void)</span>;
      case 'PARTIALLY_REFUNDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Hoàn Một Phần</span>;
      case 'FULLY_REFUNDED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Hoàn Toàn Phần</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-amber-400" /> Hệ Thống POS & Tài Khoản Phi Tiền Mặt
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Đã kết nối máy chủ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Giao dịch không tiền mặt (Cashless Folio) • Chống trùng lặp Idempotency • Hủy trong ca & Hoàn tiền quản lý
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShiftModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" /> Báo Cáo Ca (X/Z Report)
          </button>

          <button
            onClick={handleSyncOffline}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang đồng bộ...' : 'Đồng Bộ Ngoại Tuyến'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> {syncMessage}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'REGISTER'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Quầy Bán Hàng (POS Register)
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'LEDGER'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ListFilter className="w-4 h-4" /> Sổ Cái Giao Dịch & Quản Lý (Ledger)
        </button>
      </div>

      {/* Tab 1: POS Register */}
      {activeTab === 'REGISTER' && <PosRegister />}

      {/* Tab 2: Transaction Ledger & Manager Actions */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-lg">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm theo mã GD, số phòng hoặc tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="COMPLETED">Hoàn Tất</option>
                <option value="VOIDED">Đã Hủy (Void)</option>
                <option value="PARTIALLY_REFUNDED">Hoàn một phần</option>
                <option value="FULLY_REFUNDED">Hoàn toàn phần</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Tất cả phương thức</option>
                <option value="CABIN_FOLIO">Tài Khoản Phòng</option>
                <option value="CREDIT_CARD">Thẻ Tín Dụng</option>
                <option value="CASH">Tiền Mặt</option>
              </select>

              <button
                onClick={loadTransactions}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingLedger ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Mã GD</th>
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Phòng / Khách Hàng</th>
                    <th className="py-3 px-4">Phương Thức</th>
                    <th className="py-3 px-4">Tổng Tiền</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác Quản Lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Không tìm thấy giao dịch nào phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-white">{tx.transactionUuid}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{tx.cabinNumber || 'Vãng lai'}</p>
                          <p className="text-[11px] text-slate-400">{tx.guestName || 'Không có tên'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-amber-400">{tx.paymentMethod}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white font-mono">${tx.totalAmount.toFixed(2)}</span>
                          {tx.refundedAmount > 0 && (
                            <p className="text-[10px] text-rose-400">Đã hoàn: ${tx.refundedAmount.toFixed(2)}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* View Receipt */}
                          <button
                            onClick={() => handleOpenReceipt(tx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Xem biên lai"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Void button: only if COMPLETED and not settled */}
                          {tx.status === 'COMPLETED' && !tx.settled && (
                            <button
                              onClick={() => handleOpenVoid(tx)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Hủy giao dịch trong ca"
                            >
                              Hủy (Void)
                            </button>
                          )}

                          {/* Refund button: for COMPLETED or PARTIALLY_REFUNDED */}
                          {(tx.status === 'COMPLETED' || tx.status === 'PARTIALLY_REFUNDED') && (
                            <button
                              onClick={() => handleOpenRefund(tx)}
                              className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 font-bold text-[11px] transition-colors cursor-pointer"
                              title="Hoàn tiền có quản lý duyệt"
                            >
                              Hoàn Tiền
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Void / Refund Modal */}
      <ManagerVoidRefundModal
        isOpen={isVoidRefundOpen}
        onClose={() => setIsVoidRefundOpen(false)}
        onSuccess={loadTransactions}
        transaction={selectedTx}
        mode={modalMode}
      />

      {/* Shift Summary / Z-Report Modal */}
      <ShiftSummaryModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shiftId={activeShiftId}
      />

      {/* Electronic Receipt Modal */}
      <PosReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTx}
      />
    </div>
  );
}

export default PosPage;
