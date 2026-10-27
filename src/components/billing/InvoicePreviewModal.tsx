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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Xem trước hoá đơn PDF"
        className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div>
            <h3 className="font-serif font-bold text-[#102A43] text-base">Hoá đơn PDF</h3>
            <p className="text-[11px] font-mono text-[#252B32]/70 mt-0.5">{fileName}</p>
          </div>
          <div className="flex items-center gap-2">
            {objectUrl && (
              <a
                href={objectUrl}
                download={fileName}
                className="px-3.5 py-2 rounded-xl bg-[#102A43] text-white font-semibold hover:bg-[#0B1F33] transition-colors flex items-center gap-2 text-xs shadow-xs"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng xem trước hoá đơn"
              className="p-1 rounded-lg text-[#252B32]/70 hover:text-[#102A43] hover:bg-[#E5E0D7]/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[60vh] bg-[#F7F4ED]/30">
          {objectUrl ? (
            <iframe title="Hoá đơn PDF" src={objectUrl} className="w-full h-full min-h-[60vh]" />
          ) : (
            <div className="h-full min-h-[60vh] flex items-center justify-center text-[#252B32]/60 text-sm">
              Đang chuẩn bị bản xem trước...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
