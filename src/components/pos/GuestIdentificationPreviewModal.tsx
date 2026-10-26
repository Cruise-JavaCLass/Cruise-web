import React from 'react';
import type { PassengerIdentificationResponse } from '../../services/posAuthTypes';

interface GuestIdentificationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: PassengerIdentificationResponse | null;
  onConfirmAssign: (guest: PassengerIdentificationResponse) => void;
  isLoading?: boolean;
}

export const GuestIdentificationPreviewModal: React.FC<GuestIdentificationPreviewModalProps> = ({
  isOpen,
  onClose,
  guest,
  onConfirmAssign,
  isLoading = false,
}) => {
  if (!isOpen || !guest) return null;

  const isBlocked =
    guest.credentialStatus === 'REPORTED_LOST' ||
    guest.credentialStatus === 'BLOCKED' ||
    !guest.spendingAllowed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white border border-[#E5E0D7] shadow-xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D7] bg-[#F7F4ED] px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 rounded-full bg-[#397C80]" />
            <h2 id="modal-title" className="text-lg font-serif font-bold text-[#102A43]">
              Đối Chiếu Nhận Diện Hành Khách
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#687787] hover:bg-[#E5E0D7]/60 hover:text-[#102A43] transition"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Guest Portrait Photo */}
            <div className="relative shrink-0">
              {guest.photoUrl ? (
                <img
                  src={guest.photoUrl}
                  alt={guest.fullName}
                  className="h-32 w-32 rounded-2xl border border-[#E5E0D7] object-cover shadow-xs"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-[#E5E0D7] bg-[#F7F4ED] text-[#687787] font-medium">
                  Không có ảnh
                </div>
              )}
              {guest.isMinor && (
                <span className="absolute -bottom-2 -right-2 rounded-full bg-[#C5A572] px-2 py-0.5 text-xs font-bold text-[#0B1F33] shadow-xs">
                  Trẻ em
                </span>
              )}
            </div>

            {/* Profile Summary */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="text-xl font-serif font-bold text-[#102A43]">{guest.fullName}</h3>
              <p className="text-sm font-medium text-[#687787]">
                Cabin: <span className="font-bold text-[#102A43] font-mono">{guest.cabinNumber}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                <span className="rounded-md bg-[#102A43]/10 px-2.5 py-0.5 text-xs font-semibold text-[#102A43] border border-[#102A43]/20">
                  {guest.credentialType}: {guest.maskedIdentifier}
                </span>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                    guest.credentialStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {guest.credentialStatus}
                </span>
                {guest.alcoholRestricted && (
                  <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 border border-rose-200">
                    Cấm đồ cồn
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Folio & Balance Overview */}
          <div className="mt-6 rounded-xl bg-[#F7F4ED] p-4 border border-[#E5E0D7] space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#687787]">Trạng thái Folio:</span>
              <span className="font-semibold text-[#252B32]">{guest.folioStatus}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#687787]">Hạn mức khả dụng:</span>
              <span className="text-lg font-bold text-[#102A43] font-mono">
                ${guest.availableLimit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#687787]">Tổng hạn mức / Đã tiêu:</span>
              <span className="text-[#252B32] font-mono font-medium">
                ${guest.creditLimit.toFixed(2)} / ${guest.currentBalance.toFixed(2)}
              </span>
            </div>
            {guest.individualSpendingLimit !== undefined && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#687787]">Hạn mức cá nhân phụ trợ:</span>
                <span className="text-[#8C6D37] font-semibold font-mono">
                  ${guest.individualSpendingLimit.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Security Alert Banner if Blocked */}
          {isBlocked && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-rose-800 text-sm">
              ⚠️ Thẻ hoặc tài khoản này không được phép chi tiêu (Trạng thái: {guest.credentialStatus}). Vui lòng thông báo cho bộ phận an ninh hoặc quầy Lễ tân.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E5E0D7] bg-[#F7F4ED]/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-[#687787] hover:bg-[#F7F4ED] hover:text-[#102A43] border border-[#E5E0D7] transition shadow-xs"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            disabled={isBlocked || isLoading}
            onClick={() => onConfirmAssign(guest)}
            className="rounded-xl bg-[#102A43] hover:bg-[#183B5B] px-5 py-2 text-sm font-semibold text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Đang Xử Lý...' : 'Xác Nhận Gán Vào Giỏ Hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};
