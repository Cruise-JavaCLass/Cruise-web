import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Check,
  X,
  Lock,
  Divide,
  AlertCircle,
  UserCheck,
} from 'lucide-react';
import {
  cabinBillingService,
  type CabinMemberDto,
  type CabinSplitBillingResponse,
} from '../../services/cabinBillingService';
import { PosDigitalSignaturePad } from './PosDigitalSignaturePad';

interface CabinBillSplittingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  cabinNumber: string;
  stationId: string;
  cashierId: string;
  shiftId?: number;
  totalAmount: number;
  items?: {
    itemCode: string;
    itemName: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }[];
  onSuccess: (result: CabinSplitBillingResponse) => void;
}

interface SplitRowState {
  member: CabinMemberDto;
  isSelected: boolean;
  amount: number;
  signatureBase64?: string;
  error?: string;
}

export const CabinBillSplittingWizard: React.FC<CabinBillSplittingWizardProps> = ({
  isOpen,
  onClose,
  cabinNumber,
  stationId,
  cashierId,
  shiftId,
  totalAmount,
  items,
  onSuccess,
}) => {
  const [members, setMembers] = useState<CabinMemberDto[]>([]);
  const [splitRows, setSplitRows] = useState<SplitRowState[]>([]);
  const [splitMode, setSplitMode] = useState<'EVEN' | 'CUSTOM'>('EVEN');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Signature modal state for specific member
  const [activeSignerIndex, setActiveSignerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && cabinNumber) {
      const load = async () => {
        setIsLoadingMembers(true);
        setErrorMsg(null);
        try {
          const list = await cabinBillingService.getCabinMembers(cabinNumber);
          setMembers(list);

          // Default: select authorized adult signers
          const initialRows: SplitRowState[] = list.map((m) => ({
            member: m,
            isSelected: !m.isMinor && m.isAuthorizedSigner,
            amount: 0,
          }));

          // Distribute evenly among selected
          const activeCount = initialRows.filter((r) => r.isSelected).length;
          if (activeCount > 0) {
            const evenShare = Math.floor((totalAmount / activeCount) * 100) / 100;
            let sum = 0;
            initialRows.forEach((r, idx) => {
              if (r.isSelected) {
                if (idx === initialRows.map((x) => x.isSelected).lastIndexOf(true)) {
                  // Last one absorbs rounding difference
                  r.amount = Math.round((totalAmount - sum) * 100) / 100;
                } else {
                  r.amount = evenShare;
                  sum += evenShare;
                }
              }
            });
          }
          setSplitRows(initialRows);
        } catch {
          setErrorMsg(`Không thể tải danh sách thành viên phòng ${cabinNumber}`);
        } finally {
          setIsLoadingMembers(false);
        }
      };
      void load();
    }
  }, [isOpen, cabinNumber, totalAmount]);

  if (!isOpen) return null;

  const recalculateEven = (rows: SplitRowState[]) => {
    const selectedRows = rows.filter((r) => r.isSelected);
    if (selectedRows.length === 0) return rows;

    const share = Math.floor((totalAmount / selectedRows.length) * 100) / 100;
    let sum = 0;
    const lastSelectedIdx = rows.map((r) => r.isSelected).lastIndexOf(true);

    return rows.map((r, idx) => {
      if (!r.isSelected) {
        return { ...r, amount: 0, error: undefined, signatureBase64: undefined };
      }
      let amt = share;
      if (idx === lastSelectedIdx) {
        amt = Math.round((totalAmount - sum) * 100) / 100;
      } else {
        sum += share;
      }
      const shouldClearSignature = r.amount !== amt;
      return {
        ...r,
        amount: amt,
        error: undefined,
        signatureBase64: shouldClearSignature ? undefined : r.signatureBase64,
      };
    });
  };

  const handleToggleMember = (index: number) => {
    const row = splitRows[index];
    if (row.member.isMinor || !row.member.isAuthorizedSigner) {
      return; // Locked for minors or unauthorized signers
    }

    const updated = splitRows.map((r, idx) =>
      idx === index ? { ...r, isSelected: !r.isSelected } : r
    );

    if (splitMode === 'EVEN') {
      setSplitRows(recalculateEven(updated));
    } else {
      setSplitRows(updated);
    }
  };

  const handleCustomAmountChange = (index: number, val: number) => {
    const safeVal = Math.round(Math.max(0, val) * 100) / 100;
    const updated = splitRows.map((r, idx) => {
      if (idx !== index) return r;
      const shouldClearSignature = r.amount !== safeVal;
      return {
        ...r,
        amount: safeVal,
        signatureBase64: shouldClearSignature ? undefined : r.signatureBase64,
      };
    });
    setSplitRows(updated);
  };

  const currentTotalAssigned = splitRows
    .filter((r) => r.isSelected)
    .reduce((sum, r) => sum + r.amount, 0);

  const roundedDiff = Math.round((totalAmount - currentTotalAssigned) * 100) / 100;
  const isBalanced = Math.abs(roundedDiff) < 0.01;

  const handleSubmit = async () => {
    setErrorMsg(null);
    const selectedRows = splitRows.filter((r) => r.isSelected);

    if (selectedRows.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 thành viên để thanh toán!');
      return;
    }

    if (!isBalanced) {
      setErrorMsg(
        `Tổng tiền phân bổ ($${currentTotalAssigned.toFixed(2)}) chưa khớp với tổng hóa đơn ($${totalAmount.toFixed(2)})! Chênh lệch: $${roundedDiff.toFixed(2)}`
      );
      return;
    }

    // Verify limit and locks
    let hasValidationError = false;
    const validatedRows = splitRows.map((r) => {
      if (!r.isSelected) return r;
      if (r.member.isMinor || !r.member.isAuthorizedSigner) {
        hasValidationError = true;
        return { ...r, error: 'Khách là trẻ em hoặc chưa được cấp quyền ký nhận!' };
      }
      if (r.member.individualCreditLimit !== undefined && r.member.individualCreditLimit !== null) {
        const avail = (r.member.individualCreditLimit ?? 0) - (r.member.individualBalance ?? 0);
        if (avail < r.amount) {
          hasValidationError = true;
          return {
            ...r,
            error: `Vượt hạn mức cá nhân! Khả dụng: $${avail.toFixed(2)}, yêu cầu: $${r.amount.toFixed(2)}`,
          };
        }
      }
      return { ...r, error: undefined };
    });

    setSplitRows(validatedRows);
    if (hasValidationError) {
      setErrorMsg('Vui lòng kiểm tra lại hạn mức và quyền ký của các thành viên được chọn!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        cabinNumber,
        stationId,
        cashierId,
        shiftId,
        items,
        notes: `Cabin Multi-way Split Bill | Cabin: ${cabinNumber}`,
        splitShares: selectedRows.map((r) => ({
          passengerId: r.member.passengerId,
          guestName: r.member.guestName,
          amount: r.amount,
          signatureBase64: r.signatureBase64,
        })),
      };

      const result = await cabinBillingService.splitBilling(payload);
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Có lỗi xảy ra khi thực hiện phân bổ hóa đơn phòng!';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
            <div className="flex items-center gap-2 text-[#102A43]">
              <Users className="w-5 h-5 text-[#397C80]" />
              <h3 className="font-serif font-bold text-[#102A43] text-base">
                Phân Bổ Hóa Đơn Phòng (Cabin Bill Splitting Wizard)
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Cabin & Total Info */}
            <div className="grid grid-cols-3 gap-3 bg-[#F7F4ED] p-4 rounded-xl border border-[#E5E0D7]">
              <div>
                <p className="text-xs text-[#687787]">Phòng / Cabin:</p>
                <p className="text-sm font-bold text-[#102A43] font-mono mt-0.5">{cabinNumber}</p>
              </div>
              <div>
                <p className="text-xs text-[#687787]">Tổng hóa đơn:</p>
                <p className="text-sm font-bold text-[#102A43] font-mono mt-0.5">${totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-[#687787]">Chế độ chia:</p>
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSplitMode('EVEN');
                      setSplitRows(recalculateEven(splitRows));
                    }}
                    className={`px-2 py-0.5 text-xs rounded font-medium cursor-pointer transition-colors ${
                      splitMode === 'EVEN'
                        ? 'bg-[#102A43] text-white shadow-xs'
                        : 'bg-white border border-[#E5E0D7] text-[#687787] hover:text-[#102A43]'
                    }`}
                  >
                    Chia Đều
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('CUSTOM')}
                    className={`px-2 py-0.5 text-xs rounded font-medium cursor-pointer transition-colors ${
                      splitMode === 'CUSTOM'
                        ? 'bg-[#102A43] text-white shadow-xs'
                        : 'bg-white border border-[#E5E0D7] text-[#687787] hover:text-[#102A43]'
                    }`}
                  >
                    Tùy Chỉnh
                  </button>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Member List */}
            <div>
              <p className="text-xs font-semibold text-[#687787] mb-2 flex items-center justify-between">
                <span>Thành viên trong phòng ({members.length} khách):</span>
                <span className="text-[#687787]/80 font-normal">
                  {splitMode === 'EVEN' ? 'Chia đều tự động làm tròn cent' : 'Nhập số tiền cho từng khách'}
                </span>
              </p>

              {isLoadingMembers ? (
                <div className="py-8 text-center text-[#687787] text-sm">Đang tải danh sách thành viên...</div>
              ) : (
                <div className="space-y-2">
                  {splitRows.map((row, idx) => {
                    const isMinorLocked = row.member.isMinor || !row.member.isAuthorizedSigner;
                    const avail =
                      row.member.individualCreditLimit !== undefined && row.member.individualCreditLimit !== null
                        ? Math.max(0, (row.member.individualCreditLimit ?? 0) - (row.member.individualBalance ?? 0))
                        : undefined;

                    return (
                      <div
                        key={row.member.passengerId}
                        className={`p-3 rounded-xl border transition-colors ${
                          isMinorLocked
                            ? 'bg-[#F7F4ED]/50 border-[#E5E0D7] opacity-60'
                            : row.isSelected
                            ? 'bg-[#F7F4ED] border-[#102A43]/40'
                            : 'bg-white border-[#E5E0D7] hover:border-[#102A43]/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={row.isSelected}
                              disabled={isMinorLocked || isSubmitting}
                              onChange={() => handleToggleMember(idx)}
                              className="w-4 h-4 rounded text-[#102A43] focus:ring-[#102A43] border-[#E5E0D7] cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-[#102A43]">{row.member.guestName}</span>
                                {isMinorLocked ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                                    <Lock className="w-2.5 h-2.5" />
                                    {row.member.isMinor ? 'Trẻ em' : 'Chưa cấp quyền ký'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-medium">
                                    <UserCheck className="w-3 h-3" />
                                    Người ký hợp lệ
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#687787] mt-0.5">
                                ID: {row.member.passengerId}
                                {avail !== undefined && ` • Hạn mức khả dụng: $${avail.toFixed(2)}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {row.isSelected && (
                              <>
                                {splitMode === 'CUSTOM' ? (
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-1.5 text-xs text-[#687787]">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={row.amount || ''}
                                      onChange={(e) => handleCustomAmountChange(idx, parseFloat(e.target.value) || 0)}
                                      className="w-24 pl-6 pr-2 py-1 text-xs bg-white border border-[#E5E0D7] rounded-lg text-[#252B32] font-mono focus:outline-none focus:border-[#102A43]"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-[#102A43] font-mono bg-white px-3 py-1 rounded-lg border border-[#E5E0D7]">
                                    ${row.amount.toFixed(2)}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setActiveSignerIndex(idx)}
                                  className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                                    row.signatureBase64
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                      : 'bg-white hover:bg-[#F7F4ED] border-[#E5E0D7] text-[#102A43]'
                                  }`}
                                >
                                  {row.signatureBase64 ? (
                                    <>
                                      <Check className="w-3 h-3" /> Đã ký
                                    </>
                                  ) : (
                                    'Ký nhận'
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {row.error && (
                          <div className="mt-2 text-[11px] text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{row.error}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Split Balance Summary */}
            <div className="bg-[#F7F4ED] p-3.5 rounded-xl border border-[#E5E0D7] flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-[#687787]">Đã phân bổ / Tổng hóa đơn:</span>
                <p className="font-mono text-sm font-bold text-[#102A43]">
                  ${currentTotalAssigned.toFixed(2)} / ${totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <Check className="w-4 h-4" /> Khớp 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-800 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    Chênh lệch: ${roundedDiff.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-[#F7F4ED]/50 border-t border-[#E5E0D7] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-[#687787] hover:text-[#102A43] bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isBalanced || splitRows.filter((r) => r.isSelected).length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#102A43] hover:bg-[#183B5B] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <Divide className="w-4 h-4" />
              {isSubmitting ? 'Đang thực hiện phân bổ...' : 'Hoàn Tất Phân Bổ Hóa Đơn'}
            </button>
          </div>
        </div>
      </div>

      {/* Signature Pad for selected split occupant */}
      {activeSignerIndex !== null && (
        <PosDigitalSignaturePad
          isOpen={true}
          onClose={() => setActiveSignerIndex(null)}
          signerName={splitRows[activeSignerIndex].member.guestName}
          cabinNumber={cabinNumber}
          totalAmount={splitRows[activeSignerIndex].amount}
          onConfirm={(base64) => {
            const updated = splitRows.map((r, idx) =>
              idx === activeSignerIndex ? { ...r, signatureBase64: base64 } : r
            );
            setSplitRows(updated);
            setActiveSignerIndex(null);
          }}
        />
      )}
    </>
  );
};
