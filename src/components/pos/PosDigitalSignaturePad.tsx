import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, X, PenTool, ShieldCheck, AlertCircle } from 'lucide-react';

interface PosDigitalSignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  signerName: string;
  cabinNumber: string;
  totalAmount: number;
  onConfirm: (signatureBase64: string) => void;
  isSubmitting?: boolean;
}

export const PosDigitalSignaturePad: React.FC<PosDigitalSignaturePadProps> = ({
  isOpen,
  onClose,
  signerName,
  cabinNumber,
  totalAmount,
  onConfirm,
  isSubmitting = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasStroke(false);
      setValidationError(null);
      // Initialize canvas context
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#38bdf8'; // Light sky blue
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setValidationError(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasStroke(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    setValidationError(null);
  };

  const handleConfirm = () => {
    if (!hasStroke) {
      setValidationError('Vui lòng ký tên vào khung trước khi xác nhận hóa đơn!');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export compressed PNG base64
    const signatureBase64 = canvas.toDataURL('image/png');
    onConfirm(signatureBase64);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-cyan-400">
            <PenTool className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">Xác Nhận Chữ Ký Điện Tử (E-Signature)</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs flex justify-between items-center">
            <div>
              <p className="text-slate-400">Hành khách ký nhận:</p>
              <p className="text-sm font-semibold text-white">{signerName}</p>
              <p className="text-slate-500">Phòng: {cabinNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Số tiền xác nhận:</p>
              <p className="text-lg font-bold text-emerald-400">${totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Vui lòng ký tên bằng tay hoặc bút cảm ứng vào khung dưới đây:
              </span>
              <button
                type="button"
                onClick={handleClear}
                disabled={!hasStroke || isSubmitting}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Eraser className="w-3.5 h-3.5" />
                Xóa chữ ký
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 bg-slate-950 rounded-xl overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={460}
                height={180}
                className="w-full h-44 cursor-crosshair block"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasStroke && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-600 text-sm select-none">
                  Ký tên tại đây (Sign Here)
                </div>
              )}
            </div>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-tight">
            * Bằng việc ký xác nhận, quý khách đồng ý thanh toán hóa đơn vào tài khoản Folio phòng trên tàu và chữ ký điện tử được mã hóa lưu trữ phục vụ đối soát.
          </p>
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
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Đang xác nhận...' : 'Xác Nhận & Xuất E-Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
