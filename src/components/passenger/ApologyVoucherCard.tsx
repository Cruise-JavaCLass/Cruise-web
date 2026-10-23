import React, { useState } from 'react';
import {
  Gift,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { ServiceRecoveryObcVoucher, ClaimObcVoucherResponse } from '../../services/serviceRecoveryTypes';
import { serviceRecoveryService } from '../../services/serviceRecoveryService';

interface ApologyVoucherCardProps {
  voucher: ServiceRecoveryObcVoucher;
  onVoucherClaimed?: (response: ClaimObcVoucherResponse) => void;
}

export const ApologyVoucherCard: React.FC<ApologyVoucherCardProps> = ({
  voucher,
  onVoucherClaimed,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimObcVoucherResponse | null>(null);

  const handleClaim = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await serviceRecoveryService.claimVoucher(voucher.voucherCode);
      setClaimResult(res);
      if (onVoucherClaimed) {
        onVoucherClaimed(res);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to claim voucher');
    } finally {
      setLoading(false);
    }
  };

  const isClaimed = voucher.status === 'CLAIMED_TO_FOLIO' || claimResult !== null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 rounded-2xl border border-indigo-200/80 p-5 shadow-sm space-y-4 text-xs">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
              Service Recovery Apology
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{voucher.apologyTitle}</h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-extrabold text-indigo-600 block">
            ${Number(voucher.creditAmount).toFixed(2)}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Onboard Credit</span>
        </div>
      </div>

      {/* Apology Body */}
      <div className="p-3.5 bg-white/80 rounded-xl border border-slate-200/80 text-slate-700 leading-relaxed font-sans italic text-[11px]">
        "{voucher.apologyLetterBody}"
      </div>

      {/* Metadata & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1 border-t border-indigo-100">
        <div>
          <span>Authorized by: </span>
          <strong className="text-slate-800">{voucher.authorizedBy}</strong>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Expires: {new Date(voucher.expiresAt).toLocaleDateString()}</span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-[11px]">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Claim / Success state */}
      {isClaimed ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>
              Applied to Cabin {claimResult ? claimResult.cabinNumber : voucher.cabinNumber} Folio
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-600 font-bold">
            {claimResult?.folioTransactionId || voucher.folioTransactionId || 'CREDITED'}
          </span>
        </div>
      ) : (
        <button
          onClick={handleClaim}
          disabled={
            loading ||
            !['ISSUED', 'ACCEPTED'].includes(voucher.status) ||
            new Date(voucher.expiresAt).getTime() < Date.now()
          }
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Crediting Cabin Folio...' : 'Accept Apology & Claim $ ' + Number(voucher.creditAmount).toFixed(2) + ' OBC'}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      )}
    </div>
  );
};
