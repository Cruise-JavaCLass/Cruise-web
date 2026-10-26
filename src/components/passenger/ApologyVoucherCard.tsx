import React, { useState, useEffect, useRef } from 'react';
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
  const currentVoucherIdRef = useRef(voucher.id);

  useEffect(() => {
    currentVoucherIdRef.current = voucher.id;
    setClaimResult(null);
    setError(null);
    setLoading(false);
  }, [voucher.id]);

  const handleClaim = async () => {
    const initiatedId = voucher.id;
    try {
      setLoading(true);
      setError(null);
      const res = await serviceRecoveryService.claimVoucher(voucher.voucherCode);
      if (currentVoucherIdRef.current !== initiatedId) {
        return;
      }
      setClaimResult(res);
      if (onVoucherClaimed) {
        onVoucherClaimed(res);
      }
    } catch (err: unknown) {
      if (currentVoucherIdRef.current === initiatedId) {
        setError(err instanceof Error ? err.message : 'Failed to claim voucher');
      }
    } finally {
      if (currentVoucherIdRef.current === initiatedId) {
        setLoading(false);
      }
    }
  };

  const isClaimed = voucher.status === 'CLAIMED_TO_FOLIO' || claimResult !== null;

  return (
    <div className="bg-gradient-to-br from-[#F7F4ED] via-white to-[#F7F4ED] rounded-2xl border border-[#C5A572]/50 p-5 shadow-sm space-y-4 text-xs text-[#252B32]">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#102A43] text-white rounded-xl shadow-xs">
            <Gift className="w-5 h-5 text-[#C5A572]" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E7A3E] bg-[#C5A572]/15 border border-[#C5A572]/30 px-2.5 py-0.5 rounded-full">
              Service Recovery Apology
            </span>
            <h3 className="text-sm font-bold text-[#102A43] mt-0.5">{voucher.apologyTitle}</h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xl font-bold font-mono text-[#397C80] block">
            ${Number(voucher.creditAmount).toFixed(2)}
          </span>
          <span className="text-[10px] font-semibold text-[#5A6B7C] uppercase">Onboard Credit</span>
        </div>
      </div>

      {/* Apology Body */}
      <div className="p-3.5 bg-white rounded-xl border border-[#E5E0D7] text-[#5A6B7C] leading-relaxed font-sans italic text-[11px]">
        "{voucher.apologyLetterBody}"
      </div>

      {/* Metadata & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5A6B7C] pt-1 border-t border-[#E5E0D7]">
        <div>
          <span>Authorized by: </span>
          <strong className="text-[#102A43] font-semibold">{voucher.authorizedBy}</strong>
        </div>
        <div className="flex items-center gap-1 text-[#5A6B7C]">
          <Clock className="w-3.5 h-3.5 text-[#397C80]" />
          <span>Expires: {new Date(voucher.expiresAt).toLocaleDateString()}</span>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-[11px] font-medium">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Claim / Success state */}
      {isClaimed ? (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px] flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 text-[#397C80]" />
            <span>
              Applied to Cabin {claimResult ? claimResult.cabinNumber : voucher.cabinNumber} Folio
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#397C80] font-bold">
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
          className="w-full py-2.5 px-4 bg-[#102A43] hover:bg-[#0B1F33] text-white font-semibold rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#C5A572]" />
          {loading ? 'Crediting Cabin Folio...' : 'Accept Apology & Claim $ ' + Number(voucher.creditAmount).toFixed(2) + ' OBC'}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      )}
    </div>
  );
};
