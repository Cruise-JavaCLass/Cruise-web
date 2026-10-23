import { AlertCircle, CheckCircle2, Database, Download, RefreshCw, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { masterDataDb, type MasterDataSyncMeta } from '../../services/masterDataIndexedDb';
import { masterDataIngestionEngine, type MasterDataSyncProgress } from '../../services/masterDataIngestionService';

interface MasterDataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  outletId?: number;
  onSyncSuccess?: () => void;
}

export const MasterDataSyncModal: React.FC<MasterDataSyncModalProps> = ({
  isOpen,
  onClose,
  outletId,
  onSyncSuccess,
}) => {
  const [progress, setProgress] = useState<MasterDataSyncProgress>(
    masterDataIngestionEngine.getCurrentProgress()
  );
  const [syncMeta, setSyncMeta] = useState<MasterDataSyncMeta | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    void masterDataDb.getSyncMeta(outletId).then(setSyncMeta);

    const unsubscribe = masterDataIngestionEngine.subscribe((p) => {
      setProgress(p);
      if (p.stage === 'COMPLETED' || p.stage === 'ERROR') {
        setIsSyncing(false);
        void masterDataDb.getSyncMeta(outletId).then(setSyncMeta);
      }
    });

    return () => unsubscribe();
  }, [isOpen, outletId]);

  if (!isOpen) return null;

  const handleStartSync = async (forceFull: boolean) => {
    setIsSyncing(true);
    const result = await masterDataIngestionEngine.syncMasterData(outletId, forceFull);
    if (result.success && onSyncSuccess) {
      onSyncSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Database className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Đồng Bộ Dữ Liệu Ngoại Tuyến (Master Data)</h3>
              <p className="text-xs text-blue-100 opacity-90">Pre-caching sản phẩm, bảng giá & quy tắc bán hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white disabled:opacity-50"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Lần đồng bộ gần nhất:</span>
              <span className="font-semibold text-slate-800">
                {syncMeta ? new Date(syncMeta.lastSyncedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Số mặt hàng trong bộ nhớ máy:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {syncMeta?.productCount || 0} sản phẩm
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Mã phiên bản (Version Hash):</span>
              <span className="font-mono text-xs text-slate-600 truncate max-w-[200px]">
                {syncMeta?.etag || 'N/A'}
              </span>
            </div>
          </div>

          {/* Progress Bar & Status */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-slate-700">{progress.message}</span>
              <span className="font-bold text-indigo-600">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progress.stage === 'ERROR'
                    ? 'bg-rose-500'
                    : progress.stage === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : 'bg-indigo-600 animate-pulse'
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {progress.error && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{progress.error}</span>
              </div>
            )}
            {progress.stage === 'COMPLETED' && (
              <div className="flex items-center gap-2 mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Dữ liệu ngoại tuyến đã sẵn sàng để phục vụ bán hàng khi mất sóng ngoài biển khơi!</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => handleStartSync(false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Đồng Bộ Delta (Nhanh)
          </button>
          <button
            type="button"
            onClick={() => handleStartSync(true)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:bg-slate-100 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Tải Lại Toàn Bộ (Full)
          </button>
        </div>
      </div>
    </div>
  );
};
