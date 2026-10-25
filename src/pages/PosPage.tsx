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
  Layers,
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
import { OfflineStatusBadge } from '../components/pos/OfflineStatusBadge';
import { PendingQueueInspectorModal } from '../components/pos/PendingQueueInspectorModal';

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
  const [isQueueInspectorOpen, setIsQueueInspectorOpen] = useState(false);
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
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-[#D9FF43] text-[#171717]">
            Hoàn Tất
          </span>
        );
      case 'VOIDED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-[#DC2626] text-white">
            Đã Hủy (Void)
          </span>
        );
      case 'PARTIALLY_REFUNDED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-amber-400 text-[#171717]">
            Hoàn Một Phần
          </span>
        );
      case 'FULLY_REFUNDED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-[#3155E7] text-white">
            Hoàn Toàn Phần
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-[#171717] bg-[#E7E4DC] text-[#171717]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header — Editorial Cash Register Broadside */}
      <div className="neo-card bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[6px_6px_0px_#171717]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-display font-black text-[#171717] flex items-center gap-2.5 uppercase tracking-tight">
              <CreditCard className="w-6 h-6 text-[#3155E7]" /> Hệ Thống POS & Tài Khoản Phi Tiền Mặt
            </h2>
            <span className="neo-badge bg-[#D9FF43] text-[#171717] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#171717]" /> Đã kết nối máy chủ
            </span>
          </div>
          <p className="text-xs sm:text-sm font-mono text-[#171717]/70 mt-1">
            Giao dịch không tiền mặt (Cashless Folio) • Đối soát POS & Folio tự động • Hủy trong ca & Giải quyết khiếu nại
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <OfflineStatusBadge onOpenInspector={() => setIsQueueInspectorOpen(true)} />
          <button
            onClick={handleRunReconciliation}
            disabled={isRunningRecon}
            className="neo-btn neo-btn-primary py-2 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Scale className={`w-4 h-4 ${isRunningRecon ? 'animate-spin' : ''}`} />
            {isRunningRecon ? 'Đang đối soát...' : 'Chạy Đối Soát Ngay'}
          </button>

          <button
            onClick={() => setIsShiftModalOpen(true)}
            disabled={!activeShiftId || isLoadingShift}
            title={!activeShiftId ? 'Chưa có ca làm việc đang mở' : 'Xem báo cáo ca'}
            className="neo-btn neo-btn-acid py-2 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" /> Báo Cáo Ca (X/Z Report)
          </button>

          <button
            onClick={handleSyncOffline}
            disabled={isSyncing}
            className="neo-btn neo-btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}
          </button>
        </div>
      </div>

      {syncMessage && (
        <div
          className={`p-4 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] text-xs font-mono font-bold flex items-center gap-2 ${
            syncMessage.isError
              ? 'bg-[#DC2626] text-white'
              : 'bg-[#D9FF43] text-[#171717]'
          }`}
        >
          {syncMessage.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D9FF43]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#171717]" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs — Neo-Brutalist Strip */}
      <div className="flex flex-wrap gap-2 pb-2 border-b-2 border-[#171717]">
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`px-4 py-2.5 text-xs font-mono font-bold border-2 border-[#171717] transition-all flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 ${
            activeTab === 'REGISTER'
              ? 'bg-[#3155E7] text-white shadow-[3px_3px_0px_#171717]'
              : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Quầy Bán Hàng (POS Register)</span>
          <span className="sr-only">Quầy Thu Ngân & Giao Dịch</span>
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2.5 text-xs font-mono font-bold border-2 border-[#171717] transition-all flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 ${
            activeTab === 'LEDGER'
              ? 'bg-[#3155E7] text-white shadow-[3px_3px_0px_#171717]'
              : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
          }`}
        >
          <ListFilter className="w-4 h-4" /> Sổ Cái Giao Dịch & Quản Lý (Ledger)
        </button>

        <button
          onClick={() => setActiveTab('CATALOG')}
          className={`px-4 py-2.5 text-xs font-mono font-bold border-2 border-[#171717] transition-all flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 ${
            activeTab === 'CATALOG'
              ? 'bg-[#3155E7] text-white shadow-[3px_3px_0px_#171717]'
              : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
          }`}
        >
          <Layers className="w-4 h-4" /> Quản Lý Danh Mục & Giá (Catalog)
        </button>

        <button
          onClick={() => setActiveTab('RECONCILIATION')}
          className={`px-4 py-2.5 text-xs font-mono font-bold border-2 border-[#171717] transition-all flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 ${
            activeTab === 'RECONCILIATION'
              ? 'bg-[#3155E7] text-white shadow-[3px_3px_0px_#171717]'
              : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
          }`}
        >
          <Scale className="w-4 h-4" />
          Trung Tâm Đối Soát (Reconciliation)
          {discrepancies.length > 0 && (
            <span className="px-1.5 py-0.2 border border-[#171717] text-[10px] bg-[#DC2626] text-white font-bold">
              {discrepancies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DISPUTES')}
          className={`px-4 py-2.5 text-xs font-mono font-bold border-2 border-[#171717] transition-all flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 ${
            activeTab === 'DISPUTES'
              ? 'bg-[#3155E7] text-white shadow-[3px_3px_0px_#171717]'
              : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Hồ Sơ Khiếu Nại Chi Phí (Disputes)
          {disputes.filter((d) => d.status === 'SUBMITTED').length > 0 && (
            <span className="px-1.5 py-0.2 border border-[#171717] text-[10px] bg-[#D9FF43] text-[#171717] font-black">
              {disputes.filter((d) => d.status === 'SUBMITTED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SYNC')}
          className={`px-4 py-2.5 text-xs font-mono font-bold border-2 border-[#171717] transition-all flex items-center gap-2 active:translate-x-0.5 active:translate-y-0.5 ${
            activeTab === 'SYNC'
              ? 'bg-[#3155E7] text-white shadow-[3px_3px_0px_#171717]'
              : 'bg-white text-[#171717] hover:bg-[#E7E4DC]'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Bảng Điều Khiển Đồng Bộ (Sync Center)</span>
        </button>
      </div>

      {/* KPI Stats Bar — Neo-Brutalist Financial Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="neo-card bg-white p-5">
            <div className="flex items-center justify-between text-[#171717]/70 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Doanh thu đã đối soát</span>
              <div className="w-8 h-8 bg-[#D9FF43] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-display font-black text-[#171717]">
              ${metrics.totalReconciledAmount.toLocaleString()} USD
            </p>
            <span className="text-[10px] font-mono font-bold text-[#3155E7] mt-1 block">Khớp 100% giữa POS & Folio</span>
          </div>

          <div className="neo-card bg-white p-5">
            <div className="flex items-center justify-between text-[#171717]/70 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Tỷ lệ sai lệch</span>
              <div className="w-8 h-8 bg-[#E7E4DC] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-[#171717]">
                <Scale className="w-4 h-4 text-[#3155E7]" />
              </div>
            </div>
            <p className="text-2xl font-display font-black text-[#3155E7]">
              {metrics.discrepancyRatePercent}%
            </p>
            <span className="text-[10px] font-mono text-[#171717]/60 mt-1 block">Ngưỡng cảnh báo: 0.5%</span>
          </div>

          <div className="neo-card bg-white p-5">
            <div className="flex items-center justify-between text-[#171717]/70 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Sai lệch cần xử lý</span>
              <div className="w-8 h-8 bg-[#DC2626] text-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-[#D9FF43]" />
              </div>
            </div>
            <p className="text-2xl font-display font-black text-[#DC2626]">
              {metrics.pendingDiscrepanciesCount} Bản ghi
            </p>
            <span className="text-[10px] font-mono text-[#171717]/70 mt-1 block">Chênh lệch ${metrics.totalVarianceAmount} USD</span>
          </div>

          <div className="neo-card bg-white p-5">
            <div className="flex items-center justify-between text-[#171717]/70 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Khiếu nại đang chờ</span>
              <div className="w-8 h-8 bg-[#171717] text-[#D9FF43] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center">
                <FileQuestion className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-display font-black text-[#171717]">
              {metrics.openDisputesCount} Hồ sơ
            </p>
            <span className="text-[10px] font-mono text-[#171717]/70 mt-1 block font-bold">Đang tranh chấp: ${metrics.totalDisputedAmount} USD</span>
          </div>
        </div>
      )}

      {/* Emergency Alert Banner if Active */}
      {metrics?.criticalAlertActive && (
        <div className="p-4 bg-[#DC2626] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] text-white text-xs font-mono font-bold flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-[#D9FF43]" />
            <span>{metrics.alertMessage}</span>
          </div>
          <button
            onClick={() => setActiveTab('RECONCILIATION')}
            className="px-3 py-1.5 bg-[#D9FF43] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-bold text-[11px] uppercase transition-all active:translate-x-0.5 active:translate-y-0.5"
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
            <div className="p-4 bg-[#DC2626] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] text-white text-xs font-mono font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D9FF43]" />
                <span>{ledgerError}</span>
              </div>
              <button
                onClick={loadTransactions}
                className="px-3 py-1 bg-white text-[#171717] border border-[#171717] font-bold uppercase"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="neo-card bg-white p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#171717]/60 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã UUID, số cabin, tên khách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="neo-input w-full pl-9 pr-3 py-2 text-xs bg-[#F7F5F0]"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-2 px-3"
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
                className="neo-input font-mono font-bold text-xs bg-[#F7F5F0] py-2 px-3"
              >
                <option value="ALL">Mọi phương thức</option>
                <option value="CABIN_FOLIO">Tài Khoản Phòng</option>
                <option value="CREDIT_CARD">Thẻ Tín Dụng</option>
                <option value="CASH">Tiền Mặt</option>
              </select>

              <button
                onClick={loadTransactions}
                disabled={isLoadingLedger}
                className="w-9 h-9 bg-white hover:bg-[#E7E4DC] text-[#171717] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-all active:translate-x-0.5 active:translate-y-0.5"
                title="Tải lại sổ cái"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingLedger ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="neo-card bg-white overflow-hidden shadow-[6px_6px_0px_#171717]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#E7E4DC] text-[10px] uppercase font-bold text-[#171717] border-b-2 border-[#171717]">
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
                <tbody className="divide-y-2 divide-[#171717] bg-white text-[#171717]">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-[#171717]/60 font-bold">
                        {isLoadingLedger ? 'Đang tải dữ liệu...' : 'Không tìm thấy giao dịch nào.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F7F5F0] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono font-bold text-[#3155E7]">{tx.transactionUuid}</p>
                          <p className="text-[10px] text-[#171717]/60">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleString('vi-VN') : 'N/A'} • {tx.stationId}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-[#171717]">{tx.guestName || 'Khách Vãng Lai'}</p>
                          <p className="text-[11px] text-[#171717]/70 font-mono font-semibold">{tx.cabinNumber || 'N/A'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold">{tx.paymentMethod}</span>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                        <td className="px-4 py-3 text-right font-black text-sm text-[#171717]">
                          ${tx.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#DC2626]">
                          {tx.refundedAmount > 0 ? `-$${tx.refundedAmount.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.settled ? (
                            <span className="text-[10px] px-2 py-0.5 border border-[#171717] bg-[#E7E4DC] font-bold">
                              Đã Chốt
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 border border-[#171717] bg-[#D9FF43] text-[#171717] font-bold">
                              Chưa Chốt
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          {/* Receipt button */}
                          <button
                            onClick={() => handleOpenReceipt(tx)}
                            className="p-1.5 bg-white hover:bg-[#E7E4DC] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] active:translate-x-0.5 active:translate-y-0.5"
                            title="Xem hóa đơn điện tử"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Void button: Only for unsettled COMPLETED transactions */}
                          {tx.status === 'COMPLETED' && !tx.settled && (
                            <button
                              onClick={() => handleOpenVoid(tx)}
                              className="px-2.5 py-1 bg-[#DC2626] text-white border border-[#171717] shadow-[1px_1px_0px_#171717] text-[10px] font-mono font-bold uppercase active:translate-x-0.5 active:translate-y-0.5"
                            >
                              Hủy (Void)
                            </button>
                          )}

                          {/* Refund button: Available if COMPLETED or PARTIALLY_REFUNDED and remaining > 0 */}
                          {(tx.status === 'COMPLETED' || tx.status === 'PARTIALLY_REFUNDED') &&
                            (tx.remainingRefundableAmount ?? tx.totalAmount - (tx.refundedAmount || 0)) > 0 && (
                              <button
                                onClick={() => handleOpenRefund(tx)}
                                className="px-2.5 py-1 bg-[#D9FF43] text-[#171717] border border-[#171717] shadow-[1px_1px_0px_#171717] text-[10px] font-mono font-bold uppercase active:translate-x-0.5 active:translate-y-0.5"
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
          <div className="neo-card bg-white overflow-hidden shadow-[6px_6px_0px_#171717]">
            <div className="p-5 border-b-2 border-[#171717] flex items-center justify-between bg-[#E7E4DC]">
              <div>
                <h3 className="text-base font-display font-black text-[#171717] uppercase flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#3155E7]" /> Bảng Sai Lệch Đối Soát Giao Dịch (Discrepancy Inspector)
                </h3>
                <p className="text-xs font-mono text-[#171717]/70 mt-0.5">
                  Phát hiện sai lệch giữa bản ghi POS và Sổ cái Cabin Folio
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-[#171717]">
                {discrepancies.length} Bản ghi cần tra soát
              </span>
            </div>

            {loadError ? (
              <div className="p-12 text-center space-y-3">
                <div className="text-[#DC2626] text-xs font-mono font-bold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadReconciliationData()}
                  className="neo-btn neo-btn-secondary inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              </div>
            ) : discrepancies.length === 0 ? (
              <div className="p-12 text-center text-[#171717]/70 font-mono text-xs">
                Không phát hiện sai lệch nào. Toàn bộ giao dịch POS và Folio đã khớp hoàn hảo!
              </div>
            ) : (
              <div className="divide-y-2 divide-[#171717]">
                {discrepancies.map((d) => (
                  <div
                    key={d.id}
                    className="p-5 hover:bg-[#F7F5F0] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold text-[#3155E7]">
                          {d.transactionId || 'N/A'}
                        </span>
                        <span className="text-xs font-bold text-[#171717]">{d.cabinNumber}</span>
                        <span className="text-xs text-[#171717]/60">({d.passengerName || 'Khách'})</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold border border-[#171717] ${
                            d.discrepancyType === 'AMOUNT_MISMATCH'
                              ? 'bg-amber-300 text-[#171717]'
                              : d.discrepancyType === 'DUPLICATE_SUSPECT'
                              ? 'bg-[#DC2626] text-white'
                              : 'bg-[#3155E7] text-white'
                          }`}
                        >
                          {d.discrepancyType}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono text-[#171717] pt-0.5">
                        <span>POS: <strong className="font-bold text-amber-700">${d.posAmount || 0}</strong></span>
                        <span>Folio: <strong className="font-bold text-[#3155E7]">${d.folioAmount || 0}</strong></span>
                        <span>Chênh lệch: <strong className="font-bold text-[#DC2626]">${d.variance}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedDiscrepancy(d);
                          setIsInspectorOpen(true);
                        }}
                        className="neo-btn neo-btn-primary py-1.5 px-3 text-xs inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
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

      {/* Offline Queue Inspector Modal */}
      <PendingQueueInspectorModal
        isOpen={isQueueInspectorOpen}
        onClose={() => setIsQueueInspectorOpen(false)}
      />
    </div>
  );
}

export default PosPage;
