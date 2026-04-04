# Deployment

This repository is now ready for deployment, but a GitHub repo link is not itself a public app link.

To make the project usable by anyone from one URL, deploy:

- frontend from `apps/web`
- backend from `apps/api`
- PostgreSQL
- Redis

## Recommended Setup

### Frontend
- Platform: `Vercel`
- Root directory: `apps/web`
- Build command: `npm run build --workspace=apps/web`
- Output directory: `dist`
- Environment variable:

```text
VITE_API_BASE_URL=https://your-backend-domain/api
```

## Backend
- Platform: `Railway`, `Render`, or `Fly.io`
- Root directory: repo root
- Start command:

```text
npm run dev --workspace=apps/api
```

For production, prefer:

```text
npm run build --workspace=packages/shared && npm run build --workspace=apps/api && npm run start --workspace=apps/api
```

- Required environment variables:

```text
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EXCHANGE_RATE_API_KEY=
SMTP_HOST=
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
ALERT_EXPENSE_THRESHOLD=50000
INTEGRATIONS_ENABLED=true
APP_ORIGIN=https://your-frontend-domain
PORT=4000
NODE_ENV=production
```

If you want multiple frontend origins:

```text
APP_ORIGIN=https://your-frontend-domain,https://preview-domain.vercel.app
```

## Public Demo Flow

1. Deploy backend first
2. Copy backend URL into frontend `VITE_API_BASE_URL`
3. Deploy frontend
4. Update backend `APP_ORIGIN` with the frontend URL
5. Redeploy backend if needed

## Important

- GitHub repo link = source code
- Public app link = deployed frontend/backend
- `localhost` links work only on your own system
