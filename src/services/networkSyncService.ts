import { apiClient } from './api';
import type {
  NetworkHeartbeatResponse,
  AdaptiveChunkSyncRequest,
  AdaptiveChunkSyncResponse,
  NetworkQualityStats,
  SatelliteLinkStatus,
} from './networkSyncTypes';

export class NetworkQualityMonitor {
  private samples: Array<{ ok: boolean; latency: number }> = [];
  private maxHistoryLength = 10;

  classifyQuality(latency: number, packetLoss: number): SatelliteLinkStatus {
    if (packetLoss >= 50 || latency < 0) return 'OFFLINE';
    if (packetLoss >= 20 || latency > 1500) return 'DEGRADED';
    if (packetLoss >= 10 || latency > 500) return 'POOR';
    if (latency > 150) return 'FAIR';
    return 'EXCELLENT';
  }

  recordPing(latencyMs: number, success: boolean): NetworkQualityStats {
    this.samples.push({ ok: success, latency: latencyMs });
    if (this.samples.length > this.maxHistoryLength) {
      this.samples.shift();
    }

    const okLatencies = this.samples.filter((s) => s.ok).map((s) => s.latency);
    const missed = this.samples.length - okLatencies.length;
    const packetLoss = (missed / this.samples.length) * 100;
    const avgLatency =
      okLatencies.length > 0
        ? okLatencies.reduce((a, b) => a + b, 0) / okLatencies.length
        : 9999;

    const linkStatus = this.classifyQuality(avgLatency, packetLoss);

    let batchSize = 30;
    let interval = 5;
    if (linkStatus === 'EXCELLENT') {
      batchSize = 50;
      interval = 5;
    } else if (linkStatus === 'FAIR') {
      batchSize = 25;
      interval = 10;
    } else if (linkStatus === 'POOR') {
      batchSize = 10;
      interval = 20;
    } else if (linkStatus === 'DEGRADED') {
      batchSize = 5;
      interval = 30;
    } else {
      batchSize = 1;
      interval = 60;
    }

    return {
      latencyMs: Math.round(avgLatency),
      packetLossPercent: Math.round(packetLoss),
      linkStatus,
      lastHeartbeatTime: Date.now(),
      recommendedBatchSize: batchSize,
      recommendedSyncIntervalSec: interval,
    };
  }

  reset() {
    this.samples = [];
  }
}

export const networkQualityMonitor = new NetworkQualityMonitor();

export const networkSyncService = {
  async pingHeartbeat(reportedLatencyMs?: number): Promise<NetworkHeartbeatResponse> {
    const clientTimestamp = Date.now();
    const response = await apiClient.get<{ success: boolean; data: NetworkHeartbeatResponse }>(
      '/api/pos/network/heartbeat',
      {
        params: {
          clientTimestamp,
          reportedLatencyMs,
        },
      }
    );
    return response.data.data;
  },

  async syncAdaptiveChunk(request: AdaptiveChunkSyncRequest): Promise<AdaptiveChunkSyncResponse> {
    const response = await apiClient.post<{ success: boolean; data: AdaptiveChunkSyncResponse }>(
      '/api/pos/network/sync/adaptive-chunk',
      request
    );
    return response.data.data;
  },
};
