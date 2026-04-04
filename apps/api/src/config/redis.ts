import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redis: Redis;

try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (err: Error) => {
    logger.error(`Redis connection error: ${err.message}`);
  });
} catch (error) {
  logger.warn('Redis not available, running without cache');
  redis = new Redis({ lazyConnect: true });
}

export { redis };
