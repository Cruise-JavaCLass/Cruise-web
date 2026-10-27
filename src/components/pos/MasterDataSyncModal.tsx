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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F33]/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#E5E0D7] flex flex-col">
        {/* Header */}
        <div className="bg-[#F7F4ED] border-b border-[#E5E0D7] px-6 py-4 flex items-center justify-between text-[#102A43]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-[#E5E0D7] shadow-xs">
              <Database className="w-5 h-5 text-[#397C80]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight text-[#102A43]">Đồng Bộ Dữ Liệu Ngoại Tuyến (Master Data)</h3>
              <p className="text-xs text-[#687787]">Pre-caching sản phẩm, bảng giá & quy tắc bán hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="p-1 rounded-lg text-[#687787] hover:text-[#102A43] hover:bg-[#E5E0D7]/60 transition-colors disabled:opacity-50"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Card */}
          <div className="bg-[#F7F4ED]/50 border border-[#E5E0D7] rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#687787] font-medium">Lần đồng bộ gần nhất:</span>
              <span className="font-semibold text-[#252B32]">
                {syncMeta ? new Date(syncMeta.lastSyncedAt).toLocaleString('vi-VN') : 'Chưa có dữ liệu'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#687787] font-medium">Số mặt hàng trong bộ nhớ máy:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#102A43]/10 text-[#102A43] border border-[#102A43]/20">
                {syncMeta?.productCount || 0} sản phẩm
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#687787] font-medium">Mã phiên bản (Version Hash):</span>
              <span className="font-mono text-xs text-[#687787] truncate max-w-[200px]">
                {syncMeta?.etag || 'N/A'}
              </span>
            </div>
          </div>

          {/* Progress Bar & Status */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-[#252B32]">{progress.message}</span>
              <span className="font-bold text-[#102A43] font-mono">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-[#F7F4ED] rounded-full h-3 overflow-hidden p-0.5 border border-[#E5E0D7]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progress.stage === 'ERROR'
                    ? 'bg-rose-600'
                    : progress.stage === 'COMPLETED'
                    ? 'bg-emerald-600'
                    : 'bg-[#102A43] animate-pulse'
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {progress.error && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
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
        <div className="bg-[#F7F4ED]/50 border-t border-[#E5E0D7] px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="px-4 py-2 text-sm font-semibold text-[#687787] hover:text-[#102A43] hover:bg-white border border-[#E5E0D7] rounded-xl transition-colors disabled:opacity-50 shadow-xs"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => handleStartSync(false)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#102A43] hover:bg-[#183B5B] rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Đồng Bộ Delta (Nhanh)
          </button>
          <button
            type="button"
            onClick={() => handleStartSync(true)}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#102A43] bg-white border border-[#E5E0D7] hover:bg-[#F7F4ED] rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#397C80]" />
            Tải Lại Toàn Bộ (Full)
          </button>
        </div>
      </div>
    </div>
  );
};
