import { Router } from 'express';
import {
  createRecordSchema,
  recordConvertQuerySchema,
  recordExportQuerySchema,
  recordIdParamSchema,
  recordQuerySchema,
  updateRecordSchema,
} from '@ledgr/shared';
import { authenticate, requireRole, validateRequest } from '../../middleware';
import * as controller from './records.controller';

const router = Router();

router.use(authenticate);

router.get('/', validateRequest({ query: recordQuerySchema }), controller.listRecords);
router.get('/convert', validateRequest({ query: recordConvertQuerySchema }), controller.convertAmount);
router.get('/export', validateRequest({ query: recordExportQuerySchema }), controller.exportRecords);
router.get('/:id', validateRequest({ params: recordIdParamSchema }), controller.getRecord);
router.post('/', requireRole('ADMIN'), validateRequest({ body: createRecordSchema }), controller.createRecord);
router.put(
  '/:id',
  requireRole('ADMIN'),
  validateRequest({ params: recordIdParamSchema, body: updateRecordSchema }),
  controller.updateRecord
);
router.delete('/:id', requireRole('ADMIN'), validateRequest({ params: recordIdParamSchema }), controller.deleteRecord);

export default router;
