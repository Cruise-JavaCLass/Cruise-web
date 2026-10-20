import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Clock,
  Database,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Radio,
  Server,
  Zap,
} from 'lucide-react';
import {
  offlineSyncManager,
  type OfflinePendingTransaction,
  type SyncHistoryLog,
} from '../../services/offlineSyncService';

interface SyncControlPanelProps {
  onSyncComplete?: () => void;
}

export const SyncControlPanel: React.FC<SyncControlPanelProps> = ({ onSyncComplete }) => {
  const [queue, setQueue] = useState<OfflinePendingTransaction[]>([]);
  const [history, setHistory] = useState<SyncHistoryLog[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'FAILED' | 'SUCCESS'>('ALL');
// auto retry configuration

  const reloadData = () => {
    setQueue(offlineSyncManager.getPendingQueue());
    setHistory(offlineSyncManager.getSyncHistory());
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const res = await offlineSyncManager.syncBatchWithRetry('POS-TERMINAL-DECK-9', 3, 300);
      setSyncStatusMsg({
        text: `Đồng bộ thành công! Đã xử lý ${res.successfullyProcessed} GD, trùng lặp: ${res.duplicateCount}, lỗi: ${res.failedCount}.`,
        isError: res.failedCount > 0,
      });
      reloadData();
      onSyncComplete?.();
    } catch (err: any) {
      setSyncStatusMsg({
        text: err?.message || 'Lỗi kết nối khi đồng bộ với máy chủ!',
        isError: true,
      });
      reloadData();
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    }
  };

  const handleClearQueue = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ hàng đợi ngoại tuyến?')) {
      offlineSyncManager.clearQueue();
      reloadData();
    }
  };

  const handleClearHistory = () => {
    offlineSyncManager.clearHistory();
    reloadData();
  };

  const handleCreateMockOfflineTx = () => {
    const mockTx = {
      transactionUuid: `TX-OFFLINE-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      stationId: 'BAR-DECK-9',
      cashierId: 'CASHIER-OFFLINE',
      cabinNumber: 'CABIN-7012',
      paymentMethod: 'CABIN_FOLIO',
      subtotal: 25.0,
      tax: 0,
      gratuity: 4.5,
      notes: 'Offline buffer maritime order',
      items: [
        {
          itemCode: 'BEV-MOCK-01',
          itemName: 'Special Cocktail (Buffered)',
          category: 'BEVERAGE',
          quantity: 1,
          unitPrice: 25.0,
        },
      ],
    };
    offlineSyncManager.enqueueTransaction(mockTx);
    reloadData();
  };

  const filteredHistory = history.filter((h) => {
    if (filterMode === 'FAILED') return h.status === 'FAILED' || h.failedCount > 0;
    if (filterMode === 'SUCCESS') return h.status === 'SUCCESS' && h.failedCount === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Hàng Đợi Ngoại Tuyến</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{queue.length} GD</div>
            <span className="text-[11px] text-slate-500">Chờ kết nối máy chủ</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Lịch Sử Đợt Đồng Bộ</span>
            <div className="text-2xl font-black text-white mt-1">{history.length} Lần</div>
            <span className="text-[11px] text-slate-500">Ghi nhận nhật ký</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Chiến Lược Thử Lại (Retry)</span>
            <div className="text-sm font-bold text-emerald-400 mt-1">Exponential Backoff</div>
            <span className="text-[11px] text-slate-500">3 Lần thử (500ms → 1s → 2s)</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Vệ Tinh Hải Trình</span>
            <div className="text-sm font-bold text-cyan-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              POS-TERMINAL-DECK-9
            </div>
            <span className="text-[11px] text-slate-500">Cơ chế khử trùng lặp (Idempotent)</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Server className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Đang Đồng Bộ...' : 'Đồng Bộ Thủ Công Ngay'}
          </button>

          <button
            onClick={handleCreateMockOfflineTx}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Thêm một đơn hàng mẫu vào hàng đợi ngoại tuyến để kiểm thử"
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            + Giả Lập Giao Dịch Offline
          </button>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={handleClearQueue}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa Hàng Đợi ({queue.length})
            </button>
          )}

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Xóa Nhật Ký Lịch Sử
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-3 animate-in fade-in ${
            syncStatusMsg.isError
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          {syncStatusMsg.isError ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          )}
          <span className="font-medium">{syncStatusMsg.text}</span>
        </div>
      )}

      {/* Two-column layout: Queue Table & History Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Queue Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                Hàng Đợi Giao Dịch Ngoại Tuyến (Offline Queue)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Các giao dịch được lưu cục bộ trên bộ nhớ máy POS khi mất sóng
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {queue.length} Đang Chờ
            </span>
          </div>

          <div className="overflow-y-auto max-h-96 divide-y divide-slate-800">
            {queue.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Hàng đợi ngoại tuyến trống. Mọi giao dịch POS đều đã được đồng bộ với máy chủ!
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="p-3.5 hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-[11px]">{item.payload?.transactionUuid || item.id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.payload?.paymentMethod || 'CABIN_FOLIO'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Cabin: {item.payload?.cabinNumber || 'N/A'}</span>
                      <span>Trạm: {item.payload?.stationId || 'BAR-DECK-9'}</span>
                      <span>Mục: {item.payload?.items?.length || 1} SP</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white text-xs">
                      ${(item.payload?.subtotal || item.payload?.totalAmount || 0).toFixed(2)}
                    </div>
                    <button
                      onClick={() => {
                        offlineSyncManager.removePendingTransaction(item.id);
                        reloadData();
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 mt-1 cursor-pointer"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sync History Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Lịch Sử Đợt Đồng Bộ & Nhật Ký Lỗi (Sync History)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nhật ký các lần đồng bộ lô, kết quả khử trùng lặp và phản hồi server
              </p>
            </div>
            <div className="flex gap-1 text-[10px]">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'ALL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400'}`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterMode('FAILED')}
                className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'FAILED' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400'}`}
              >
                Lỗi
              </button>
              <button
                onClick={() => setFilterMode('SUCCESS')}
                className={`px-2 py-0.5 rounded cursor-pointer ${filterMode === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400'}`}
              >
                Thành công
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-96 divide-y divide-slate-800">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                Chưa có nhật ký đồng bộ nào. Nhấn "Đồng Bộ Thủ Công Ngay" để kích hoạt.
              </div>
            ) : (
              filteredHistory.map((log) => (
                <div key={log.id} className="p-3.5 hover:bg-slate-800/40 transition-colors space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-400'
                            : log.status === 'PARTIAL'
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                      ></span>
                      <span className="font-mono text-[11px] text-slate-300 font-bold">{log.id}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : log.status === 'PARTIAL'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-[11px] text-slate-400 pt-1">
                    <div>Tổng: <strong className="text-white">{log.totalReceived}</strong></div>
                    <div>Đã nạp: <strong className="text-emerald-400">{log.successfullyProcessed}</strong></div>
                    <div>Trùng: <strong className="text-cyan-400">{log.duplicateCount}</strong></div>
                    <div>Lỗi: <strong className="text-rose-400">{log.failedCount}</strong></div>
                  </div>

                  {log.failedReasons && log.failedReasons.length > 0 && (
                    <div className="mt-1 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 space-y-0.5">
                      {log.failedReasons.map((reason, idx) => (
                        <div key={idx} className="truncate">• {reason}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
