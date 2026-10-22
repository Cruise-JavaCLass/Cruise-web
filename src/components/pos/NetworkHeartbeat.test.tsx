import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { MarineSatelliteSignalIndicator } from './MarineSatelliteSignalIndicator';
import { NetworkQualityMonitor, networkSyncService } from '../../services/networkSyncService';

describe('NetworkQualityMonitor (Classification & Degradation)', () => {
  let monitor: NetworkQualityMonitor;

  beforeEach(() => {
    monitor = new NetworkQualityMonitor();
  });

  it('classifies latencies and packet losses into maritime quality buckets', () => {
    expect(monitor.classifyQuality(80, 0)).toBe('EXCELLENT');
    expect(monitor.classifyQuality(250, 0)).toBe('FAIR');
    expect(monitor.classifyQuality(800, 0)).toBe('POOR');
    expect(monitor.classifyQuality(1600, 0)).toBe('DEGRADED');
    expect(monitor.classifyQuality(100, 25)).toBe('DEGRADED');
    expect(monitor.classifyQuality(100, 60)).toBe('OFFLINE');
  });

  it('adapts batch size and sync interval based on link quality', () => {
    const stats1 = monitor.recordPing(50, true);
    expect(stats1.linkStatus).toBe('EXCELLENT');
    expect(stats1.recommendedBatchSize).toBe(50);
    expect(stats1.recommendedSyncIntervalSec).toBe(5);

    // Record degraded latency
    monitor.reset();
    const stats2 = monitor.recordPing(1800, true);
    expect(stats2.linkStatus).toBe('DEGRADED');
    expect(stats2.recommendedBatchSize).toBe(5);
    expect(stats2.recommendedSyncIntervalSec).toBe(30);
  });
});

describe('MarineSatelliteSignalIndicator (KAN-428 & KAN-429)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders satellite signal status indicator and queue size badge', () => {
    render(
      <MarineSatelliteSignalIndicator
        syncQueueLength={12}
      />
    );

    expect(screen.getByText('Vệ tinh tốt')).toBeInTheDocument();
    expect(screen.getByText('80ms')).toBeInTheDocument();
    expect(screen.getByText(/Hàng đợi: 12/)).toBeInTheDocument();
  });

  it('triggers onTriggerSyncNow adaptively when queue has items', async () => {
    const onTriggerSyncNow = vi.fn().mockResolvedValue(undefined);

    render(
      <MarineSatelliteSignalIndicator
        syncQueueLength={5}
        onTriggerSyncNow={onTriggerSyncNow}
      />
    );

    // Fast-forward interval timer
    act(() => {
      vi.advanceTimersByTime(5500);
    });

    expect(onTriggerSyncNow).toHaveBeenCalledWith(50);
  });
});
