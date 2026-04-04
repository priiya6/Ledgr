import { Router } from 'express';
import { analyticsQuerySchema, topCategoriesQuerySchema } from '@ledgr/shared';
import { authenticate, requireRole, validateRequest } from '../../middleware';
import * as controller from './analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/summary', controller.summary);
router.get('/by-category', requireRole('ANALYST', 'ADMIN'), controller.byCategory);
router.get('/time-series', requireRole('ANALYST', 'ADMIN'), validateRequest({ query: analyticsQuerySchema }), controller.timeSeries);
router.get(
  '/top-categories',
  requireRole('ANALYST', 'ADMIN'),
  validateRequest({ query: topCategoriesQuerySchema }),
  controller.topCategories
);

export default router;
