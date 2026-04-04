import type { AnalyticsQueryInput, TopCategoriesQueryInput } from '@ledgr/shared';
import { cacheService } from '../../services/cache.service';
import { analyticsRepository, AnalyticsRepository } from './analytics.repository';

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository = analyticsRepository) {}

  private withCache<T>(userId: string, endpoint: string, query: unknown, loader: () => Promise<T>, ttlSeconds: number) {
    const key = `analytics:${userId}:${endpoint}:${cacheService.hashQuery(query)}`;

    return (async () => {
      const cached = await cacheService.getJson<T>(key);
      if (cached) {
        return { payload: cached, cached: true };
      }

      const payload = await loader();
      await cacheService.setJson(key, payload, ttlSeconds);
      return { payload, cached: false };
    })();
  }

  private createdBy(requester: { userId: string; role: string }) {
    return requester.role === 'VIEWER' ? requester.userId : null;
  }

  async summary(requester: { userId: string; role: string }) {
    return this.withCache(requester.userId, 'summary', {}, async () => {
      const rows = await this.repository.summary({
        isDeleted: false,
        ...(requester.role === 'VIEWER' ? { createdBy: requester.userId } : {}),
      });
      const totalIncome = Number(rows.find((row: (typeof rows)[number]) => row.type === 'INCOME')?._sum.amount ?? 0);
      const totalExpenses = Number(rows.find((row: (typeof rows)[number]) => row.type === 'EXPENSE')?._sum.amount ?? 0);
      const recordCount = rows.reduce((sum: number, row: (typeof rows)[number]) => sum + row._count._all, 0);
      return {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        recordCount,
      };
    }, 60);
  }

  async byCategory(requester: { userId: string; role: string }) {
    return this.withCache(requester.userId, 'by-category', {}, async () => {
      const rows = await this.repository.byCategory({
        isDeleted: false,
        ...(requester.role === 'VIEWER' ? { createdBy: requester.userId } : {}),
      });
      return rows.map((row: (typeof rows)[number]) => ({
        category: row.category,
        type: row.type,
        total: Number(row._sum.amount ?? 0),
      }));
    }, 300);
  }

  async timeSeries(requester: { userId: string; role: string }, query: AnalyticsQueryInput) {
    return this.withCache(requester.userId, 'time-series', query, async () => {
      const rows = await this.repository.timeSeries(
        this.createdBy(requester),
        query.dateFrom ?? null,
        query.dateTo ?? null,
        query.granularity
      );

      return rows.map((row: (typeof rows)[number]) => ({
        bucket: row.bucket.toISOString(),
        type: row.type,
        total: Number(row.total),
      }));
    }, 300);
  }

  async topCategories(requester: { userId: string; role: string }, query: TopCategoriesQueryInput) {
    return this.withCache(requester.userId, 'top-categories', query, async () => {
      const rows = await this.repository.topCategories(
        {
          isDeleted: false,
          ...(requester.role === 'VIEWER' ? { createdBy: requester.userId } : {}),
        },
        query.limit
      );

      return rows.map((row: (typeof rows)[number]) => ({
        category: row.category,
        total: Number(row._sum.amount ?? 0),
      }));
    }, 300);
  }
}

export const analyticsService = new AnalyticsService();
