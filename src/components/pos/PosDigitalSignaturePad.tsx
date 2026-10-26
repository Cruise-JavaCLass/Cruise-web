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
        ctx.strokeStyle = '#102A43'; // Luxury Ocean Navy stroke
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
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
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
    const scaleX = rect.width > 0 ? canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? canvas.height / rect.height : 1;
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-2 text-[#102A43]">
            <PenTool className="w-5 h-5 text-[#397C80]" />
            <h3 className="font-serif font-bold text-[#102A43] text-base">Xác Nhận Chữ Ký Điện Tử (E-Signature)</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-[#F7F4ED] p-3 rounded-xl border border-[#E5E0D7] text-xs flex justify-between items-center">
            <div>
              <p className="text-[#687787]">Hành khách ký nhận:</p>
              <p className="text-sm font-semibold text-[#102A43]">{signerName}</p>
              <p className="text-[#687787]">Phòng: {cabinNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[#687787]">Số tiền xác nhận:</p>
              <p className="text-lg font-bold text-[#102A43] font-mono">${totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-[#687787] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#397C80]" />
                Vui lòng ký tên bằng tay hoặc bút cảm ứng vào khung dưới đây:
              </span>
              <button
                type="button"
                onClick={handleClear}
                disabled={!hasStroke || isSubmitting}
                className="text-xs text-[#8C6D37] hover:text-[#102A43] flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Eraser className="w-3.5 h-3.5" />
                Xóa chữ ký
              </button>
            </div>

            <div className="relative border-2 border-dashed border-[#E5E0D7] bg-[#F7F4ED]/30 rounded-xl overflow-hidden touch-none">
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
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#687787]/50 text-sm select-none">
                  Ký tên tại đây (Sign Here)
                </div>
              )}
            </div>
          </div>

          {validationError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <p className="text-[11px] text-[#687787] leading-tight">
            * Bằng việc ký xác nhận, quý khách đồng ý thanh toán hóa đơn vào tài khoản Folio phòng trên tàu và chữ ký điện tử được mã hóa lưu trữ phục vụ đối soát.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F7F4ED]/50 border-t border-[#E5E0D7] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-medium text-[#687787] hover:text-[#102A43] bg-white hover:bg-[#F7F4ED] border border-[#E5E0D7] rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#102A43] hover:bg-[#183B5B] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Đang xác nhận...' : 'Xác Nhận & Xuất E-Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};
