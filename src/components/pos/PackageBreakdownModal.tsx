import React, { useRef } from 'react';
import type {
  EntitlementEvaluateResponse,
  GuestPackageEntitlement,
} from '../../services/posEntitlementTypes';
import { useModalFocusTrap } from './useModalFocusTrap';

interface PackageBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: EntitlementEvaluateResponse | null;
  activePackages: GuestPackageEntitlement[];
  onConfirmSplitPayment?: () => void;
}

export const PackageBreakdownModal: React.FC<PackageBreakdownModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  activePackages,
  onConfirmSplitPayment,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalFocusTrap({
    isOpen,
    containerRef: dialogRef,
    onClose,
  });

  if (!isOpen || !evaluation) return null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breakdown-modal-title"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white border border-[#E5E0D7] shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D7] bg-[#F7F4ED] px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 rounded-full bg-[#C5A572]" />
            <h2 id="breakdown-modal-title" className="text-lg font-serif font-bold text-[#102A43]">
              Chi Tiết Khấu Trừ Gói Dịch Vụ & Tách Bill
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#687787] hover:bg-[#E5E0D7]/60 hover:text-[#102A43] transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Packages Quota Badges */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#687787] mb-2">
              Gói dịch vụ đang kích hoạt
            </h3>
            {activePackages.length === 0 ? (
              <p className="text-sm text-[#687787] italic">Không có gói dịch vụ nào đang áp dụng</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activePackages.map((pkg) => {
                  const rem = Math.max(0, pkg.totalQuota - pkg.usedQuota);
                  return (
                    <span
                      key={pkg.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#C5A572]/15 px-3 py-1 text-xs font-semibold text-[#8C6D37] border border-[#C5A572]/30"
                    >
                      <span>{pkg.packageName}</span>
                      <span className="rounded-full bg-[#C5A572]/25 px-1.5 py-0.2 text-[10px] font-bold text-[#8C6D37]">
                        Còn {rem}/{pkg.totalQuota} suất
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Itemized Deduction Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#687787] mb-2">
              Bảng Phân Tách Quyền Lợi Từng Món
            </h3>
            <div className="overflow-hidden rounded-xl border border-[#E5E0D7] bg-white">
              <table className="min-w-full divide-y divide-[#E5E0D7] text-left text-sm">
                <thead className="bg-[#F7F4ED] text-xs font-bold text-[#687787]">
                  <tr>
                    <th className="px-4 py-3">Món</th>
                    <th className="px-4 py-3">SL</th>
                    <th className="px-4 py-3">Giá gốc</th>
                    <th className="px-4 py-3">Gói tài trợ</th>
                    <th className="px-4 py-3 text-right">Khách trả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D7]">
                  {evaluation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F7F4ED]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#102A43]">{item.productName}</div>
                        {item.appliedPackageName && (
                          <span className="text-[11px] font-medium text-emerald-700">
                            ✓ {item.appliedPackageName}
                            {typeof item.quotaDeducted === 'number' && ` (-${item.quotaDeducted} suất)`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#687787]">{item.quantity}</td>
                      <td className="px-4 py-3 text-[#687787] font-mono">${item.grossAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium font-mono text-emerald-700">
                        {item.coveredAmount > 0 ? `-$${item.coveredAmount.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold font-mono text-[#102A43]">
                        ${item.outOfPocketAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="rounded-xl bg-[#F7F4ED] p-4 border border-[#E5E0D7] space-y-2">
            <div className="flex justify-between text-sm text-[#687787]">
              <span>Tổng tiền đơn hàng:</span>
              <span className="font-mono">${evaluation.originalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-700 font-semibold">
              <span>Gói dịch vụ chi trả (Inclusion):</span>
              <span className="font-mono">-${evaluation.packageDiscountTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-[#E5E0D7] pt-2 flex justify-between text-base font-bold text-[#102A43]">
              <span>Số tiền thực tế tính vào Folio khách:</span>
              <span className="text-[#102A43] font-mono">${evaluation.netPayableTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E5E0D7] bg-[#F7F4ED]/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-[#687787] hover:bg-[#F7F4ED] hover:text-[#102A43] border border-[#E5E0D7] transition shadow-xs"
          >
            Đóng
          </button>
          {onConfirmSplitPayment && (
            <button
              type="button"
              onClick={onConfirmSplitPayment}
              className="rounded-xl bg-[#102A43] hover:bg-[#183B5B] px-5 py-2 text-sm font-semibold text-white shadow-xs transition"
            >
              Áp Dụng Tách Bill Vào Giỏ Hàng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
