import type { Request, Response } from 'express';
import { asyncHandler, buildPaginationMeta, sendPaginated } from '../../utils';
import { auditLogsService } from './audit.service';

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as any;
  const result = await auditLogsService.list(query);
  sendPaginated(res, result.items, buildPaginationMeta(query.page, query.limit, result.total));
});
