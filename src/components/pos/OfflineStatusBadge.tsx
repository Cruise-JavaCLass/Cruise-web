import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Database } from 'lucide-react';
import { transactionQueueEngine } from '../../services/transactionQueueEngine';
import type { QueuedTransactionRecord } from '../../services/posIndexedDbStore';

interface OfflineStatusBadgeProps {
  onOpenInspector?: () => void;
}

export const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({ onOpenInspector }) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [latencyGrade, setLatencyGrade] = useState<'GOOD' | 'FAIR' | 'POOR'>('GOOD');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Subscribe to transaction queue engine
    const unsubscribe = transactionQueueEngine.subscribe((queue: QueuedTransactionRecord[]) => {
      setPendingCount(queue.filter((q) => q.status !== 'SYNCED').length);
    });

    // Simple latency check ping
    const measureLatency = async () => {
      if (!navigator.onLine) {
        setLatencyGrade('POOR');
        return;
      }
      const start = performance.now();
      try {
        await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
        const duration = performance.now() - start;
        if (duration < 150) setLatencyGrade('GOOD');
        else if (duration < 450) setLatencyGrade('FAIR');
        else setLatencyGrade('POOR');
      } catch {
        setLatencyGrade('POOR');
      }
    };

    const interval = setInterval(measureLatency, 30000);
    void measureLatency();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Network Connectivity Badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
          isOnline
            ? latencyGrade === 'GOOD'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : latencyGrade === 'FAIR'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-orange-50 border-orange-200 text-orange-800'
            : 'bg-rose-50 border-rose-200 text-rose-800 animate-pulse'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>
              {latencyGrade === 'GOOD' ? 'Trực tuyến (Tốt)' : latencyGrade === 'FAIR' ? 'Trực tuyến (Chậm)' : 'Chập chờn'}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Ngoại tuyến (Offline Mode)</span>
          </>
        )}
      </div>

      {/* Persistent Queue Counter */}
      <button
        type="button"
        onClick={onOpenInspector}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
          pendingCount > 0
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 shadow-xs'
            : 'bg-white border-[#E5E0D7] text-[#687787] hover:text-[#102A43] hover:bg-[#F7F4ED]'
        }`}
      >
        <Database className="w-3.5 h-3.5" />
        <span>Hàng đợi:</span>
        <span
          className={`px-1.5 py-0.2 rounded-md font-mono text-[11px] ${
            pendingCount > 0 ? 'bg-amber-200 text-amber-950 font-bold' : 'bg-[#F7F4ED] text-[#687787]'
          }`}
        >
          {pendingCount}
        </span>
        {pendingCount > 0 && <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />}
      </button>
    </div>
  );
};
