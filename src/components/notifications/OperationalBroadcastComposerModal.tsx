import { AlertTriangle, Check, Megaphone, Send, ShieldAlert, Volume2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  type NotificationCategory,
  type NotificationScope,
  operationalNotificationService,
} from '../../services/operationalNotificationService';

interface OperationalBroadcastComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcastSuccess?: () => void;
}

export const OperationalBroadcastComposerModal: React.FC<OperationalBroadcastComposerModalProps> = ({
  isOpen,
  onClose,
  onBroadcastSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('SYSTEM');
  const [scope, setScope] = useState<NotificationScope>('ALL');
  const [targetDeck, setTargetDeck] = useState<number | undefined>(undefined);
  const [playAlertSound, setPlayAlertSound] = useState(true);
  const [requireAcknowledgment, setRequireAcknowledgment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (scope === 'DECK' && (targetDeck === undefined || isNaN(targetDeck) || targetDeck < 1 || targetDeck > 18)) {
      setErrorMsg('Vui lòng nhập số tầng hợp lệ từ 1 đến 18');
      return;
    }

    let broadcastSuccessful = false;
    try {
      const res = await operationalNotificationService.broadcastAlert({
        title,
        message,
        category,
        scope,
        targetDeck: scope === 'DECK' ? targetDeck : undefined,
        playAlertSound,
        requireAcknowledgment,
      });

      setSuccessMsg(`Đã phát thông báo thành công mã ${res.broadcastId} tới ${res.recipientCount} hành khách/thuyền viên!`);
      setTitle('');
      setMessage('');
      broadcastSuccessful = true;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi phát thông báo vận hành');
    } finally {
      setIsSubmitting(false);
    }

    if (broadcastSuccessful && onBroadcastSuccess) {
      try {
        onBroadcastSuccess();
      } catch (cbErr) {
        console.error('Error in onBroadcastSuccess callback:', cbErr);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" aria-labelledby="broadcast-composer-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-[#E5E0D7] flex flex-col text-[#252B32]">
        {/* Header */}
        <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between text-[#102A43]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white border border-[#E5E0D7] rounded-xl text-[#102A43]">
              <Megaphone className="w-5 h-5 text-[#102A43]" />
            </div>
            <div>
              <h3 id="broadcast-composer-title" className="font-bold text-lg leading-tight text-[#102A43]">Phát Thông Báo Vận Hành & Khẩn Cấp Toàn Tàu</h3>
              <p className="text-xs text-[#252B32]/70">Shipboard Operational Broadcast Dispatcher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-[#ECE7DC] transition-colors text-[#252B32]/60 hover:text-[#102A43] cursor-pointer disabled:opacity-50"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#102A43] mb-1">
              Tiêu Đề Thông Báo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cảnh báo thời tiết xấu tại Vịnh Lan Hạ"
              required
              className="w-full px-3.5 py-2.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#102A43] mb-1">
                Phân Loại Mức Độ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
              >
                <option value="SYSTEM">Hệ Thống / Thông Thường</option>
                <option value="CRITICAL">Khẩn Cấp / An Toàn (Critical)</option>
                <option value="ACTIVITY">Hoạt Động / Sự Kiện</option>
                <option value="DINING">Nhà Hàng / Ẩm Thực</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#102A43] mb-1">
                Phạm Vi Tiếp Nhận *
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as NotificationScope)}
                className="w-full px-3 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
              >
                <option value="ALL">Toàn Bộ (Khách & Thuyền Viên)</option>
                <option value="CREW_ONLY">Chỉ Thuyền Viên (Crew Only)</option>
                <option value="PASSENGER_ONLY">Chỉ Hành Khách</option>
                <option value="DECK">Theo Số Tầng (Deck)</option>
              </select>
            </div>
          </div>

          {scope === 'DECK' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#102A43] mb-1">
                Số Tầng Tiếp Nhận (Deck Number)
              </label>
              <input
                type="number"
                min="1"
                max="18"
                required
                value={targetDeck || ''}
                onChange={(e) => setTargetDeck(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="VD: Tầng 4, 7, 9..."
                className="w-full px-3.5 py-2 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#102A43] mb-1">
              Nội Dung Chi Tiết *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo cụ thể..."
              required
              className="w-full px-3.5 py-2.5 bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl text-xs text-[#252B32] placeholder-[#252B32]/40 focus:outline-none focus:ring-2 focus:ring-[#102A43]/10 focus:border-[#102A43] resize-none"
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-6 pt-1 text-xs text-[#252B32]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={playAlertSound}
                onChange={(e) => setPlayAlertSound(e.target.checked)}
                className="w-4 h-4 rounded text-[#102A43] focus:ring-[#102A43]"
              />
              <span className="flex items-center gap-1 text-xs font-medium">
                <Volume2 className="w-4 h-4 text-[#252B32]/60" />
                Phát âm thanh chuông cảnh báo
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAcknowledgment}
                onChange={(e) => setRequireAcknowledgment(e.target.checked)}
                className="w-4 h-4 rounded text-[#102A43] focus:ring-[#102A43]"
              />
              <span className="flex items-center gap-1 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 text-[#252B32]/60" />
                Bắt buộc bấm xác nhận đã đọc
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#E5E0D7] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#102A43] bg-[#F7F4ED] hover:bg-[#ECE7DC] border border-[#E5E0D7] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#102A43] hover:bg-[#0B1F33] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang Phát...' : 'Phát Thông Báo Ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
