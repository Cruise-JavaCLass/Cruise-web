import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Flame, Clock, AlertCircle } from 'lucide-react';
import {
  posCatalogService,
  type HappyHourRuleDto,
  type OutletDto,
} from '../../services/posCatalogService';

interface HappyHourConfigModalProps {
  isOpen: boolean;
  outletId?: number;
  outlets: OutletDto[];
  onClose: () => void;
  onSuccess: () => void;
}

export const HappyHourConfigModal: React.FC<HappyHourConfigModalProps> = ({
  isOpen,
  outletId,
  outlets,
  onClose,
  onSuccess,
}) => {
  const [rules, setRules] = useState<HappyHourRuleDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New rule form
  const [name, setName] = useState('Golden Hour Discount');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [discountPercent, setDiscountPercent] = useState<number>(20);
  const [targetOutletId, setTargetOutletId] = useState<number | undefined>(outletId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await posCatalogService.getHappyHourRules(outletId);
      setRules(data);
    } catch {
      setRules([]);
    } finally {
      setIsLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    if (isOpen) {
      setTargetOutletId(outletId);
      void loadRules();
    }
  }, [isOpen, outletId, loadRules]);

  if (!isOpen) return null;

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await posCatalogService.createHappyHourRule({
        name,
        startTime,
        endTime,
        discountPercent,
        outletId: targetOutletId,
        daysOfWeek: 'ALL',
        isActive: true,
      });
      await loadRules();
      setName('');
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Không thể tạo quy tắc Happy Hour. Vui lòng thử lại!';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: number) => {
    try {
      await posCatalogService.deleteHappyHourRule(id);
      await loadRules();
      onSuccess();
    } catch {
      setError('Không thể xóa quy tắc.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hh-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4 animate-in fade-in"
    >
      <div className="bg-white border border-[#E5E0D7] w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E0D7] bg-[#F7F4ED]">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#C5A572]" />
            <h3 id="hh-config-title" className="text-base font-serif font-bold text-[#102A43]">
              Cấu Hình Khung Giờ Happy Hour
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#687787] hover:text-[#102A43] rounded-lg hover:bg-[#E5E0D7]/60 transition"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Rule Form */}
          <form onSubmit={handleCreateRule} className="p-4 rounded-xl bg-[#F7F4ED]/60 border border-[#E5E0D7] space-y-3">
            <h4 className="text-xs font-serif font-bold text-[#102A43] uppercase tracking-wider">Thêm Quy Tắc Mới</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="hh-rule-name" className="text-[11px] font-semibold text-[#687787] block mb-1">Tên chương trình</label>
                <input
                  id="hh-rule-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Sunset Cocktails 20% Off"
                  className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-1.5 text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                  required
                />
              </div>

              <div>
                <label htmlFor="hh-rule-start-time" className="text-[11px] font-semibold text-[#687787] block mb-1">Giờ bắt đầu (HH:mm)</label>
                <input
                  id="hh-rule-start-time"
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="17:00"
                  className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-1.5 text-xs text-[#252B32] font-mono focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                  required
                />
              </div>

              <div>
                <label htmlFor="hh-rule-end-time" className="text-[11px] font-semibold text-[#687787] block mb-1">Giờ kết thúc (HH:mm)</label>
                <input
                  id="hh-rule-end-time"
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="19:00"
                  className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-1.5 text-xs text-[#252B32] font-mono focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                  required
                />
              </div>

              <div>
                <label htmlFor="hh-rule-discount-percent" className="text-[11px] font-semibold text-[#687787] block mb-1">Tỷ lệ giảm giá (%)</label>
                <input
                  id="hh-rule-discount-percent"
                  type="number"
                  min="1"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number.parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-1.5 text-xs text-[#252B32] font-mono focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                  required
                />
              </div>

              <div>
                <label htmlFor="hh-rule-target-outlet" className="text-[11px] font-semibold text-[#687787] block mb-1">Áp dụng cho điểm bán</label>
                <select
                  id="hh-rule-target-outlet"
                  value={targetOutletId || ''}
                  onChange={(e) => setTargetOutletId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-white border border-[#E5E0D7] rounded-xl px-3 py-1.5 text-xs text-[#252B32] focus:outline-none focus:border-[#102A43] focus:ring-1 focus:ring-[#102A43]"
                >
                  <option value="">Tất cả điểm bán</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-[#102A43] hover:bg-[#183B5B] text-white font-bold text-xs flex items-center gap-1 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang thêm...' : 'Lưu quy tắc'}</span>
              </button>
            </div>
          </form>

          {/* Existing Rules List */}
          <div>
            <h4 className="text-xs font-serif font-bold text-[#102A43] uppercase tracking-wider mb-2">
              Quy Tắc Đang Kích Hoạt ({rules.length})
            </h4>

            {isLoading ? (
              <p className="text-xs text-[#687787] italic py-4 text-center">Đang tải...</p>
            ) : rules.length === 0 ? (
              <p className="text-xs text-[#687787] italic py-4 text-center">
                Chưa có quy tắc Happy Hour nào được cấu hình.
              </p>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 rounded-xl bg-white border border-[#E5E0D7] flex items-center justify-between text-xs hover:border-[#102A43]/30 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#102A43]">{rule.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#C5A572]/20 text-[#8C6D37] font-bold text-[10px] border border-[#C5A572]/40">
                          -{rule.discountPercent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#687787] text-[11px] mt-0.5 font-mono">
                        <Clock className="w-3 h-3 text-[#397C80]" />
                        <span>
                          {rule.startTime} - {rule.endTime}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDeleteRule(rule.id)}
                      className="text-[#687787] hover:text-rose-600 p-1.5 transition"
                      title="Xóa quy tắc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E0D7] bg-[#F7F4ED]/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E0D7] text-[#687787] hover:bg-[#F7F4ED] hover:text-[#102A43] text-xs font-semibold transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
