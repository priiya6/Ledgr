# Ledgr

Repository: `https://github.com/priiya6/Ledgr`

## Problem Statement

Finance teams need one place to manage financial records, analytics, exports, and access control without relying on spreadsheet-driven workflows or frontend-only permission checks. This project solves that by providing a production-inspired dashboard with strict backend RBAC, audit logging, analytics caching, and a typed full-stack contract shared across the API and UI.

## Requirements Covered

- Monorepo with `apps/api`, `apps/web`, and `packages/shared`
- Backend with Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, JWT auth, Zod validation, Swagger docs, Vitest, and Supertest
- Frontend with React 18, Vite, TypeScript, TailwindCSS, shadcn-style UI patterns, React Query, charts, and role-aware screens
- RBAC for `VIEWER`, `ANALYST`, and `ADMIN`
- Financial records CRUD with soft delete
- Analytics with Redis caching and PostgreSQL time-series aggregation
- Audit logs for all mutations
- Pluggable integrations for exchange rates, CSV/PDF export, and email alerts
- Docker Compose and developer commands

## Project Flow

1. User authenticates through `/api/auth/login`
2. API returns a short-lived access token and sets a refresh token in an `httpOnly` cookie
3. Frontend stores the access token in memory and uses Axios interceptors to refresh on `401`
4. Backend validates every request using shared Zod schemas
5. Middleware enforces authentication, RBAC, ownership, and rate limiting
6. Controllers stay thin and delegate business rules to services
7. Services call repositories for Prisma access, trigger audit logs, and invalidate analytics cache on record mutations
8. Analytics endpoints use Redis caching and PostgreSQL aggregation
9. Frontend consumes typed APIs with React Query and renders dashboards, records, analytics, and user management

## Monorepo Structure

```text
/apps
  /api
  /web
/packages
  /shared
```

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis with `ioredis`
- JWT auth
- Zod
- Swagger UI
- Vitest
- Supertest

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Query
- Recharts
- Axios

## Local Setup

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL
- Redis
- Docker Desktop optional

### Install

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/financedb
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EXCHANGE_RATE_API_KEY=your_key_here
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass
ALERT_EXPENSE_THRESHOLD=50000
INTEGRATIONS_ENABLED=true
PORT=4000
NODE_ENV=development
```

### Run

```bash
npm run dev
```

### Database

```bash
npm run prisma:generate --workspace=apps/api
npm run prisma:push --workspace=apps/api
npm run seed
```

### Test

```bash
npm test
```

## Deployment Note

The GitHub repository link shares the source code, but it does not by itself host the application for public use.

For a public assignment demo link, you need:

- frontend deployment for `apps/web`
- backend deployment for `apps/api`
- hosted PostgreSQL
- hosted Redis

This repository is ready for local use and deployment preparation, but actual public hosting must be connected to a deployment platform using your own account credentials.

Deployment instructions are in [DEPLOYMENT.md](/C:/Users/Priya/Desktop/Ledgr/DEPLOYMENT.md).

## Status Tracking

- Session progress and remaining work are maintained in [STATUS.md](/C:/Users/Priya/Desktop/Ledgr/STATUS.md)
