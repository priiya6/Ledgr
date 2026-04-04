import type { Prisma } from '@prisma/client';
import { prisma } from '../../config';

export class AuditRepository {
  list(args: Prisma.AuditLogFindManyArgs) {
    return prisma.auditLog.findMany(args);
  }

  count(where: Prisma.AuditLogWhereInput) {
    return prisma.auditLog.count({ where });
  }
}

export const auditRepository = new AuditRepository();
