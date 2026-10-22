import api from './api';
import type {
  NetworkHeartbeatResponse,
  AdaptiveChunkSyncRequest,
  AdaptiveChunkSyncResponse,
  NetworkQualityStats,
  SatelliteLinkStatus,
} from './networkSyncTypes';

export class NetworkQualityMonitor {
  private latencyHistory: number[] = [];
  private missedPings = 0;
  private maxHistoryLength = 5;

  classifyQuality(latency: number, packetLoss: number): SatelliteLinkStatus {
    if (packetLoss >= 50 || latency < 0) return 'OFFLINE';
    if (packetLoss >= 20 || latency > 1500) return 'DEGRADED';
    if (packetLoss >= 10 || latency > 500) return 'POOR';
    if (latency > 150) return 'FAIR';
    return 'EXCELLENT';
  }

  recordPing(latencyMs: number, success: boolean): NetworkQualityStats {
    if (!success) {
      this.missedPings++;
    } else {
      this.latencyHistory.push(latencyMs);
      if (this.latencyHistory.length > this.maxHistoryLength) {
        this.latencyHistory.shift();
      }
    }

    const totalSamples = this.latencyHistory.length + this.missedPings;
    const packetLoss = totalSamples > 0 ? (this.missedPings / totalSamples) * 100 : 0;
    const avgLatency =
      this.latencyHistory.length > 0
        ? this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length
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
    this.latencyHistory = [];
    this.missedPings = 0;
  }
}

export const networkQualityMonitor = new NetworkQualityMonitor();

export const networkSyncService = {
  async pingHeartbeat(reportedLatencyMs?: number): Promise<NetworkHeartbeatResponse> {
    const clientTimestamp = Date.now();
    const response = await api.get<{ success: boolean; data: NetworkHeartbeatResponse }>(
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
    const response = await api.post<{ success: boolean; data: AdaptiveChunkSyncResponse }>(
      '/api/pos/network/sync/adaptive-chunk',
      request
    );
    return response.data.data;
  },
};
