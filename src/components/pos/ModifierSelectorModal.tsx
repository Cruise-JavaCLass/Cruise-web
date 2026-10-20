import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { type ProductDetailDto, type ProductModifierDto } from '../../services/posCatalogService';

interface ModifierSelectorModalProps {
  isOpen: boolean;
  product: ProductDetailDto | null;
  onClose: () => void;
  onConfirm: (product: ProductDetailDto, selectedModifiers: ProductModifierDto[], notes: string) => void;
}

export const ModifierSelectorModal: React.FC<ModifierSelectorModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
}) => {
  const [selectedModifiers, setSelectedModifiers] = useState<ProductModifierDto[]>([]);
  const [notes, setNotes] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedModifiers([]);
      setNotes('');
      triggerRef.current = document.activeElement as HTMLElement | null;

      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    } else if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, product?.sku]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const toggleModifier = (mod: ProductModifierDto) => {
    const exists = selectedModifiers.some((m) => m.name === mod.name);
    if (exists) {
      setSelectedModifiers(selectedModifiers.filter((m) => m.name !== mod.name));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  const handleConfirm = () => {
    onConfirm(product, selectedModifiers, notes.trim());
    setSelectedModifiers([]);
    setNotes('');
    onClose();
  };

  const extraTotal = selectedModifiers.reduce((acc, m) => acc + (m.priceDelta || 0), 0);
  const totalPrice = product.basePrice + extraTotal;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modifier-modal-title"
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h3 id="modifier-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
              <span>{product.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              SKU: {product.sku} • Giá cơ sở: ${product.basePrice.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Đóng cửa sổ tùy biến"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {product.modifiers && product.modifiers.length > 0 ? (
            <div role="group" aria-labelledby="modifier-group-label">
              <p id="modifier-group-label" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Tùy chọn & Topping (Modifiers)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.modifiers.map((mod, idx) => {
                  const isSelected = selectedModifiers.some((m) => m.name === mod.name);
                  return (
                    <button
                      key={mod.id || idx}
                      type="button"
                      onClick={() => toggleModifier(mod)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm ring-1 ring-blue-500'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600 bg-slate-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-sm font-medium">{mod.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-blue-400">
                        {mod.priceDelta > 0 ? `+$${mod.priceDelta.toFixed(2)}` : 'Miễn phí'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 text-center text-slate-400 text-sm">
              Món này không có tùy biến bổ sung.
            </div>
          )}

          {/* Kitchen / Bar notes */}
          <div>
            <label htmlFor="modifier-notes-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Ghi chú nhà bếp / Quầy bar (Special Request)
            </label>
            <input
              id="modifier-notes-input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Ít đá, không đường, làm nóng..."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Đơn giá kèm tùy biến</span>
            <span className="text-xl font-bold text-emerald-400">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium text-sm transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
