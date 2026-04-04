import type { Prisma } from '@prisma/client';
import { prisma } from '../../config';

export class AnalyticsRepository {
  summary(where: Prisma.FinancialRecordWhereInput) {
    return prisma.financialRecord.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    });
  }

  byCategory(where: Prisma.FinancialRecordWhereInput) {
    return prisma.financialRecord.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      orderBy: { category: 'asc' },
    });
  }

  topCategories(where: Prisma.FinancialRecordWhereInput, limit: number) {
    return prisma.financialRecord.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });
  }

  timeSeries(createdBy: string | null, dateFrom: Date | null, dateTo: Date | null, granularity: 'daily' | 'monthly') {
    return prisma.$queryRaw<Array<{ bucket: Date; type: 'INCOME' | 'EXPENSE'; total: Prisma.Decimal }>>`
      SELECT date_trunc(${granularity === 'daily' ? 'day' : 'month'}, "date") AS bucket, "type", SUM("amount") AS total
      FROM "financial_records"
      WHERE "isDeleted" = false
      AND (${createdBy}::text IS NULL OR "createdBy" = ${createdBy})
      AND (${dateFrom}::timestamp IS NULL OR "date" >= ${dateFrom})
      AND (${dateTo}::timestamp IS NULL OR "date" <= ${dateTo})
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;
  }
}

export const analyticsRepository = new AnalyticsRepository();
