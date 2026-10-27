import React from 'react';
import { useState } from 'react';
import { Clock, CheckCircle2, DollarSign, PlusCircle } from 'lucide-react';
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
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  if (settlements.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-[#E5E0D7] rounded-xl text-[#687787] text-xs font-medium">
        Chưa có bản ghi quyết toán nào phù hợp với bộ lọc hiện tại.
      </div>
    );
  }

  const renderStatusBadge = (status: SettlementDetail['status']) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#F7F4ED] text-[#687787] border border-[#E5E0D7]">
            DRAFT
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20 flex items-center gap-1 w-fit font-bold">
            <CheckCircle2 className="w-3 h-3 text-[#102A43]" />
            APPROVED
          </span>
        );
      case 'PAID':
      case 'RECONCILED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit font-bold">
            <DollarSign className="w-3 h-3 text-emerald-700" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E0D7] bg-white shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#F7F4ED] border-b border-[#E5E0D7] text-[#687787] uppercase text-[10px] font-semibold tracking-wider">
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
        <tbody className="divide-y divide-[#E5E0D7]">
          {settlements.map((s) => {
            const isLocked = s.status === 'APPROVED' || s.status === 'PAID' || s.status === 'RECONCILED';
            return (
              <tr key={s.id} className="hover:bg-[#F7F4ED]/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-[#102A43]">{s.excursionTitle}</div>
                  <div className="text-[11px] text-[#687787]">
                    {s.portName || 'Port N/A'} • Voyage #{s.voyageId}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#252B32]">
                  <span className="font-semibold">{s.providerName}</span>
                </td>
                <td className="py-3 px-4 text-center font-mono text-[#687787]">{s.registeredPax}</td>
                <td className="py-3 px-4 text-center font-mono text-[#102A43] font-bold">{s.actualPax}</td>
                <td className="py-3 px-4 text-center font-mono text-[#687787]">{s.minGuaranteePax}</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                  {s.billablePax}
                </td>
                <td className="py-3 px-4 text-right font-mono text-[#252B32]">
                  ${s.agreedUnitRate.toFixed(2)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono font-medium ${
                    s.adjustedAmount < 0
                      ? 'text-rose-700'
                      : s.adjustedAmount > 0
                      ? 'text-emerald-700'
                      : 'text-[#687787]'
                  }`}
                >
                  {s.adjustedAmount !== 0 ? (s.adjustedAmount > 0 ? `+$${s.adjustedAmount.toFixed(2)}` : `-$${Math.abs(s.adjustedAmount).toFixed(2)}`) : '$0.00'}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-[#102A43] text-sm">
                  ${s.totalAmount.toFixed(2)} {s.currency}
                </td>
                <td className="py-3 px-4 text-center">{renderStatusBadge(s.status)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {s.status === 'DRAFT' && (
                      <button
                        disabled={verifyingId === s.id}
                        onClick={async () => {
                          try {
                            setVerifyingId(s.id);
                            await onVerify(s.id);
                          } catch (err) {
                            console.error('Lỗi khi gửi đối soát:', err);
                          } finally {
                            setVerifyingId(null);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed text-amber-800 text-xs font-semibold border border-amber-200 transition-colors cursor-pointer"
                      >
                        {verifyingId === s.id ? 'Đang gửi...' : 'Gửi Đối Soát'}
                      </button>
                    )}

                    {!isLocked && (
                      <button
                        onClick={() => onOpenAdjustment(s)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F7F4ED] text-[#102A43] text-xs font-semibold border border-[#E5E0D7] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        title="Thêm khấu trừ hoặc bồi thường"
                      >
                        <PlusCircle className="w-3 h-3 text-[#102A43]" />
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
