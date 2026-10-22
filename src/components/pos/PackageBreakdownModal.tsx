import React from 'react';
import type {
  EntitlementEvaluateResponse,
  GuestPackageEntitlement,
} from '../../services/posEntitlementTypes';

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
  if (!isOpen || !evaluation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="breakdown-modal-title"
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 rounded-full bg-indigo-500" />
            <h2 id="breakdown-modal-title" className="text-lg font-bold text-gray-900">
              Chi Tiết Khấu Trừ Gói Dịch Vụ & Tách Bill
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Packages Quota Badges */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Gói dịch vụ đang kích hoạt
            </h3>
            {activePackages.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Không có gói dịch vụ nào đang áp dụng</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activePackages.map((pkg) => {
                  const rem = Math.max(0, pkg.totalQuota - pkg.usedQuota);
                  return (
                    <span
                      key={pkg.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100"
                    >
                      <span>{pkg.packageName}</span>
                      <span className="rounded-full bg-indigo-200 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800">
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Bảng Phân Tách Quyền Lợi Từng Món
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Món</th>
                    <th className="px-4 py-3">SL</th>
                    <th className="px-4 py-3">Giá gốc</th>
                    <th className="px-4 py-3">Gói tài trợ</th>
                    <th className="px-4 py-3 text-right">Khách trả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evaluation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{item.productName}</div>
                        {item.appliedPackageName && (
                          <span className="text-[11px] font-medium text-emerald-600">
                            ✓ {item.appliedPackageName} (-{item.quotaDeducted} suất)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-gray-600">${item.grossAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-emerald-600">
                        {item.coveredAmount > 0 ? `-$${item.coveredAmount.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        ${item.outOfPocketAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tổng tiền đơn hàng:</span>
              <span>${evaluation.originalTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-600 font-semibold">
              <span>Gói dịch vụ chi trả (Inclusion):</span>
              <span>-${evaluation.packageDiscountTotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>Số tiền thực tế tính vào Folio khách:</span>
              <span className="text-indigo-600">${evaluation.netPayableTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Đóng
          </button>
          {onConfirmSplitPayment && (
            <button
              type="button"
              onClick={onConfirmSplitPayment}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Áp Dụng Tách Bill Vào Giỏ Hàng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
