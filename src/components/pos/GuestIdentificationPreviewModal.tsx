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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
            <h2 id="modal-title" className="text-lg font-bold text-gray-900">
              Đối Chiếu Nhận Diện Hành Khách
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Guest Portrait Photo */}
            <div className="relative flex-shrink-0">
              {guest.photoUrl ? (
                <img
                  src={guest.photoUrl}
                  alt={guest.fullName}
                  className="h-32 w-32 rounded-2xl border-2 border-gray-200 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 font-medium">
                  Không có ảnh
                </div>
              )}
              {guest.isMinor && (
                <span className="absolute -bottom-2 -right-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                  Trẻ em
                </span>
              )}
            </div>

            {/* Profile Summary */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{guest.fullName}</h3>
              <p className="text-sm font-medium text-gray-500">
                Cabin: <span className="font-bold text-gray-900">{guest.cabinNumber}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {guest.credentialType}: {guest.maskedIdentifier}
                </span>
                <span
                  className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                    guest.credentialStatus === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {guest.credentialStatus}
                </span>
                {guest.alcoholRestricted && (
                  <span className="rounded-md bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                    Cấm đồ cồn
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Folio & Balance Overview */}
          <div className="mt-6 rounded-xl bg-gray-50 p-4 border border-gray-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Trạng thái Folio:</span>
              <span className="font-semibold text-gray-900">{guest.folioStatus}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Hạn mức khả dụng:</span>
              <span className="text-lg font-bold text-emerald-600">
                ${guest.availableLimit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Tổng hạn mức / Đã tiêu:</span>
              <span className="text-gray-700 font-medium">
                ${guest.creditLimit.toFixed(2)} / ${guest.currentBalance.toFixed(2)}
              </span>
            </div>
            {guest.individualSpendingLimit !== undefined && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Hạn mức cá nhân phụ trợ:</span>
                <span className="text-amber-600 font-semibold">
                  ${guest.individualSpendingLimit.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Security Alert Banner if Blocked */}
          {isBlocked && (
            <div className="mt-4 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-rose-700 text-sm">
              ⚠️ Thẻ hoặc tài khoản này không được phép chi tiêu (Trạng thái: {guest.credentialStatus}). Vui lòng thông báo cho bộ phận an ninh hoặc quầy Lễ tân.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            disabled={isBlocked || isLoading}
            onClick={() => onConfirmAssign(guest)}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Đang Xử Lý...' : 'Xác Nhận Gán Vào Giỏ Hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};
