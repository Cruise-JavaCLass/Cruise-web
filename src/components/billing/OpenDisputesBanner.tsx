import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { SettlementPreview } from '../../services/settlementService';

interface OpenDisputesBannerProps {
  preview: SettlementPreview | null;
  canForceWithHold: boolean;
  forceWithHold: boolean;
  onForceWithHoldChange: (checked: boolean) => void;
}

const formatCurrency = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const OpenDisputesBanner: React.FC<OpenDisputesBannerProps> = ({
  preview,
  canForceWithHold,
  forceWithHold,
  onForceWithHoldChange,
}) => {
  if (!preview || preview.openDisputeCount <= 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-xs flex items-start gap-3"
    >
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
      <div className="space-y-2">
        <p className="font-semibold text-amber-300">
          Có {preview.openDisputeCount} khiếu nại đang mở cho cabin {preview.cabinNumber}
        </p>
        <p className="text-amber-200/80">
          Số tiền đang giữ: {formatCurrency(preview.heldDisputeAmount, preview.currency)}. Vui lòng xử
          lý khiếu nại trước khi tất toán.
        </p>
        {canForceWithHold && (
          <label className="flex items-start gap-2 cursor-pointer select-none text-amber-100">
            <input
              type="checkbox"
              className="mt-0.5 accent-amber-400"
              checked={forceWithHold}
              onChange={(event) => onForceWithHoldChange(event.target.checked)}
            />
            <span>Giữ lại khoản khiếu nại và tiếp tục tất toán</span>
          </label>
        )}
      </div>
    </div>
  );
};
