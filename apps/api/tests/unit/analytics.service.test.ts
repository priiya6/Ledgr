import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service';
import { cacheService } from '../../src/services/cache.service';

vi.mock('../../src/services/cache.service', () => ({
  cacheService: {
    getJson: vi.fn(),
    setJson: vi.fn(),
    hashQuery: vi.fn().mockReturnValue('hash'),
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.mocked(cacheService.getJson).mockResolvedValue(null);
    vi.mocked(cacheService.setJson).mockResolvedValue(undefined);
  });

  it('calculates net balance correctly', async () => {
    const service = new AnalyticsService({
      summary: vi.fn().mockResolvedValue([
        { type: 'INCOME', _sum: { amount: 1000 }, _count: { _all: 2 } },
        { type: 'EXPENSE', _sum: { amount: 350 }, _count: { _all: 3 } },
      ]),
    } as any);

    const result = await service.summary({ userId: 'viewer-1', role: 'VIEWER' });

    expect(result.payload).toEqual({
      totalIncome: 1000,
      totalExpenses: 350,
      netBalance: 650,
      recordCount: 5,
    });
  });
});
