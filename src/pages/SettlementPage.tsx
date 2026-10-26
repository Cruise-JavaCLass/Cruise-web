import React, { useCallback, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSearch,
  Loader2,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import {
  downloadInvoiceWithFileName,
  getSettlementPreview,
  newIdempotencyKey,
  settleFolio,
  type SettlementPreview,
  type SettleFolioRequest,
} from '../services/settlementService';
import { SettlementSummaryCard } from '../components/billing/SettlementSummaryCard';
import { SettlementLineItemTable } from '../components/billing/SettlementLineItemTable';
import { OpenDisputesBanner } from '../components/billing/OpenDisputesBanner';
import {
  PaymentCaptureModal,
  type PaymentCapturePayload,
} from '../components/billing/PaymentCaptureModal';

interface MappedError {
  message: string;
  isDispute: boolean;
}

const mapSettlementError = (error: unknown): MappedError => {
  const axiosLike = error as {
    response?: { status?: number; data?: { message?: string } };
  };
  const status = axiosLike.response?.status;
  const backendMessage = axiosLike.response?.data?.message ?? '';

  if (status === 404) {
    return { message: 'Không tìm thấy folio cho cabin này', isDispute: false };
  }
  if (status === 403) {
    return { message: 'Bạn không có quyền tất toán', isDispute: false };
  }
  if (status === 409) {
    if (backendMessage.includes('FOLIO_ALREADY_SETTLED')) {
      return { message: 'Cabin đã tất toán', isDispute: false };
    }
    if (backendMessage.includes('OPEN_DISPUTES_PENDING')) {
      return {
        message: 'Folio đang có khiếu nại chưa xử lý, không thể tất toán',
        isDispute: true,
      };
    }
  }
  if (status === 422 && backendMessage.includes('INSUFFICIENT_TENDER')) {
    return { message: 'Số tiền nhận chưa đủ', isDispute: false };
  }
  return {
    message: backendMessage || 'Đã xảy ra lỗi khi xử lý tất toán. Vui lòng thử lại.',
    isDispute: false,
  };
};

const triggerBlobDownload = (blob: Blob, fileName: string): void => {
  if (typeof URL.createObjectURL !== 'function') {
    return;
  }
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const readCanForceWithHold = (): boolean => {
  try {
    const role = window.localStorage.getItem('userRole');
    return role === 'OPERATIONS_MANAGER' || role === 'SYSTEM_ADMIN';
  } catch {
    return false;
  }
};

export const SettlementPage: React.FC = () => {
  const [cabinInput, setCabinInput] = useState<string>('');
  const [activeCabin, setActiveCabin] = useState<string | null>(null);
  const [preview, setPreview] = useState<SettlementPreview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [settleError, setSettleError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [disputeNotice, setDisputeNotice] = useState<string | null>(null);

  const [forceWithHold, setForceWithHold] = useState<boolean>(false);
  const [canForceWithHold] = useState<boolean>(readCanForceWithHold);

  const idempotencyKeyRef = useRef<string | null>(null);

  const loadPreview = useCallback(async (cabinNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettlementPreview(cabinNumber);
      setPreview(data);
    } catch (loadError: unknown) {
      setPreview(null);
      setError(mapSettlementError(loadError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoad = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const cabin = cabinInput.trim();
    if (!cabin) {
      setPreview(null);
      setActiveCabin(null);
      setError('Vui lòng nhập số cabin để tải folio.');
      return;
    }
    if (cabin !== activeCabin) {
      idempotencyKeyRef.current = null;
      setForceWithHold(false);
      setSuccessMessage(null);
      setDisputeNotice(null);
    }
    setActiveCabin(cabin);
    await loadPreview(cabin);
  };

  const handleOpenModal = () => {
    if (!preview) {
      return;
    }
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = newIdempotencyKey();
    }
    setSettleError(null);
    setIsModalOpen(true);
  };

  const handleConfirm = async (payload: PaymentCapturePayload) => {
    if (!activeCabin) {
      return;
    }
    const cabin = activeCabin;
    const key = idempotencyKeyRef.current ?? newIdempotencyKey();
    idempotencyKeyRef.current = key;

    const request: SettleFolioRequest = {
      paymentMethod: payload.paymentMethod,
      amountTendered: payload.amountTendered,
      forceWithHold,
    };
    if (payload.notes) {
      request.notes = payload.notes;
    }

    setSubmitting(true);
    setSettleError(null);
    try {
      const settlement = await settleFolio(cabin, request, key);
      setSuccessMessage(
        `Đã tất toán cabin ${cabin} thành công${
          settlement.invoiceNumber ? ` — Hoá đơn ${settlement.invoiceNumber}` : ''
        }. Hoá đơn PDF đang được tải xuống.`,
      );
      idempotencyKeyRef.current = null;
      setForceWithHold(false);
      setDisputeNotice(null);
      setIsModalOpen(false);

      try {
        const { blob, fileName } = await downloadInvoiceWithFileName(cabin);
        triggerBlobDownload(blob, fileName);
      } catch {
        // Tải hoá đơn lỗi không được chặn luồng tất toán đã thành công.
      }

      await loadPreview(cabin);
    } catch (settleFailure: unknown) {
      const mapped = mapSettlementError(settleFailure);
      setSettleError(mapped.message);
      if (mapped.isDispute) {
        setDisputeNotice(mapped.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header — Luxury Maritime */}
      <div className="bg-white border border-[#E5E0D7] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#C5A572]/15 text-[#102A43] border border-[#C5A572]/40 tracking-wider">
            BILL SETTLEMENT & INVOICING
          </span>
          <span className="text-[11px] font-medium text-[#687787]">• FOLIO AUDIT & PDF RELEASE</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#102A43] tracking-tight">Tất toán &amp; Hoá đơn</h1>
        <p className="text-xs sm:text-sm text-[#687787] mt-1">
          Tra cứu folio theo cabin, kiểm tra khiếu nại và phát hành hoá đơn PDF.
        </p>
      </div>

      <form
        onSubmit={handleLoad}
        className="bg-white border border-[#E5E0D7] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-end gap-3 shadow-xs"
      >
        <div className="flex-1">
          <label
            htmlFor="cabin-number"
            className="block text-[11px] font-semibold uppercase tracking-wider text-[#252B32] mb-1.5"
          >
            Số cabin
          </label>
          <input
            id="cabin-number"
            type="text"
            value={cabinInput}
            onChange={(event) => setCabinInput(event.target.value)}
            placeholder="CABIN-7012"
            className="w-full text-xs font-semibold bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg p-2.5 text-[#252B32] focus:outline-none focus:border-[#102A43]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-5 text-xs font-semibold bg-[#102A43] hover:bg-[#183B5B] text-white rounded-lg shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
          Tải folio
        </button>
      </form>

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-xs font-medium shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {disputeNotice && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs font-medium shadow-xs"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>{disputeNotice}</span>
        </div>
      )}

      <SettlementSummaryCard preview={preview} loading={loading} error={error} />

      {preview && (
        <>
          <OpenDisputesBanner
            preview={preview}
            canForceWithHold={canForceWithHold}
            forceWithHold={forceWithHold}
            onForceWithHoldChange={setForceWithHold}
          />

          <SettlementLineItemTable
            lineItems={preview.lineItems}
            currency={preview.currency}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (activeCabin) {
                  void loadPreview(activeCabin);
                }
              }}
              disabled={loading}
              className="py-2.5 px-4 text-xs font-semibold bg-white hover:bg-[#F7F4ED] text-[#102A43] border border-[#E5E0D7] rounded-lg shadow-xs flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={loading}
              className="py-2.5 px-5 text-xs font-semibold bg-[#102A43] hover:bg-[#183B5B] text-white rounded-lg shadow-xs flex items-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              Tất toán
            </button>
          </div>
        </>
      )}

      <PaymentCaptureModal
        open={isModalOpen}
        preview={preview}
        submitting={submitting}
        errorMessage={settleError}
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
          }
        }}
        onConfirm={(payload) => {
          void handleConfirm(payload);
        }}
      />
    </div>
  );
};
export default SettlementPage;
