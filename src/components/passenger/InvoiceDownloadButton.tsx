import React, { useState } from 'react';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { downloadInvoiceWithFileName } from '../../services/settlementService';

interface InvoiceDownloadButtonProps {
  cabinNumber: string;
  invoiceNumber?: string;
  disabled?: boolean;
}

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

export const InvoiceDownloadButton: React.FC<InvoiceDownloadButtonProps> = ({
  cabinNumber,
  invoiceNumber,
  disabled = false,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [blocked, setBlocked] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDownload = async () => {
    if (loading || blocked || disabled) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const { blob, fileName } = await downloadInvoiceWithFileName(cabinNumber);
      triggerBlobDownload(blob, fileName);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403 || status === 404) {
        setBlocked(true);
        return;
      }
      setErrorMessage('Không thể tải hoá đơn PDF. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled || loading || blocked}
        aria-label={`Tải hoá đơn PDF cho cabin ${cabinNumber}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {invoiceNumber ? `Hoá đơn ${invoiceNumber}` : 'Tải hoá đơn PDF'}
      </button>
      {errorMessage && (
        <p role="alert" className="flex items-center gap-1.5 text-[11px] text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};
