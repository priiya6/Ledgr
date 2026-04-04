import { env } from '../config';
import { cacheService } from './cache.service';
import { logger } from '../config/logger';

export interface ConversionResult {
  amount: number;
  convertedAmount: number;
  from: string;
  to: string;
  rate: number;
  fallback: boolean;
}

export class ExchangeRateService {
  async convert(amount: number, from: string, to: string): Promise<ConversionResult> {
    if (!env.INTEGRATIONS_ENABLED) {
      return { amount, convertedAmount: amount, from, to, rate: 1, fallback: true };
    }

    const cacheKey = `fx:${from}:${to}`;
    const cached = await cacheService.getJson<{ rate: number }>(cacheKey);
    if (cached) {
      return {
        amount,
        convertedAmount: Number((amount * cached.rate).toFixed(2)),
        from,
        to,
        rate: cached.rate,
        fallback: false,
      };
    }

    try {
      const url = env.EXCHANGE_RATE_API_KEY
        ? `https://openexchangerates.org/api/latest.json?app_id=${env.EXCHANGE_RATE_API_KEY}&base=${from}&symbols=${to}`
        : `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1`;
      const response = await fetch(url);
      const payload = (await response.json()) as {
        result?: number;
        rates?: Record<string, number>;
      };
      const rate = payload.result ?? payload.rates?.[to];

      if (!rate) {
        throw new Error('Exchange rate not available');
      }

      await cacheService.setJson(cacheKey, { rate }, 3600);
      return {
        amount,
        convertedAmount: Number((amount * rate).toFixed(2)),
        from,
        to,
        rate,
        fallback: false,
      };
    } catch (error) {
      logger.warn('Exchange rate lookup failed', { from, to, error });
      return { amount, convertedAmount: amount, from, to, rate: 1, fallback: true };
    }
  }
}

export const exchangeRateService = new ExchangeRateService();
