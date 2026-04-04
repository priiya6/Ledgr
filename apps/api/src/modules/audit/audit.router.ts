import { Router } from 'express';
import { auditLogQuerySchema } from '@ledgr/shared';
import { authenticate, requireRole, validateRequest } from '../../middleware';
import { listAuditLogs } from './audit.controller';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));
router.get('/', validateRequest({ query: auditLogQuerySchema }), listAuditLogs);

export default router;
