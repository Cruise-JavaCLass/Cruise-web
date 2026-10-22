import { AlertTriangle, BellRing, Check, Megaphone, Send, ShieldAlert, Volume2, X } from 'lucide-react';
import React, { useState } from 'react';
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
      if (onBroadcastSuccess) onBroadcastSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi phát thông báo vận hành');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-red-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Phát Thông Báo Vận Hành & Khẩn Cấp Toàn Tàu</h3>
              <p className="text-xs text-rose-100 opacity-90">Shipboard Operational Broadcast Dispatcher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white disabled:opacity-50"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Tiêu Đề Thông Báo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Cảnh báo thời tiết xấu tại Vịnh Lan Hạ"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phân Loại Mức Độ *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="SYSTEM">Hệ Thống / Thông Thường</option>
                <option value="CRITICAL">Khẩn Cấp / An Toàn (Critical)</option>
                <option value="ACTIVITY">Hoạt Động / Sự Kiện</option>
                <option value="DINING">Nhà Hàng / Ẩm Thực</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Phạm Vi Tiếp Nhận *
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as NotificationScope)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Số Tầng Tiếp Nhận (Deck Number)
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={targetDeck || ''}
                onChange={(e) => setTargetDeck(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="VD: Tầng 4, 7, 9..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nội Dung Chi Tiết *
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung thông báo cụ thể..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
            />
          </div>

          {/* Options */}
          <div className="flex items-center gap-6 pt-1 text-sm text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={playAlertSound}
                onChange={(e) => setPlayAlertSound(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1 text-xs font-medium">
                <Volume2 className="w-4 h-4 text-slate-500" />
                Phát âm thanh chuông cảnh báo
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAcknowledgment}
                onChange={(e) => setRequireAcknowledgment(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1 text-xs font-medium">
                <ShieldAlert className="w-4 h-4 text-slate-500" />
                Bắt buộc bấm xác nhận đã đọc
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md transition-colors disabled:opacity-50"
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
