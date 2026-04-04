import { Router } from 'express';
import { createUserSchema, updateUserSchema, userIdParamSchema, userQuerySchema } from '@ledgr/shared';
import { authenticate, requireRole, validateRequest } from '../../middleware';
import * as controller from './users.controller';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('ADMIN'), validateRequest({ query: userQuerySchema }), controller.listUsers);
router.get('/me', controller.getCurrentUser);
router.get('/:id', requireRole('ADMIN'), validateRequest({ params: userIdParamSchema }), controller.getUser);
router.post('/', requireRole('ADMIN'), validateRequest({ body: createUserSchema }), controller.createUser);
router.put(
  '/:id',
  requireRole('ADMIN'),
  validateRequest({ params: userIdParamSchema, body: updateUserSchema }),
  controller.updateUser
);
router.delete('/:id', requireRole('ADMIN'), validateRequest({ params: userIdParamSchema }), controller.deleteUser);

export default router;
