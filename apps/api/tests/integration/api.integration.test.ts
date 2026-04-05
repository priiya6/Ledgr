import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(async (input: string, _hash: string) =>
      ['Admin@1234', 'Viewer@1234', 'Analyst@1234'].includes(input)
    ),
    hash: vi.fn(),
  },
  compare: vi.fn(async (input: string, _hash: string) =>
    ['Admin@1234', 'Viewer@1234', 'Analyst@1234'].includes(input)
  ),
  hash: vi.fn(),
}));

const state = vi.hoisted(() => {
  const users = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@finance.dev',
      name: 'Admin',
      passwordHash: 'hash-admin',
      role: 'ADMIN' as Role,
      isActive: true,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'viewer1@finance.dev',
      name: 'Viewer',
      passwordHash: 'hash-viewer',
      role: 'VIEWER' as Role,
      isActive: true,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'analyst1@finance.dev',
      name: 'Analyst',
      passwordHash: 'hash-analyst',
      role: 'ANALYST' as Role,
      isActive: true,
    },
  ];

  const records = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      type: 'EXPENSE',
      amount: 120,
      category: 'rent',
      description: 'viewer record',
      date: new Date('2026-03-01T00:00:00.000Z'),
      createdBy: '22222222-2222-2222-2222-222222222222',
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
      updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      type: 'INCOME',
      amount: 300,
      category: 'sales',
      description: 'admin record',
      date: new Date('2026-03-02T00:00:00.000Z'),
      createdBy: '11111111-1111-1111-1111-111111111111',
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
      updatedAt: new Date('2026-03-02T00:00:00.000Z'),
    },
  ];

  const redisStore = new Map<string, string>();
  const redis = {
    incr: vi.fn(async (key: string) => {
      const next = Number(redisStore.get(key) ?? '0') + 1;
      redisStore.set(key, String(next));
      return next;
    }),
    pexpire: vi.fn(async () => 1),
    get: vi.fn(async (key: string) => redisStore.get(key) ?? null),
    set: vi.fn(async (key: string, value: string, mode?: string, ttl?: number) => {
      redisStore.set(key, value);
      return 'OK';
    }),
    del: vi.fn(async (...keys: string[]) => {
      keys.forEach((key) => redisStore.delete(key));
      return keys.length;
    }),
    keys: vi.fn(async (pattern: string) => {
      if (pattern === 'analytics:*') {
        return [...redisStore.keys()].filter((key) => key.startsWith('analytics:'));
      }
      return [...redisStore.keys()];
    }),
    connect: vi.fn(async () => undefined),
    on: vi.fn(),
  };

  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) {
          return users.find((user) => user.id === where.id) ?? null;
        }
        if (where.email) {
          return users.find((user) => user.email === where.email) ?? null;
        }
        return null;
      }),
    },
    refreshToken: {
      create: vi.fn(async ({ data }: any) => data),
      findUnique: vi.fn(async ({ where }: any) => ({
        token: where.token,
        userId: '22222222-2222-2222-2222-222222222222',
        expiresAt: new Date(Date.now() + 100000),
      })),
      deleteMany: vi.fn(async () => ({ count: 1 })),
    },
    financialRecord: {
      findMany: vi.fn(async ({ where }: any) => {
        return records
          .filter((record) => !record.isDeleted)
          .filter((record) => (where?.createdBy ? record.createdBy === where.createdBy : true))
          .map((record) => ({
            ...record,
            amount: { valueOf: () => record.amount, toString: () => String(record.amount) },
            creator: users.find((user) => user.id === record.createdBy),
          }));
      }),
      count: vi.fn(async ({ where }: any) => {
        return records.filter((record) => !record.isDeleted).filter((record) => (where?.createdBy ? record.createdBy === where.createdBy : true)).length;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const record = records.find((item) => item.id === where.id) ?? null;
        if (!record) {
          return null;
        }
        return {
          ...record,
          amount: { valueOf: () => record.amount, toString: () => String(record.amount) },
          creator: users.find((user) => user.id === record.createdBy),
        };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const record = records.find((item) => item.id === where.id)!;
        Object.assign(record, data);
        return {
          ...record,
          amount: { valueOf: () => record.amount, toString: () => String(record.amount) },
        };
      }),
      create: vi.fn(async ({ data }: any) => ({
        ...data,
        id: 'record-new',
        amount: { valueOf: () => data.amount, toString: () => String(data.amount) },
      })),
      groupBy: vi.fn(async ({ where }: any) => {
        const scoped = records.filter((record) => !record.isDeleted).filter((record) => (where?.createdBy ? record.createdBy === where.createdBy : true));
        const income = scoped.filter((record) => record.type === 'INCOME').reduce((sum, item) => sum + item.amount, 0);
        const expense = scoped.filter((record) => record.type === 'EXPENSE').reduce((sum, item) => sum + item.amount, 0);
        return [
          { type: 'INCOME', _sum: { amount: income }, _count: { _all: scoped.filter((record) => record.type === 'INCOME').length } },
          { type: 'EXPENSE', _sum: { amount: expense }, _count: { _all: scoped.filter((record) => record.type === 'EXPENSE').length } },
        ];
      }),
      aggregate: vi.fn(async () => ({ _sum: { amount: 0 } })),
    },
    auditLog: {
      create: vi.fn(async () => ({})),
      findMany: vi.fn(async () => []),
      count: vi.fn(async () => 0),
    },
    $queryRaw: vi.fn(async () => []),
  };

  return { users, records, redisStore, redis, prisma };
});

vi.mock('../../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 4000,
    DATABASE_URL: 'postgresql://test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'test-access',
    JWT_REFRESH_SECRET: 'test-refresh',
    JWT_ACCESS_EXPIRES: '15m',
    JWT_REFRESH_EXPIRES: '7d',
    BCRYPT_SALT_ROUNDS: 12,
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX: 100,
    EXCHANGE_RATE_API_KEY: '',
    SMTP_HOST: '',
    SMTP_PORT: 2525,
    SMTP_USER: '',
    SMTP_PASS: '',
    ALERT_EXPENSE_THRESHOLD: 50000,
    INTEGRATIONS_ENABLED: false,
    ALLOW_FUTURE_RECORD_DATE: false,
    APP_ORIGIN: 'http://localhost:5173',
    REFRESH_COOKIE_NAME: 'ledgr_refresh_token',
  },
}));

vi.mock('../../src/config/db', () => ({
  prisma: state.prisma,
}));

vi.mock('../../src/config/redis', () => ({
  redis: state.redis,
}));

vi.mock('../../src/config/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const { default: app } = await import('../../src/app');

const makeToken = (userId: string, email: string, role: Role) =>
  jwt.sign({ userId, email, role }, 'test-access', { expiresIn: '15m' });

describe('API integration', () => {
  beforeEach(() => {
    state.redisStore.clear();
    state.records[0]!.isDeleted = false;
    vi.clearAllMocks();
  });

  it('POST /api/auth/login returns token', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'viewer1@finance.dev',
      password: 'Viewer@1234',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeTypeOf('string');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('GET /api/records as VIEWER returns own records only', async () => {
    const token = makeToken('22222222-2222-2222-2222-222222222222', 'viewer1@finance.dev', 'VIEWER');
    const response = await request(app).get('/api/records').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].createdBy).toBe('22222222-2222-2222-2222-222222222222');
  });

  it('GET /api/records as ANALYST returns all records', async () => {
    const token = makeToken('33333333-3333-3333-3333-333333333333', 'analyst1@finance.dev', 'ANALYST');
    const response = await request(app).get('/api/records').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it('POST /api/records as VIEWER returns 403', async () => {
    const token = makeToken('22222222-2222-2222-2222-222222222222', 'viewer1@finance.dev', 'VIEWER');
    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 100,
        category: 'Rent',
        date: '2026-03-02T00:00:00.000Z',
      });

    expect(response.status).toBe(403);
  });

  it('POST /api/records as ANALYST returns 403', async () => {
    const token = makeToken('33333333-3333-3333-3333-333333333333', 'analyst1@finance.dev', 'ANALYST');
    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'EXPENSE',
        amount: 100,
        category: 'Rent',
        date: '2026-03-02T00:00:00.000Z',
      });

    expect(response.status).toBe(403);
  });

  it('DELETE /api/records/:id as VIEWER returns 403', async () => {
    const token = makeToken('22222222-2222-2222-2222-222222222222', 'viewer1@finance.dev', 'VIEWER');
    const response = await request(app)
      .delete('/api/records/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(state.records[0]!.isDeleted).toBe(false);
  });

  it('DELETE /api/records/:id as ADMIN soft deletes record', async () => {
    const token = makeToken('11111111-1111-1111-1111-111111111111', 'admin@finance.dev', 'ADMIN');
    const response = await request(app)
      .delete('/api/records/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(state.records[0]!.isDeleted).toBe(true);
  });

  it('GET /api/analytics/summary is cached on second call', async () => {
    const token = makeToken('33333333-3333-3333-3333-333333333333', 'analyst1@finance.dev', 'ANALYST');

    const first = await request(app).get('/api/analytics/summary').set('Authorization', `Bearer ${token}`);
    const second = await request(app).get('/api/analytics/summary').set('Authorization', `Bearer ${token}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(state.prisma.financialRecord.groupBy).toHaveBeenCalledTimes(1);
    expect(state.redis.set).toHaveBeenCalledWith(
      expect.stringContaining('analytics:33333333-3333-3333-3333-333333333333:summary:'),
      expect.any(String),
      'EX',
      60
    );
  });
});
