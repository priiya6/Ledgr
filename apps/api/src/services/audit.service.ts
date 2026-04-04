import { Prisma } from '@prisma/client';
import { prisma } from '../config';
import { logger } from '../config/logger';

interface AuditPayload {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}

export class AuditService {
  logMutation(payload: AuditPayload) {
    void prisma.auditLog.create({ data: payload }).catch((error: unknown) => {
      logger.warn('Audit log write failed', { payload, error });
    });
  }
}

export const auditService = new AuditService();
