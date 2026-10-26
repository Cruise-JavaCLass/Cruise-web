import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Database,
  Code,
} from 'lucide-react';
import {
  transactionQueueEngine,
} from '../../services/transactionQueueEngine';
import type { QueuedTransactionRecord } from '../../services/posIndexedDbStore';

interface PendingQueueInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PendingQueueInspectorModal: React.FC<PendingQueueInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [queue, setQueue] = useState<QueuedTransactionRecord[]>([]);
  const [selectedTx, setSelectedTx] = useState<QueuedTransactionRecord | null>(null);
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushResult, setFlushResult] = useState<{
    succeeded: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFlushResult(null);
    const unsub = transactionQueueEngine.subscribe((updated) => {
      setQueue(updated);
      setSelectedTx((prev) => (prev ? updated.find((t) => t.id === prev.id) ?? null : null));
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualFlush = async () => {
    setIsFlushing(true);
    setFlushResult(null);
    try {
      const result = await transactionQueueEngine.flushQueue();
      setFlushResult(result);
    } catch {
      setFlushResult({ succeeded: 0, failed: 1, errors: ['Đồng bộ hàng đợi thất bại do lỗi không xác định'] });
    } finally {
      setIsFlushing(false);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ hàng đợi ngoại tuyến? Các giao dịch chưa đồng bộ sẽ bị mất vĩnh viễn!')) {
      try {
        await transactionQueueEngine.clearAll();
        setSelectedTx(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Không thể xóa hàng đợi lưu trữ cục bộ.';
        setFlushResult({
          succeeded: 0,
          failed: 1,
          errors: [errorMsg],
        });
      }
    }
  };

  const handleRemoveItem = async (tx: QueuedTransactionRecord) => {
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn hủy giao dịch #${tx.seq} (${tx.id}) khỏi hàng đợi? Giao dịch này sẽ bị xóa vĩnh viễn và không được gửi lên server.`
    );
    if (!isConfirmed) return;

    try {
      await transactionQueueEngine.dequeue(tx.id);
      if (selectedTx?.id === tx.id) {
        setSelectedTx(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : `Không thể xóa giao dịch #${tx.seq} khỏi bộ nhớ cục bộ.`;
      setFlushResult({
        succeeded: 0,
        failed: 1,
        errors: [errorMsg],
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F33]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E5E0D7] rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] text-[#252B32]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D7] flex items-center justify-between bg-[#F7F4ED]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#102A43]/5 border border-[#102A43]/10 flex items-center justify-center text-[#102A43]">
              <Database className="w-4 h-4" />
            </div>
            <h3 id="queue-inspector-title" className="font-serif font-bold text-[#102A43] text-base">
              Thanh Tra Hàng Đợi Giao Dịch Ngoại Tuyến (Offline Transaction Queue Inspector)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng thanh tra hàng đợi"
            className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Panel & Summary Bar */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#E5E0D7] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-[#687787]">
              Tổng giao dịch staged:{' '}
              <strong className="text-[#102A43] font-mono">{queue.length}</strong>
            </span>
            <span className="text-[#687787]">
              Chờ đồng bộ:{' '}
              <strong className="text-[#B45309] font-mono">
                {queue.filter((t) => t.status === 'PENDING' || t.status === 'FAILED').length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={queue.length === 0 || isFlushing}
              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Toàn Bộ
            </button>
            <button
              type="button"
              onClick={handleManualFlush}
              disabled={queue.length === 0 || isFlushing}
              className="px-4 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#183B5B] text-white font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {isFlushing ? 'Đang đồng bộ...' : 'Đẩy Hàng Đợi (Manual Flush)'}
            </button>
          </div>
        </div>

        {/* Flush Result Banner */}
        {flushResult && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border text-xs flex flex-col gap-1 ${
              flushResult.failed === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {flushResult.failed === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span>
                Kết quả đồng bộ: Thành công {flushResult.succeeded} / Thất bại {flushResult.failed}
              </span>
            </div>
            {flushResult.errors.length > 0 && (
              <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-amber-800">
                {flushResult.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Content Body: Split view (List & Details) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Left Column: Transaction FIFO Queue List */}
          <div className="flex flex-col border border-[#E5E0D7] rounded-xl bg-[#FAF8F5]/60 overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F7F4ED] border-b border-[#E5E0D7] flex justify-between items-center text-xs font-semibold text-[#102A43]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#397C80]" />
                Hàng Đợi FIFO (Tuần tự thời gian)
              </span>
              <span className="text-[#687787] font-normal">Thứ tự ưu tiên từ trên xuống</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[46vh]">
              {queue.length === 0 ? (
                <div className="py-12 text-center text-[#687787] text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 opacity-40 text-emerald-600" />
                  <span>Hàng đợi trống! Tất cả giao dịch đã được đồng bộ với server.</span>
                </div>
              ) : (
                queue.map((tx) => {
                  const isSelected = selectedTx?.id === tx.id;
                  return (
                    <div
                      key={tx.id}
                      className={`p-3 rounded-xl border text-xs transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#F7F4ED] border-[#C5A572] shadow-sm'
                          : 'bg-white border-[#E5E0D7] hover:border-[#C5A572]/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTx(tx)}
                        className="flex-1 text-left space-y-1 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#102A43] rounded"
                        aria-label={`Xem chi tiết giao dịch #${tx.seq} ${tx.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] text-[10px] font-mono text-[#687787] border border-[#E5E0D7]">
                            #{tx.seq}
                          </span>
                          <span className="font-semibold text-[#102A43] font-mono">{tx.id}</span>
                        </div>
                        <p className="text-[11px] text-[#687787]">
                          Trạm: {tx.stationId} • Thu ngân: {tx.cashierId} • Số tiền:{' '}
                          <strong className="text-[#047857] font-mono font-semibold">
                            ${Number(tx.totalAmount || 0).toFixed(2)}
                          </strong>
                        </p>
                        <p className="text-[10px] text-[#8C9BA5]">
                          Tạo lúc: {new Date(tx.createdAt).toLocaleTimeString()}
                          {tx.retryCount > 0 && ` • Thử lại: ${tx.retryCount} lần`}
                        </p>
                      </button>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : tx.status === 'SYNCING'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200 animate-pulse'
                              : tx.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {tx.status}
                        </span>
                        <button
                          type="button"
                          disabled={tx.status === 'SYNCING' || isFlushing}
                          onClick={() => void handleRemoveItem(tx)}
                          className={`p-1 rounded transition ${
                            tx.status === 'SYNCING' || isFlushing
                              ? 'text-[#C5CCD3] cursor-not-allowed opacity-40'
                              : 'text-[#687787] hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                          }`}
                          title={
                            tx.status === 'SYNCING'
                              ? 'Giao dịch đang được đồng bộ, không thể hủy'
                              : isFlushing
                              ? 'Hàng đợi đang đồng bộ, không thể hủy'
                              : 'Hủy giao dịch này khỏi hàng đợi'
                          }
                          aria-label={`Hủy giao dịch #${tx.seq}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Transaction Raw Payload & Metadata Inspector */}
          <div className="flex flex-col border border-[#E5E0D7] rounded-xl bg-[#FAF8F5]/60 overflow-hidden">
            <div className="px-4 py-2.5 bg-[#F7F4ED] border-b border-[#E5E0D7] flex justify-between items-center text-xs font-semibold text-[#102A43]">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-[#397C80]" />
                Chi Tiết Raw Payload & Metadata
              </span>
              {selectedTx && <span className="text-[#687787] font-mono text-[11px]">{selectedTx.id}</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-h-[46vh]">
              {selectedTx ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#E5E0D7] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[#687787]">Trạng thái:</span>
                      <span className="font-bold text-[#B45309] font-mono">{selectedTx.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#687787]">Thứ tự FIFO Sequence:</span>
                      <span className="font-bold text-[#102A43] font-mono">#{selectedTx.seq}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#687787]">Số tiền:</span>
                      <span className="font-bold text-[#047857] font-mono">
                        ${Number(selectedTx.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    {selectedTx.lastError && (
                      <div className="pt-2 border-t border-[#E5E0D7] text-rose-700">
                        <span className="text-[#687787] block text-[11px]">Lỗi lần thử gần nhất:</span>
                        <span className="text-xs">{selectedTx.lastError}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[#687787] text-[11px] block mb-1 font-medium">
                      Raw Transaction JSON Payload (Idempotency Payload):
                    </span>
                    <pre className="p-3 bg-[#0B1F33] rounded-xl border border-[#102A43] font-mono text-[11px] text-[#E5E0D7] overflow-x-auto shadow-inner">
                      {JSON.stringify(selectedTx.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-[#687787] text-xs">
                  Chọn một giao dịch từ danh sách bên trái để xem chi tiết raw payload
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F7F4ED] border-t border-[#E5E0D7] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#102A43] bg-white border border-[#E5E0D7] hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
