import type { AuditLogQueryInput } from '@ledgr/shared';
import { getPagination } from '../../utils';
import { auditRepository, AuditRepository } from './audit.repository';

export class AuditLogsService {
  constructor(private readonly repository: AuditRepository = auditRepository) {}

  async list(query: AuditLogQueryInput) {
    const [items, total] = await Promise.all([
      this.repository.list({
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: query.sortOrder },
        ...getPagination(query),
      }),
      this.repository.count({}),
    ]);

    return { items, total };
  }
}

export const auditLogsService = new AuditLogsService();
