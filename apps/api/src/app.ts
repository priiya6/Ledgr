import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env, logger, redis } from './config';
import { errorHandler, globalRateLimit, requestLogger, userRateLimit } from './middleware';
import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import recordsRouter from './modules/records/records.router';
import analyticsRouter from './modules/analytics/analytics.router';
import auditRouter from './modules/audit/audit.router';
import { emailAlertService } from './services/email-alert.service';

export const createApp = () => {
  const app = express();
  const allowedOrigins = env.APP_ORIGIN.split(',').map((origin) => origin.trim());

  const openApiSpec = swaggerJsdoc({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Ledgr API',
        version: '1.0.0',
        description: 'Finance data processing and access control dashboard API',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    },
    apis: ['./src/modules/**/*.router.ts'],
  });

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);
  app.use(globalRateLimit);
  app.use(userRateLimit);

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        name: 'Ledgr API',
        status: 'running',
        health: '/health',
        docs: '/api/docs',
      },
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/records', recordsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use(errorHandler);

  return app;
};

const app = createApp();

if (require.main === module) {
  void redis.connect().catch(() => undefined);
  emailAlertService.start();

  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info('API server started', { port: env.PORT, environment: env.NODE_ENV });
  });
}

export default app;
