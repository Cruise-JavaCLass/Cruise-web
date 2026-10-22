import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { NetworkQualityStats, SatelliteLinkStatus } from '../../services/networkSyncTypes';
import { networkQualityMonitor, networkSyncService } from '../../services/networkSyncService';

interface MarineSatelliteSignalIndicatorProps {
  onQualityChange?: (stats: NetworkQualityStats) => void;
  syncQueueLength?: number;
  onTriggerSyncNow?: (batchSize: number) => Promise<void>;
}

export const MarineSatelliteSignalIndicator: React.FC<MarineSatelliteSignalIndicatorProps> = ({
  onQualityChange,
  syncQueueLength = 0,
  onTriggerSyncNow,
}) => {
  const [stats, setStats] = useState<NetworkQualityStats>({
    latencyMs: 80,
    packetLossPercent: 0,
    linkStatus: 'EXCELLENT',
    lastHeartbeatTime: Date.now(),
    recommendedBatchSize: 50,
    recommendedSyncIntervalSec: 5,
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);

  const performHeartbeat = useCallback(async () => {
    const tStart = performance.now();
    try {
      await networkSyncService.pingHeartbeat(stats.latencyMs);
      const latency = Math.round(performance.now() - tStart);
      const newStats = networkQualityMonitor.recordPing(latency, true);
      setStats(newStats);
      if (onQualityChange) onQualityChange(newStats);
    } catch {
      const newStats = networkQualityMonitor.recordPing(-1, false);
      setStats(newStats);
      if (onQualityChange) onQualityChange(newStats);
    }
  }, [stats.latencyMs, onQualityChange]);

  // Periodic heartbeat based on current recommended interval
  useEffect(() => {
    const interval = setInterval(() => {
      void performHeartbeat();
    }, stats.recommendedSyncIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [stats.recommendedSyncIntervalSec, performHeartbeat]);

  // Adaptive background sync trigger
  useEffect(() => {
    if (syncQueueLength === 0 || isSyncingRef.current || stats.linkStatus === 'OFFLINE') {
      return;
    }

    const timer = setTimeout(async () => {
      if (onTriggerSyncNow && !isSyncingRef.current) {
        isSyncingRef.current = true;
        setIsSyncing(true);
        try {
          await onTriggerSyncNow(stats.recommendedBatchSize);
        } finally {
          isSyncingRef.current = false;
          setIsSyncing(false);
        }
      }
    }, stats.recommendedSyncIntervalSec * 1000);

    return () => clearTimeout(timer);
  }, [syncQueueLength, stats, onTriggerSyncNow]);

  const getStatusBadge = (status: SatelliteLinkStatus) => {
    switch (status) {
      case 'EXCELLENT':
        return {
          color: 'bg-emerald-500',
          textColor: 'text-emerald-700',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: 'Vệ tinh tốt',
        };
      case 'FAIR':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Vệ tinh ổn định',
        };
      case 'POOR':
        return {
          color: 'bg-amber-500',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Vệ tinh yếu',
        };
      case 'DEGRADED':
        return {
          color: 'bg-rose-500',
          textColor: 'text-rose-700',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          label: 'Vệ tinh chập chờn',
        };
      case 'OFFLINE':
      default:
        return {
          color: 'bg-gray-400',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          label: 'Mất sóng vệ tinh',
        };
    }
  };

  const badge = getStatusBadge(stats.linkStatus);

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm transition-all ${badge.bgColor} ${badge.borderColor}`}
      role="status"
      aria-label="Tình trạng sóng vệ tinh hàng hải"
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-2.5 w-2.5 rounded-full ${badge.color} animate-pulse`} />
        <span className={`font-bold ${badge.textColor}`}>{badge.label}</span>
      </div>

      <span className="text-gray-300">|</span>

      <div className="flex items-center gap-2 text-gray-600">
        <span>{stats.latencyMs}ms</span>
        {stats.packetLossPercent > 0 && (
          <span className="font-semibold text-rose-600">Loss {stats.packetLossPercent}%</span>
        )}
      </div>

      {syncQueueLength > 0 && (
        <>
          <span className="text-gray-300">|</span>
          <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
            {isSyncing ? 'Đang đồng bộ...' : `Hàng đợi: ${syncQueueLength} (Batch ${stats.recommendedBatchSize})`}
          </span>
        </>
      )}
    </div>
  );
};
