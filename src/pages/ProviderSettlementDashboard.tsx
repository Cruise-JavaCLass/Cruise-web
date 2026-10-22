import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DollarSign,
  Users,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  fetchSettlements,
  updateSettlementStatus,
  addSettlementAdjustment,
  type SettlementDetail,
  type SettlementStatus,
  type CreateAdjustmentRequest,
} from '../services/providerSettlementService';
import { ReconciliationDetailTable } from '../components/settlement/ReconciliationDetailTable';
import { DisputeAdjustmentModal } from '../components/settlement/DisputeAdjustmentModal';

export const ProviderSettlementDashboard: React.FC = () => {
  const [settlements, setSettlements] = useState<SettlementDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementDetail | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const activeRequestIdRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    const currentRequestId = ++activeRequestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSettlements({
        status: statusFilter === 'ALL' ? undefined : (statusFilter as SettlementStatus),
        size: 100,
      });
      if (currentRequestId === activeRequestIdRef.current) {
        setSettlements(res.content || []);
      }
    } catch (err: unknown) {
      if (currentRequestId === activeRequestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách quyết toán nhà cung cấp');
      }
    } finally {
      if (currentRequestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdjustment = (settlement: SettlementDetail) => {
    setSelectedSettlement(settlement);
    setIsAdjustmentModalOpen(true);
  };

  const handleCloseAdjustment = () => {
    setSelectedSettlement(null);
    setIsAdjustmentModalOpen(false);
  };

  const handleSubmitAdjustment = async (req: CreateAdjustmentRequest) => {
    if (!selectedSettlement) return;
    await addSettlementAdjustment(selectedSettlement.id, req);
    await loadData();
  };

  const handleVerify = async (id: number) => {
    try {
      setError(null);
      await updateSettlementStatus(id, {
        targetStatus: 'PENDING_VERIFICATION',
        actor: 'SHORE_EXCURSION_MANAGER',
        note: 'Chuyển sang trạng thái chờ xác minh đối soát',
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể gửi đối soát quyết toán');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setError(null);
      await updateSettlementStatus(id, {
        targetStatus: 'APPROVED',
        actor: 'FINANCE_MANAGER',
        note: 'Phê duyệt ủy nhiệm chi & khóa sổ cái vĩnh viễn',
      });
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể phê duyệt quyết toán');
    }
  };

  // Metrics summary
  const totalAmountSum = settlements.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalActualPax = settlements.reduce((acc, s) => acc + s.actualPax, 0);
  const totalAdjustmentsSum = settlements.reduce((acc, s) => acc + s.adjustedAmount, 0);
  const pendingApprovals = settlements.filter((s) => s.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl font-bold font-display text-white tracking-wide">
            Đối Soát & Quyết Toán Chi Phí Nhà Cung Cấp Tour
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Tour Provider Financial Reconciliation & Cost Settlement Ledger (KAN-332)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b0f19] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Tổng Công Nợ Quyết Toán</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            ${totalAmountSum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {settlements.length} chuyến tour đã ghi nhận
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Khách Thực Tế Tham Gia</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300">
            {totalActualPax.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Pax</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Dựa trên điểm danh cổng/xe
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Tổng Điều Chỉnh / Phạt</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              totalAdjustmentsSum < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {totalAdjustmentsSum !== 0
              ? `${totalAdjustmentsSum > 0 ? '+' : ''}$${totalAdjustmentsSum.toFixed(2)}`
              : '$0.00'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Khấu trừ sự cố & phụ phí
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-white/5 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Chờ Duyệt Chi Trả</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {pendingApprovals} <span className="text-xs text-slate-400 font-normal">Hồ sơ</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            Cần Payout Authorization
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 bg-[#07090e] p-3 rounded-2xl border border-white/5 text-xs">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-slate-400 font-medium">Trạng thái:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">Tất Cả Trạng Thái</option>
          <option value="DRAFT">Nháp (DRAFT)</option>
          <option value="PENDING_VERIFICATION">Chờ Đối Soát (PENDING_VERIFICATION)</option>
          <option value="APPROVED">Đã Phê Duyệt (APPROVED)</option>
          <option value="PAID">Đã Thanh Toán (PAID)</option>
          <option value="RECONCILED">Đã Chốt Sổ (RECONCILED)</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          <span>Đang tải bảng đối soát tài chính...</span>
        </div>
      ) : (
        <ReconciliationDetailTable
          settlements={settlements}
          onOpenAdjustment={handleOpenAdjustment}
          onApprove={handleApprove}
          onVerify={handleVerify}
        />
      )}

      {/* Dispute Modal */}
      {selectedSettlement && (
        <DisputeAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={handleCloseAdjustment}
          onSubmit={handleSubmitAdjustment}
          settlementTitle={selectedSettlement.excursionTitle}
        />
      )}
    </div>
  );
};
