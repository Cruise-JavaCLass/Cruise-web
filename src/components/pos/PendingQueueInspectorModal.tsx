import React, { useState, useEffect } from 'react';
import {
  Layers,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Eye,
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
    if (isOpen) {
      setQueue(transactionQueueEngine.getQueue());
      setFlushResult(null);
      const unsub = transactionQueueEngine.subscribe((updated) => {
        setQueue(updated);
        if (selectedTx) {
          const refreshed = updated.find((t) => t.id === selectedTx.id);
          setSelectedTx(refreshed || null);
        }
      });
      return () => unsub();
    }
  }, [isOpen, selectedTx]);

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
      await transactionQueueEngine.clearAll();
      setSelectedTx(null);
    }
  };

  const handleRemoveItem = async (id: string) => {
    await transactionQueueEngine.dequeue(id);
    if (selectedTx?.id === id) {
      setSelectedTx(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-amber-400">
            <Database className="w-5 h-5" />
            <h3 className="font-bold text-white text-base">
              Thanh Tra Hàng Đợi Giao Dịch Ngoại Tuyến (Offline Transaction Queue Inspector)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Panel & Summary Bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Tổng giao dịch staged:{' '}
              <strong className="text-white font-mono">{queue.length}</strong>
            </span>
            <span className="text-slate-400">
              Chờ đồng bộ:{' '}
              <strong className="text-amber-400 font-mono">
                {queue.filter((t) => t.status === 'PENDING' || t.status === 'FAILED').length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={queue.length === 0 || isFlushing}
              className="px-3 py-1.5 rounded-lg border border-rose-900/60 text-rose-400 hover:bg-rose-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Toàn Bộ
            </button>
            <button
              type="button"
              onClick={handleManualFlush}
              disabled={queue.length === 0 || isFlushing}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition shadow-sm"
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
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {flushResult.failed === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span>
                Kết quả đồng bộ: Thành công {flushResult.succeeded} / Thất bại {flushResult.failed}
              </span>
            </div>
            {flushResult.errors.length > 0 && (
              <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-amber-400/90">
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
          <div className="flex flex-col border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Hàng Đợi FIFO (Tuần tự thời gian)
              </span>
              <span className="text-slate-500 font-normal">Thứ tự ưu tiên từ trên xuống</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[46vh]">
              {queue.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 opacity-40 text-emerald-500" />
                  <span>Hàng đợi trống! Tất cả giao dịch đã được đồng bộ với server.</span>
                </div>
              ) : (
                queue.map((tx) => {
                  const isSelected = selectedTx?.id === tx.id;
                  return (
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500/70 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                            #{tx.seq}
                          </span>
                          <span className="font-semibold text-white font-mono">{tx.id}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Trạm: {tx.stationId} • Thu ngân: {tx.cashierId} • Số tiền:{' '}
                          <strong className="text-emerald-400 font-mono">${tx.totalAmount.toFixed(2)}</strong>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Tạo lúc: {new Date(tx.createdAt).toLocaleTimeString()}
                          {tx.retryCount > 0 && ` • Thử lại: ${tx.retryCount} lần`}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.status === 'PENDING'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : tx.status === 'SYNCING'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                              : tx.status === 'FAILED'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRemoveItem(tx.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition"
                          title="Hủy giao dịch này khỏi hàng đợi"
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
          <div className="flex flex-col border border-slate-800 rounded-xl bg-slate-950/50 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                Chi Tiết Raw Payload & Metadata
              </span>
              {selectedTx && <span className="text-slate-500 font-mono text-[11px]">{selectedTx.id}</span>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 max-h-[46vh]">
              {selectedTx ? (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trạng thái:</span>
                      <span className="font-bold text-amber-400 font-mono">{selectedTx.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thứ tự FIFO Sequence:</span>
                      <span className="font-bold text-white font-mono">#{selectedTx.seq}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số tiền:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        ${selectedTx.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    {selectedTx.lastError && (
                      <div className="pt-2 border-t border-slate-800 text-rose-300">
                        <span className="text-slate-400 block text-[11px]">Lỗi lần thử gần nhất:</span>
                        <span className="text-xs">{selectedTx.lastError}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">
                      Raw Transaction JSON Payload (Idempotency Payload):
                    </span>
                    <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                      {JSON.stringify(selectedTx.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500 text-xs">
                  Chọn một giao dịch từ danh sách bên trái để xem chi tiết raw payload
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
