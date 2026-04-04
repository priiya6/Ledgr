import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { env } from '../config/env';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 * Uses Redis sliding window counter.
 */
export const globalRateLimit = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `ratelimit:global:${ip}`;
    const windowMs = env.RATE_LIMIT_WINDOW_MS;
    const maxRequests = env.RATE_LIMIT_MAX;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    if (current > maxRequests) {
      next(AppError.rateLimited(`Rate limit exceeded. Try again later.`));
      return;
    }

    next();
  } catch (error) {
    // If Redis is down, allow the request through
    logger.warn('Rate limiter Redis error, allowing request', { error });
    next();
  }
};

/**
 * Authenticated user rate limiter: 20 requests per minute per user.
 */
export const userRateLimit = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    const key = `ratelimit:user:${req.user.userId}`;
    const windowMs = 60000; // 1 minute
    const maxRequests = 20;

    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    if (current > maxRequests) {
      next(AppError.rateLimited('User rate limit exceeded. Try again in a minute.'));
      return;
    }

    next();
  } catch (error) {
    logger.warn('User rate limiter Redis error, allowing request', { error });
    next();
  }
};
