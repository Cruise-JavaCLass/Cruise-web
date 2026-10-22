import React, { useState } from 'react';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import type { SettlementDetail, SettlementStatus } from '../../services/providerSettlementService';

interface PayoutApprovalButtonProps {
  settlement: SettlementDetail;
  onApprove: (id: number) => Promise<void>;
}

export const PayoutApprovalButton: React.FC<PayoutApprovalButtonProps> = ({
  settlement,
  onApprove,
}) => {
  const [approving, setApproving] = useState(false);
  const isLocked =
    settlement.status === 'APPROVED' ||
    settlement.status === 'PAID' ||
    settlement.status === 'RECONCILED';

  if (isLocked) {
    return (
      <span
        data-testid="locked-ledger-badge"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
      >
        <Lock className="w-3.5 h-3.5 text-emerald-400" />
        Sổ Cái Đã Khóa ({settlement.status})
      </span>
    );
  }

  const handleApprove = async () => {
    const confirmed = window.confirm(
      `Xác nhận phê duyệt ủy nhiệm chi ${settlement.totalAmount} ${settlement.currency} cho nhà cung cấp ${settlement.providerName}? Sau khi duyệt, hóa đơn sẽ bị khóa vĩnh viễn.`
    );
    if (!confirmed) return;

    try {
      setApproving(true);
      await onApprove(settlement.id);
    } finally {
      setApproving(false);
    }
  };

  return (
    <button
      onClick={handleApprove}
      disabled={approving || settlement.status === 'DRAFT'}
      title={
        settlement.status === 'DRAFT'
          ? 'Cần chuyển sang Trạng thái PENDING_VERIFICATION trước khi phê duyệt'
          : 'Phê duyệt chi trả và khóa sổ cái'
      }
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
        settlement.status === 'DRAFT'
          ? 'bg-white/5 text-slate-500 cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
      }`}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      {approving ? 'Đang duyệt...' : 'Phê Duyệt Chi Trả'}
    </button>
  );
};
