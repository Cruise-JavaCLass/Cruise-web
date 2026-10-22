import React, { useState, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Check,
  X,
  Lock,
  Divide,
  AlertCircle,
  ShieldCheck,
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
        return { ...r, amount: 0, error: undefined };
      }
      let amt = share;
      if (idx === lastSelectedIdx) {
        amt = Math.round((totalAmount - sum) * 100) / 100;
      } else {
        sum += share;
      }
      return { ...r, amount: amt, error: undefined };
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
    const safeVal = Math.max(0, val);
    const updated = splitRows.map((r, idx) =>
      idx === index ? { ...r, amount: safeVal } : r
    );
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2 text-indigo-400">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">
                Phân Bổ Hóa Đơn Phòng (Cabin Bill Splitting Wizard)
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Cabin & Total Info */}
            <div className="grid grid-cols-3 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Phòng / Cabin:</p>
                <p className="text-sm font-bold text-white mt-0.5">{cabinNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Tổng hóa đơn:</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">${totalAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Chế độ chia:</p>
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSplitMode('EVEN');
                      setSplitRows(recalculateEven(splitRows));
                    }}
                    className={`px-2 py-0.5 text-xs rounded font-medium cursor-pointer transition-colors ${
                      splitMode === 'EVEN'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Chia Đều
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('CUSTOM')}
                    className={`px-2 py-0.5 text-xs rounded font-medium cursor-pointer transition-colors ${
                      splitMode === 'CUSTOM'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Tùy Chỉnh
                  </button>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Member List */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Thành viên trong phòng ({members.length} khách):</span>
                <span className="text-slate-500 font-normal">
                  {splitMode === 'EVEN' ? 'Chia đều tự động làm tròn cent' : 'Nhập số tiền cho từng khách'}
                </span>
              </p>

              {isLoadingMembers ? (
                <div className="py-8 text-center text-slate-500 text-sm">Đang tải danh sách thành viên...</div>
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
                            ? 'bg-slate-950/30 border-slate-800/50 opacity-60'
                            : row.isSelected
                            ? 'bg-indigo-950/20 border-indigo-500/50'
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={row.isSelected}
                              disabled={isMinorLocked || isSubmitting}
                              onChange={() => handleToggleMember(idx)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white">{row.member.guestName}</span>
                                {isMinorLocked ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 text-[10px] font-medium border border-amber-800/50">
                                    <Lock className="w-2.5 h-2.5" />
                                    {row.member.isMinor ? 'Trẻ em' : 'Chưa cấp quyền ký'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-400 text-[10px]">
                                    <UserCheck className="w-3 h-3" />
                                    Người ký hợp lệ
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
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
                                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={row.amount || ''}
                                      onChange={(e) => handleCustomAmountChange(idx, parseFloat(e.target.value) || 0)}
                                      className="w-24 pl-6 pr-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-white font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                                    ${row.amount.toFixed(2)}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setActiveSignerIndex(idx)}
                                  className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                                    row.signatureBase64
                                      ? 'bg-emerald-950/40 border-emerald-700 text-emerald-300'
                                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
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
                          <div className="mt-2 text-[11px] text-red-400 flex items-center gap-1">
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
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400">Đã phân bổ / Tổng hóa đơn:</span>
                <p className="font-mono text-sm font-bold text-white">
                  ${currentTotalAssigned.toFixed(2)} / ${totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <Check className="w-4 h-4" /> Khớp 100%
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    Chênh lệch: ${roundedDiff.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isBalanced || splitRows.filter((r) => r.isSelected).length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
