import { Router } from 'express';
import { loginSchema, registerSchema } from '@ledgr/shared';
import { authenticate, validateRequest } from '../../middleware';
import * as controller from './auth.controller';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a user
 *     security: []
 *     responses:
 *       201:
 *         description: Registered
 */
router.post('/register', validateRequest(registerSchema), controller.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     security: []
 *     responses:
 *       200:
 *         description: Authenticated
 */
router.post('/login', validateRequest(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);

export default router;
