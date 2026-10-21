import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  RefreshCw,
  Search,
  ShoppingCart,
  ListFilter,
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Scale,
  ShieldAlert,
  FileQuestion,
  DollarSign,
} from 'lucide-react';
import {
  posService,
  type PosTransaction,
  type TransactionStatus,
  type PaymentMethod,
} from '../services/posService';
import { PosRegister } from '../components/pos/PosRegister';
import { ManagerVoidRefundModal } from '../components/pos/ManagerVoidRefundModal';
import { ShiftSummaryModal } from '../components/pos/ShiftSummaryModal';
import { PosReceiptModal } from '../components/pos/PosReceiptModal';
import { PosCatalogManagement } from '../components/pos/PosCatalogManagement';
import { Layers } from 'lucide-react';
import {
  reconciliationService,
  type ReconciliationSummaryMetrics,
  type DiscrepancyRecord,
  type DisputeCase,
  type ResolveDiscrepancyPayload,
  type ResolveDisputePayload,
} from '../services/reconciliationService';
import { DiscrepancyInspectorModal } from '../components/pos/DiscrepancyInspectorModal';
import { DisputeManagementWorkspace } from '../components/pos/DisputeManagementWorkspace';
import { SyncControlPanel } from '../components/pos/SyncControlPanel';

export function PosPage() {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'LEDGER' | 'CATALOG' | 'RECONCILIATION' | 'DISPUTES' | 'SYNC'>('REGISTER');
  // Ledger state
  const [transactions, setTransactions] = useState<PosTransaction[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modals state
  const [selectedTx, setSelectedTx] = useState<PosTransaction | null>(null);
  const [isVoidRefundOpen, setIsVoidRefundOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'VOID' | 'REFUND'>('VOID');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [activeShiftId, setActiveShiftId] = useState<number | null>(null);
  const [isLoadingShift, setIsLoadingShift] = useState(false);

  // Offline sync / connectivity state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Reconciliation State
  const [metrics, setMetrics] = useState<ReconciliationSummaryMetrics | null>(null);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyRecord[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyRecord | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isRunningRecon, setIsRunningRecon] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load active shift for current station on mount
  useEffect(() => {
    const loadShift = async () => {
      setIsLoadingShift(true);
      try {
        const shift = await posService.getActiveShift('BAR-DECK-9');
        if (shift && shift.id) {
          setActiveShiftId(shift.id);
        } else {
          setActiveShiftId(null);
        }
      } catch {
        setActiveShiftId(null);
      } finally {
        setIsLoadingShift(false);
      }
    };
    void loadShift();
  }, []);

  const loadReconciliationData = async () => {
    setIsLoadingData(true);
    try {
      const [m, disc, disp] = await Promise.all([
        reconciliationService.getSummaryMetrics(),
        reconciliationService.getDiscrepancies(),
        reconciliationService.getDisputes(),
      ]);
      setMetrics(m);
      setDiscrepancies(disc || []);
      setDisputes(disp || []);
      setLoadError(null);
    } catch (err) {
      console.error('Failed to load reconciliation data:', err);
      setLoadError(err instanceof Error ? err.message : 'Không thể tải dữ liệu đối soát');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    void loadReconciliationData();
  }, []);

  const loadTransactions = useCallback(async () => {
    setIsLoadingLedger(true);
    setLedgerError(null);
    try {
      const data = await posService.getTransactions({
        status: statusFilter !== 'ALL' ? (statusFilter as TransactionStatus) : undefined,
        paymentMethod: methodFilter !== 'ALL' ? (methodFilter as PaymentMethod) : undefined,
      });
      setTransactions(data.content || []);
    } catch (err: unknown) {
      setTransactions([]);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tải lịch sử giao dịch từ máy chủ. Vui lòng thử lại!';
      setLedgerError(msg);
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
      setSyncMessage({
        text: `Kiểm tra kết nối và đồng bộ hoàn tất: Đã nạp ${res.successfullyProcessed} GD ngoại tuyến.`,
        isError: false,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Lỗi khi kiểm tra kết nối với vệ tinh ngoại tuyến!';
      setSyncMessage({
        text: msg,
        isError: true,
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleRunReconciliation = async () => {
    setIsRunningRecon(true);
    try {
      await reconciliationService.runReconciliation();
      await loadReconciliationData();
    } catch (err) {
      console.error('Failed to run reconciliation:', err);
      alert('Đã xảy ra lỗi khi chạy đối soát. Vui lòng thử lại.');
    } finally {
      setIsRunningRecon(false);
    }
  };

  const handleResolveDiscrepancy = async (id: number, payload: ResolveDiscrepancyPayload) => {
    try {
      await reconciliationService.resolveDiscrepancy(id, payload);
      await loadReconciliationData();
    } catch (err) {
      console.error('Failed to resolve discrepancy:', err);
      alert('Đã xảy ra lỗi khi xử lý sai lệch. Vui lòng thử lại.');
    }
  };

  const handleResolveDispute = async (id: number, payload: ResolveDisputePayload) => {
    try {
      await reconciliationService.resolveDispute(id, payload);
      await loadReconciliationData();
    } catch (err) {
      console.error('Failed to resolve dispute:', err);
      alert('Đã xảy ra lỗi khi xử lý khiếu nại. Vui lòng thử lại.');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchTerm.toLowerCase();
    return (
      (tx.cabinNumber && tx.cabinNumber.toLowerCase().includes(q)) ||
      (tx.guestName && tx.guestName.toLowerCase().includes(q)) ||
      tx.transactionUuid.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Hoàn Tất
          </span>
        );
      case 'VOIDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Đã Hủy (Void)
          </span>
        );
      case 'PARTIALLY_REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Hoàn Một Phần
          </span>
        );
      case 'FULLY_REFUNDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Hoàn Toàn Phần
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
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
            Giao dịch không tiền mặt (Cashless Folio) • Đối soát POS & Folio tự động • Hủy trong ca & Giải quyết khiếu nại
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunReconciliation}
            disabled={isRunningRecon}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Scale className={`w-4 h-4 ${isRunningRecon ? 'animate-spin' : ''}`} />
            {isRunningRecon ? 'Đang đối soát...' : 'Chạy Đối Soát Ngay'}
          </button>

          <button
            onClick={() => setIsShiftModalOpen(true)}
            disabled={!activeShiftId || isLoadingShift}
            title={!activeShiftId ? 'Chưa có ca làm việc đang mở' : 'Xem báo cáo ca'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" /> Báo Cáo Ca (X/Z Report)
          </button>

          <button
            onClick={handleSyncOffline}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
            syncMessage.isError
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
          }`}
        >
          {syncMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-800">
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'REGISTER'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Quầy Bán Hàng (POS Register)</span>
          <span className="sr-only">Quầy Thu Ngân & Giao Dịch</span>
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

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'CATALOG'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" /> Quản Lý Danh Mục & Giá (Catalog)
        </button>

        <button
          onClick={() => setActiveTab('RECONCILIATION')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'RECONCILIATION'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          Trung Tâm Đối Soát (Reconciliation)
          {discrepancies.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white">
              {discrepancies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'DISPUTES'
              ? 'border-amber-600 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Hồ Sơ Khiếu Nại Chi Phí (Disputes)
          {disputes.filter((d) => d.status === 'SUBMITTED').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
              {disputes.filter((d) => d.status === 'SUBMITTED').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('SYNC')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'SYNC'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Bảng Điều Khiển Đồng Bộ (Sync Center)</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Doanh thu đã đối soát</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-white">
              ${metrics.totalReconciledAmount.toLocaleString()} USD
            </p>
            <span className="text-[11px] text-emerald-400 mt-1 block">Khớp 100% giữa POS & Folio</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Tỷ lệ sai lệch</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-cyan-400">
              {metrics.discrepancyRatePercent}%
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Ngưỡng cảnh báo: 0.5%</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Sai lệch cần xử lý</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-rose-400">
              {metrics.pendingDiscrepanciesCount} Bản ghi
            </p>
            <span className="text-[11px] text-slate-400 mt-1 block">Chênh lệch ${metrics.totalVarianceAmount} USD</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Khiếu nại đang chờ</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileQuestion className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold text-amber-400">
              {metrics.openDisputesCount} Hồ sơ
            </p>
            <span className="text-[11px] text-amber-300 mt-1 block font-medium">Đang tranh chấp: ${metrics.totalDisputedAmount} USD</span>
          </div>
        </div>
      )}

      {/* Emergency Alert Banner if Active */}
      {metrics?.criticalAlertActive && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{metrics.alertMessage}</span>
          </div>
          <button
            onClick={() => setActiveTab('RECONCILIATION')}
            className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-[11px] hover:bg-rose-600 transition-colors cursor-pointer"
          >
            Xử lý ngay
          </button>
        </div>
      )}

      {/* Tab 1: POS Register */}
      {activeTab === 'REGISTER' && <PosRegister />}

      {/* Tab 2: Transaction Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {ledgerError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ledgerError}</span>
              </div>
              <button
                onClick={loadTransactions}
                className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded-lg font-semibold cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm mã UUID, số cabin, tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="COMPLETED">Hoàn tất</option>
                <option value="VOIDED">Đã hủy (Void)</option>
                <option value="PARTIALLY_REFUNDED">Hoàn một phần</option>
                <option value="FULLY_REFUNDED">Hoàn toàn phần</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">Mọi phương thức</option>
                <option value="CABIN_FOLIO">Tài Khoản Phòng</option>
                <option value="CREDIT_CARD">Thẻ Tín Dụng</option>
                <option value="CASH">Tiền Mặt</option>
              </select>

              <button
                onClick={loadTransactions}
                disabled={isLoadingLedger}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
                title="Tải lại sổ cái"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingLedger ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Mã Giao Dịch</th>
                    <th className="px-4 py-3">Phòng / Khách Hàng</th>
                    <th className="px-4 py-3">Phương Thức</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                    <th className="px-4 py-3 text-right">Tổng Tiền</th>
                    <th className="px-4 py-3 text-right">Đã Hoàn</th>
                    <th className="px-4 py-3 text-center">Z-Report</th>
                    <th className="px-4 py-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        {isLoadingLedger ? 'Đang tải dữ liệu...' : 'Không tìm thấy giao dịch nào.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono font-bold text-white">{tx.transactionUuid}</p>
                          <p className="text-[10px] text-slate-500">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : 'N/A'} • {tx.stationId}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{tx.guestName || 'Khách Vãng Lai'}</p>
                          <p className="text-[11px] text-amber-400 font-mono">{tx.cabinNumber || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-slate-300">{tx.paymentMethod}</span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-white font-mono">
                          ${tx.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-rose-400">
                          {tx.refundedAmount > 0 ? `-$${tx.refundedAmount.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.settled ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              Đã Chốt
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Chưa Chốt
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {/* Receipt button */}
                          <button
                            onClick={() => handleOpenReceipt(tx)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Xem hóa đơn điện tử"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Void button: Only for unsettled COMPLETED transactions */}
                          {tx.status === 'COMPLETED' && !tx.settled && (
                            <button
                              onClick={() => handleOpenVoid(tx)}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            >
                              Hủy (Void)
                            </button>
                          )}

                          {/* Refund button: Available if COMPLETED or PARTIALLY_REFUNDED and remaining > 0 */}
                          {(tx.status === 'COMPLETED' || tx.status === 'PARTIALLY_REFUNDED') &&
                            (tx.remainingRefundableAmount ?? tx.totalAmount - (tx.refundedAmount || 0)) > 0 && (
                              <button
                                onClick={() => handleOpenRefund(tx)}
                                className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
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

      {/* Tab 3: Multi-Outlet Catalog & Menu Management */}
      {activeTab === 'CATALOG' && <PosCatalogManagement />}
      {/* TAB 3: RECONCILIATION DASHBOARD & DISCREPANCY LIST */}
      {activeTab === 'RECONCILIATION' && (
        <div className="space-y-6">
          <div className="bg-[#030303]/60 border border-white/10 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-cyan-400" /> Bảng Sai Lệch Đối Soát Giao Dịch (Discrepancy Inspector)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phát hiện sai lệch giữa bản ghi POS và Sổ cái Cabin Folio
                </p>
              </div>

              <span className="text-xs text-slate-400">
                {discrepancies.length} Bản ghi cần tra soát
              </span>
            </div>

            {loadError ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-rose-400 text-xs flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadReconciliationData()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              </div>
            ) : discrepancies.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Không phát hiện sai lệch nào. Toàn bộ giao dịch POS và Folio đã khớp hoàn hảo!
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {discrepancies.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 sm:p-5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {d.transactionId || 'N/A'}
                        </span>
                        <span className="text-xs font-semibold text-white">{d.cabinNumber}</span>
                        <span className="text-xs text-slate-400">({d.passengerName || 'Khách'})</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.discrepancyType === 'AMOUNT_MISMATCH'
                              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                              : d.discrepancyType === 'DUPLICATE_SUSPECT'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {d.discrepancyType}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-300 pt-0.5">
                        <span>POS: <strong className="font-mono text-amber-400">${d.posAmount || 0}</strong></span>
                        <span>Folio: <strong className="font-mono text-emerald-400">${d.folioAmount || 0}</strong></span>
                        <span>Chênh lệch: <strong className="font-mono text-rose-400">${d.variance}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedDiscrepancy(d);
                          setIsInspectorOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        Soi Đối Soát
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DiscrepancyInspectorModal
            isOpen={isInspectorOpen}
            onClose={() => setIsInspectorOpen(false)}
            record={selectedDiscrepancy}
            onResolve={handleResolveDiscrepancy}
          />
        </div>
      )}

      {/* TAB 4: DISPUTE MANAGEMENT WORKSPACE */}
      {activeTab === 'DISPUTES' && (
        <DisputeManagementWorkspace
          disputes={disputes}
          onResolveDispute={handleResolveDispute}
          isLoading={isLoadingData}
        />
      )}

      {/* TAB 5: SYNC CONTROL PANEL */}
      {activeTab === 'SYNC' && (
        <SyncControlPanel onSyncComplete={loadTransactions} />
      )}

      {/* Void / Refund Modal */}
      <ManagerVoidRefundModal
        key={`${selectedTx?.id}-${modalMode}-${isVoidRefundOpen}`}
        isOpen={isVoidRefundOpen}
        onClose={() => setIsVoidRefundOpen(false)}
        onSuccess={loadTransactions}
        transaction={selectedTx}
        mode={modalMode}
      />

      {/* Shift Summary / Z-Report Modal */}
      {activeShiftId !== null && (
        <ShiftSummaryModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          shiftId={activeShiftId}
        />
      )}

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
