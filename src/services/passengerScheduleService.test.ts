import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './api';
import { passengerScheduleService } from './passengerScheduleService';

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('passengerScheduleService Error Propagation & Offline Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('rethrows API errors without returning cached data directly from getPersonalSchedule', async () => {
    // Populate cache first to ensure getPersonalSchedule does NOT swallow the error
    passengerScheduleService.saveToCache(1, 1, 'my', {
      passengerId: 1,
      passengerName: 'Test Passenger',
      cabinNumber: '101',
      dayNumber: 1,
      scope: 'my',
      totalItems: 1,
      totalConflicts: 0,
      items: [],
      conflicts: [],
    });

    // Mock API failure
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network connection timeout'));

    // Verify error is rethrown and not swallowed by cache
    await expect(passengerScheduleService.getPersonalSchedule(1, 1, 'my')).rejects.toThrow(
      'Network connection timeout'
    );
  });

  it('stores CacheWrapper.cachedAt as an ISO timestamp', () => {
    passengerScheduleService.saveToCache(2, 2, 'cabin', {
      passengerId: 2,
      passengerName: 'Cabin Passenger',
      cabinNumber: '102',
      dayNumber: 2,
      scope: 'cabin',
      totalItems: 0,
      totalConflicts: 0,
      items: [],
      conflicts: [],
    });

    const cached = passengerScheduleService.loadFromCache(2, 2, 'cabin');
    expect(cached).not.toBeNull();
    expect(cached?.cachedAt).toBeDefined();
    // Validate ISO timestamp format (e.g. 2026-10-21T08:11:00.000Z)
    expect(new Date(cached!.cachedAt).toISOString()).toBe(cached!.cachedAt);
  });
});
