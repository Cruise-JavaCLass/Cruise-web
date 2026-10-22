import React from 'react';
import { AlertCircle, Clock, CheckCircle2, DollarSign, PlusCircle } from 'lucide-react';
import type { SettlementDetail } from '../../services/providerSettlementService';
import { PayoutApprovalButton } from './PayoutApprovalButton';

interface ReconciliationDetailTableProps {
  settlements: SettlementDetail[];
  onOpenAdjustment: (settlement: SettlementDetail) => void;
  onApprove: (id: number) => Promise<void>;
  onVerify: (id: number) => Promise<void>;
}

export const ReconciliationDetailTable: React.FC<ReconciliationDetailTableProps> = ({
  settlements,
  onOpenAdjustment,
  onApprove,
  onVerify,
}) => {
  if (settlements.length === 0) {
    return (
      <div className="p-8 text-center bg-[#07090e] border border-white/5 rounded-2xl text-slate-400 text-xs">
        Chưa có bản ghi quyết toán nào phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  const renderStatusBadge = (status: SettlementDetail['status']) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">
            DRAFT
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-amber-400" />
            PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            APPROVED
          </span>
        );
      case 'PAID':
      case 'RECONCILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 w-fit">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#07090e]">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
          <tr>
            <th className="py-3 px-4">Tour & Cảng Dừng</th>
            <th className="py-3 px-4">Nhà Cung Cấp</th>
            <th className="py-3 px-4 text-center">Khách ĐK</th>
            <th className="py-3 px-4 text-center">Điểm Danh</th>
            <th className="py-3 px-4 text-center">Cam Kết Min</th>
            <th className="py-3 px-4 text-center">Tính Tiền (Pax)</th>
            <th className="py-3 px-4 text-right">Đơn Giá</th>
            <th className="py-3 px-4 text-right">Điều Chỉnh</th>
            <th className="py-3 px-4 text-right">Tổng Quyết Toán</th>
            <th className="py-3 px-4 text-center">Trạng Thái</th>
            <th className="py-3 px-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {settlements.map((s) => {
            const isLocked = s.status === 'APPROVED' || s.status === 'PAID' || s.status === 'RECONCILED';
            return (
              <tr key={s.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-100">{s.excursionTitle}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {s.portName || 'Port N/A'} • Voyage #{s.voyageId}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-200">
                  <span className="font-medium">{s.providerName}</span>
                </td>
                <td className="py-3 px-4 text-center font-mono text-slate-300">{s.registeredPax}</td>
                <td className="py-3 px-4 text-center font-mono text-cyan-300 font-semibold">{s.actualPax}</td>
                <td className="py-3 px-4 text-center font-mono text-slate-400">{s.minGuaranteePax}</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">
                  {s.billablePax}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-300">
                  ${s.agreedUnitRate.toFixed(2)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono ${
                    s.adjustedAmount < 0
                      ? 'text-rose-400'
                      : s.adjustedAmount > 0
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  {s.adjustedAmount !== 0 ? (s.adjustedAmount > 0 ? `+$${s.adjustedAmount.toFixed(2)}` : `-$${Math.abs(s.adjustedAmount).toFixed(2)}`) : '$0.00'}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                  ${s.totalAmount.toFixed(2)} {s.currency}
                </td>
                <td className="py-3 px-4 text-center">{renderStatusBadge(s.status)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {s.status === 'DRAFT' && (
                      <button
                        onClick={() => onVerify(s.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs border border-amber-500/20"
                      >
                        Gửi Đối Soát
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        onClick={() => onOpenAdjustment(s)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs border border-white/10 flex items-center gap-1"
                        title="Thêm khấu trừ hoặc bồi thường"
                      >
                        <PlusCircle className="w-3 h-3 text-cyan-400" />
                        Điều Chỉnh
                      </button>
                    )}

                    <PayoutApprovalButton settlement={s} onApprove={onApprove} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
