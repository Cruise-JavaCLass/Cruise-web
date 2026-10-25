export type SatelliteLinkStatus = 'EXCELLENT' | 'FAIR' | 'POOR' | 'DEGRADED' | 'OFFLINE';

export interface NetworkHeartbeatResponse {
  clientEchoTimestamp?: number;
  serverTimestamp: string;
  serverProcessingTimeMs: number;
  satelliteLinkStatus: SatelliteLinkStatus;
  recommendedBatchSize: number;
  recommendedSyncIntervalSec: number;
}

export interface AdaptiveChunkSyncRequest {
  deviceId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  reportedLatencyMs: number;
  clientSyncTimestamp?: string;
  transactions: any[];
}

export interface AdaptiveChunkSyncResponse {
  deviceId: string;
  chunkIndex: number;
  totalChunks: number;
  processedCount: number;
  duplicateCount: number;
  failedCount: number;
  processedUuids: string[];
  duplicateUuids: string[];
  failedReasons: string[];
  nextRecommendedChunkSize: number;
  nextBackoffMs: number;
  rateLimited: boolean;
}

export interface NetworkQualityStats {
  latencyMs: number;
  packetLossPercent: number;
  linkStatus: SatelliteLinkStatus;
  lastHeartbeatTime: number;
  recommendedBatchSize: number;
  recommendedSyncIntervalSec: number;
}
