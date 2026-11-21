import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './api';
import { fetchExcursions } from './excursionService';

afterEach(() => vi.restoreAllMocks());
describe('live data for handheld attendance', () => {
  it('keeps an empty server list empty instead of substituting demo passengers', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { success: true, data: [] } });
    expect(await fetchExcursions(undefined, { allowMockFallback: false })).toEqual([]);
  });
  it('propagates network and authorization errors instead of substituting mock tours', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Network unavailable'));
    await expect(fetchExcursions(undefined, { allowMockFallback: false })).rejects.toThrow('Network unavailable');
  });
  it('rejects malformed responses in live mode', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { success: true } });
    await expect(fetchExcursions(undefined, { allowMockFallback: false })).rejects.toThrow('không hợp lệ');
  });
});
