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
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
          KAN-241 • Bill Settlement
        </p>
        <h1 className="text-2xl font-bold text-white mt-1">Tất toán &amp; Hoá đơn</h1>
        <p className="text-sm text-slate-400 mt-1">
          Tra cứu folio theo cabin, kiểm tra khiếu nại và phát hành hoá đơn PDF.
        </p>
      </div>

      <form
        onSubmit={handleLoad}
        className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-end gap-3"
      >
        <div className="flex-1">
          <label
            htmlFor="cabin-number"
            className="block text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1.5"
          >
            Số cabin
          </label>
          <input
            id="cabin-number"
            type="text"
            value={cabinInput}
            onChange={(event) => setCabinInput(event.target.value)}
            placeholder="CABIN-7012"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500/60"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
          Tải folio
        </button>
      </form>

      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-300 text-sm"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {disputeNotice && (
        <div
          role="alert"
          className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-300 text-sm"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
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

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                if (activeCabin) {
                  void loadPreview(activeCabin);
                }
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              type="button"
              onClick={handleOpenModal}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
