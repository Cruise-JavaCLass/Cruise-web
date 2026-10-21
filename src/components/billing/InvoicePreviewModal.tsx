import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface InvoicePreviewModalProps {
  open: boolean;
  blob: Blob | null;
  fileName: string;
  onClose: () => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  open,
  blob,
  fileName,
  onClose,
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !blob) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, blob]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Xem trước hoá đơn PDF"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h3 className="font-bold text-white text-base">Hoá đơn PDF</h3>
            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{fileName}</p>
          </div>
          <div className="flex items-center gap-2">
            {objectUrl && (
              <a
                href={objectUrl}
                download={fileName}
                className="px-3 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-2 text-xs"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng xem trước hoá đơn"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[60vh] bg-slate-950">
          {objectUrl ? (
            <iframe title="Hoá đơn PDF" src={objectUrl} className="w-full h-full min-h-[60vh]" />
          ) : (
            <div className="h-full min-h-[60vh] flex items-center justify-center text-slate-500 text-sm">
              Đang chuẩn bị bản xem trước...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
