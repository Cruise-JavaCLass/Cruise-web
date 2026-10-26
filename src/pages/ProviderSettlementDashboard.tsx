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
  const filterRef = useRef(statusFilter);
  const requestIdRef = useRef(0);

  useEffect(() => {
    filterRef.current = statusFilter;
  }, [statusFilter]);

  const loadData = useCallback(async (filterOverride?: string) => {
    const activeFilter = filterOverride ?? filterRef.current;
    const currentRequestId = ++requestIdRef.current;
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSettlements({
        status: activeFilter === 'ALL' ? undefined : (activeFilter as SettlementStatus),
        size: 100,
      });
      if (currentRequestId === requestIdRef.current) {
        setSettlements(res.content || []);
      }
    } catch (err: unknown) {
      if (currentRequestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách quyết toán nhà cung cấp');
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter, loadData]);

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

  // Metrics summary grouped by currency
  const amountsByCurrency = settlements.reduce<Record<string, number>>((acc, s) => {
    const curr = s.currency || 'USD';
    acc[curr] = (acc[curr] || 0) + s.totalAmount;
    return acc;
  }, {});

  const adjustmentsByCurrency = settlements.reduce<Record<string, number>>((acc, s) => {
    const curr = s.currency || 'USD';
    acc[curr] = (acc[curr] || 0) + s.adjustedAmount;
    return acc;
  }, {});

  const totalActualPax = settlements.reduce((acc, s) => acc + s.actualPax, 0);
  const pendingApprovals = settlements.filter((s) => s.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="space-y-6">
      {/* Header — Luxury Maritime */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/40 tracking-wider">
              PROVIDER AUDIT
            </span>
            <span className="text-[11px] font-medium text-[#687787]">• FINANCIAL RECONCILIATION</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43] tracking-tight">
            Đối Soát & Quyết Toán Chi Phí Nhà Cung Cấp Tour
          </h1>
          <p className="text-xs text-[#687787] mt-1">
            Tour Provider Financial Reconciliation & Cost Settlement Ledger (KAN-332)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="py-2 px-3 text-xs font-semibold bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#102A43]' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase tracking-wider mb-2">
            <span>Tổng Công Nợ Quyết Toán</span>
            <DollarSign className="w-4 h-4 text-[#102A43]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#102A43]">
            {Object.keys(amountsByCurrency).length > 0 ? (
              <div className="flex flex-col gap-1">
                {Object.entries(amountsByCurrency).map(([curr, amt]) => (
                  <span key={curr}>
                    {amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} {curr}
                  </span>
                ))}
              </div>
            ) : (
              '0.00 USD'
            )}
          </div>
          <div className="text-[10px] text-[#687787] mt-1">
            {settlements.length} chuyến tour đã ghi nhận
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase tracking-wider mb-2">
            <span>Khách Thực Tế Tham Gia</span>
            <Users className="w-4 h-4 text-[#102A43]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#102A43]">
            {totalActualPax.toLocaleString()} <span className="text-xs font-medium text-[#687787]">Pax</span>
          </div>
          <div className="text-[10px] text-[#687787] mt-1">
            Dựa trên điểm danh cổng/xe
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase tracking-wider mb-2">
            <span>Tổng Điều Chỉnh / Phạt</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold">
            {Object.keys(adjustmentsByCurrency).length > 0 ? (
              <div className="flex flex-col gap-1">
                {Object.entries(adjustmentsByCurrency).map(([curr, amt]) => (
                  <span key={curr} className={amt < 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {amt !== 0 ? `${amt > 0 ? '+' : ''}${amt.toFixed(2)}` : '0.00'} {curr}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#102A43]">0.00 USD</span>
            )}
          </div>
          <div className="text-[10px] text-[#687787] mt-1">
            Khấu trừ sự cố & phụ phí
          </div>
        </div>

        <div className="bg-white border border-[#E5E0D7] rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-[#687787] text-[10px] font-semibold uppercase tracking-wider mb-2">
            <span>Chờ Duyệt Chi Trả</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700">
            {pendingApprovals} <span className="text-xs font-medium text-[#687787]">Hồ sơ</span>
          </div>
          <div className="text-[10px] text-[#687787] mt-1">
            Cần Payout Authorization
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E0D7] rounded-xl p-4 flex items-center gap-3 shadow-xs">
        <Filter className="w-4 h-4 text-[#102A43]" />
        <span className="text-[#252B32] font-semibold text-xs uppercase tracking-wider">Trạng thái:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg text-xs font-semibold p-2 text-[#252B32] focus:outline-none focus:border-[#102A43]"
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button
            onClick={() => loadData()}
            className="px-3 py-1 bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-md font-semibold cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Main Table */}
      {loading ? (
        <div className="p-12 text-center text-xs font-medium text-[#687787] flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#102A43]" />
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
          currency={selectedSettlement.currency}
        />
      )}
    </div>
  );
};
export default ProviderSettlementDashboard;
