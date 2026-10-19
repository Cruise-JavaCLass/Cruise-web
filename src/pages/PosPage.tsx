import { useState, useEffect } from 'react';
import {
  CreditCard,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  Receipt,
  FileQuestion,
  Search,
  Scale,
  ShieldAlert,
  Eye,
} from 'lucide-react';
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

export function PosPage() {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'RECONCILIATION' | 'DISPUTES'>('REGISTER');
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(14);
  const [searchTerm, setSearchTerm] = useState('');

  // Reconciliation State
  const [metrics, setMetrics] = useState<ReconciliationSummaryMetrics | null>(null);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyRecord[]>([]);
  const [disputes, setDisputes] = useState<DisputeCase[]>([]);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyRecord | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isRunningRecon, setIsRunningRecon] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadReconciliationData = async () => {
    setIsLoadingData(true);
    try {
      const [m, disc, disp] = await Promise.all([
        reconciliationService.getSummaryMetrics(),
        reconciliationService.getDiscrepancies(),
        reconciliationService.getDisputes(),
      ]);
      setMetrics(m);
      setDiscrepancies(disc);
      setDisputes(disp);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadReconciliationData();
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setOfflineCount(0);
      setIsSyncing(false);
    }, 1500);
  };

  const handleRunReconciliation = async () => {
    setIsRunningRecon(true);
    try {
      await reconciliationService.runReconciliation();
      await loadReconciliationData();
    } finally {
      setIsRunningRecon(false);
    }
  };

  const handleResolveDiscrepancy = async (id: number, payload: ResolveDiscrepancyPayload) => {
    await reconciliationService.resolveDiscrepancy(id, payload);
    await loadReconciliationData();
  };

  const handleResolveDispute = async (id: number, payload: ResolveDisputePayload) => {
    await reconciliationService.resolveDispute(id, payload);
    await loadReconciliationData();
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
            <CreditCard className="w-6 h-6 text-amber-400" /> Hệ Thống POS & Đối Soát Tài Chính Tàu
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ghi nhận giao dịch chi tiêu • Đối soát POS & Folio tự động • Giải quyết khiếu nại chi phí
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunReconciliation}
            disabled={isRunningRecon}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Scale className={`w-4 h-4 ${isRunningRecon ? 'animate-spin' : ''}`} />
            {isRunningRecon ? 'Đang đối soát...' : 'Chạy Đối Soát Ngay'}
          </button>

          <button
            onClick={handleSync}
            disabled={isSyncing || offlineCount === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang đồng bộ...' : `Đồng bộ ngoại tuyến (${offlineCount} Tx)`}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'REGISTER'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Quầy Thu Ngân & Giao Dịch
        </button>

        <button
          onClick={() => setActiveTab('RECONCILIATION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'RECONCILIATION'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'DISPUTES'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
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

      {/* TAB 1: POS REGISTER & TRANSACTIONS */}
      {activeTab === 'REGISTER' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-400" /> Nhật Ký Giao Dịch Thu Ngân Gần Đây
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ghi nhận chi tiêu quầy tự động chuyển vào sao kê tài khoản phòng
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo khách, cabin, mã..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{tx.id}</span>
                      <span className="text-xs text-white font-semibold">{tx.guest}</span>
                      <span className="text-xs text-slate-400">({tx.cabin})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{tx.service}</span>
                      <span>•</span>
                      <span>{tx.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold font-mono text-white">{tx.amount}</span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                        tx.status === 'Đã đồng bộ'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECONCILIATION DASHBOARD & DISCREPANCY LIST */}
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

            {discrepancies.length === 0 ? (
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

      {/* TAB 3: DISPUTE MANAGEMENT WORKSPACE */}
      {activeTab === 'DISPUTES' && (
        <DisputeManagementWorkspace
          disputes={disputes}
          onResolveDispute={handleResolveDispute}
          isLoading={isLoadingData}
        />
      )}
    </div>
  );
}
