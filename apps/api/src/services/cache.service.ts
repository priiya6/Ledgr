import crypto from 'crypto';
import { redis } from '../config';
import { logger } from '../config/logger';

export class CacheService {
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      logger.warn('Cache read failed', { key, error });
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      logger.warn('Cache write failed', { key, error });
    }
  }

  async delByPattern(pattern: string) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Cache delete failed', { pattern, error });
    }
  }

  hashQuery(input: unknown) {
    return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  }
}

export const cacheService = new CacheService();
