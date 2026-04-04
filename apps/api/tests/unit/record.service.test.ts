import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RecordService } from '../../src/modules/records/records.service';
import { AppError } from '../../src/utils/errors';
import { auditService } from '../../src/services/audit.service';
import { cacheService } from '../../src/services/cache.service';

vi.mock('../../src/services/audit.service', () => ({
  auditService: {
    logMutation: vi.fn(),
  },
}));

vi.mock('../../src/services/cache.service', () => ({
  cacheService: {
    delByPattern: vi.fn(),
  },
}));

describe('RecordService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create validates amount > 0', async () => {
    const service = new RecordService({
      create: vi.fn(),
    } as any);

    await expect(
      service.create(
        {
          type: 'EXPENSE',
          amount: 0,
          category: 'rent',
          date: new Date(),
        },
        'admin-1'
      )
    ).rejects.toBeInstanceOf(AppError);
  });

  it('create rejects future date', async () => {
    const service = new RecordService({
      create: vi.fn(),
    } as any);

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await expect(
      service.create(
        {
          type: 'EXPENSE',
          amount: 25,
          category: 'rent',
          date: futureDate,
        },
        'admin-1'
      )
    ).rejects.toBeInstanceOf(AppError);
  });

  it('create normalizes category', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'record-1',
      amount: { toString: () => '100.00' },
      category: 'marketing',
    });

    const service = new RecordService({
      create,
    } as any);

    await service.create(
      {
        type: 'INCOME',
        amount: 100,
        category: '  Marketing  ',
        date: new Date('2026-01-02T00:00:00.000Z'),
      },
      'admin-1'
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'marketing',
      })
    );
    expect(auditService.logMutation).toHaveBeenCalled();
    expect(cacheService.delByPattern).toHaveBeenCalledWith('analytics:*');
  });
});
