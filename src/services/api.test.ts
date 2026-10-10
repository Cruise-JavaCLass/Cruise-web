import { describe, it, expect, vi } from 'vitest';
import { apiClient, checkBackendHealth, getBackendInfo } from './api';

describe('API Client Service', () => {
  it('has correct default configuration', () => {
    expect(apiClient.defaults.timeout).toBe(5000);
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('checkBackendHealth returns health data on successful response', async () => {
    const mockHealthData = {
      status: 'UP',
      serverTime: '2026-10-10T20:00:00Z',
      uptimeSeconds: 120,
      memory: { totalMB: 128, usedMB: 64, freeMB: 64 },
    };

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockHealthData },
    });

    const result = await checkBackendHealth();
    expect(result).toEqual(mockHealthData);
  });

  it('checkBackendHealth returns null when request fails', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network Error'));

    const result = await checkBackendHealth();
    expect(result).toBeNull();
  });

  it('getBackendInfo returns system info on successful response', async () => {
    const mockInfoData = {
      projectName: 'Cruise Activity and Service Management System',
      module: 'Backend Gateway',
      version: '1.0.0-SNAPSHOT',
      javaVersion: '21.0.10',
      jiraStory: 'KAN-37',
      jiraTask: 'KAN-39',
    };

    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { success: true, data: mockInfoData },
    });

    const result = await getBackendInfo();
    expect(result).toEqual(mockInfoData);
  });
});
