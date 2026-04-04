import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const toBool = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
};

export const env = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: parseInt(process.env['PORT'] || '4000', 10),
  DATABASE_URL: process.env['DATABASE_URL'] || 'postgresql://user:pass@localhost:5432/financedb',
  REDIS_URL: process.env['REDIS_URL'] || 'redis://localhost:6379',
  JWT_ACCESS_SECRET: process.env['JWT_ACCESS_SECRET'] || 'change_me_access',
  JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET'] || 'change_me_refresh',
  JWT_ACCESS_EXPIRES: process.env['JWT_ACCESS_EXPIRES'] || '15m',
  JWT_REFRESH_EXPIRES: process.env['JWT_REFRESH_EXPIRES'] || '7d',
  BCRYPT_SALT_ROUNDS: parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
  EXCHANGE_RATE_API_KEY: process.env['EXCHANGE_RATE_API_KEY'] || '',
  SMTP_HOST: process.env['SMTP_HOST'] || 'smtp.mailtrap.io',
  SMTP_PORT: parseInt(process.env['SMTP_PORT'] || '2525', 10),
  SMTP_USER: process.env['SMTP_USER'] || '',
  SMTP_PASS: process.env['SMTP_PASS'] || '',
  ALERT_EXPENSE_THRESHOLD: parseInt(process.env['ALERT_EXPENSE_THRESHOLD'] || '50000', 10),
  INTEGRATIONS_ENABLED: toBool(process.env['INTEGRATIONS_ENABLED'], true),
  ALLOW_FUTURE_RECORD_DATE: toBool(process.env['ALLOW_FUTURE_RECORD_DATE'], false),
  APP_ORIGIN: process.env['APP_ORIGIN'] || 'http://localhost:5173',
  REFRESH_COOKIE_NAME: process.env['REFRESH_COOKIE_NAME'] || 'ledgr_refresh_token',
} as const;
