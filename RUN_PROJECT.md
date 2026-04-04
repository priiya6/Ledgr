# Run Project

Repository: `https://github.com/priiya6/Ledgr`

This file is the simple run guide for the assignment.

Important:

- GitHub repo link = source code only
- Localhost link = works only on your own machine
- Public app link needs deployment of frontend, backend, database, and Redis

For deployment steps, see [DEPLOYMENT.md](/C:/Users/Priya/Desktop/Ledgr/DEPLOYMENT.md).

## What You Need

Install these first:

- `Node.js` 20+
- `npm`
- `Docker Desktop`

## Project URLs

When the project is running:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Swagger Docs: `http://localhost:4000/api/docs`

## Demo Login Accounts

- `admin@finance.dev / Admin@1234`
- `analyst1@finance.dev / Analyst@1234`
- `analyst2@finance.dev / Analyst@1234`
- `viewer1@finance.dev / Viewer@1234`
- `viewer2@finance.dev / Viewer@1234`
- `viewer3@finance.dev / Viewer@1234`

## First Time Setup

### 1. Open terminal in the project folder

```bash
cd Ledgr
```

### 2. Install all packages

```bash
npm install
```

### 3. Create local environment file

Windows:

```bash
copy .env.example .env
```

## Step 1: Start Database and Redis

Make sure Docker Desktop is running.

Then run:

```bash
docker compose up -d postgres redis
```

This starts:

- PostgreSQL database
- Redis cache

## Step 2: Create Database Tables

Run this command:

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/financedb'; npm run prisma:push --workspace=apps/api
```

This creates the required database tables from Prisma schema.

## Step 3: Seed Demo Data

Run:

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/financedb'; npm run seed --workspace=apps/api
```

This adds:

- demo users
- 50 financial records

## Step 4: Run Backend

Open terminal 1 and run:

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/financedb'; npm run dev --workspace=apps/api
```

Backend will run at:

```text
http://localhost:4000
```

Check backend health:

```text
http://localhost:4000/health
```

Open API docs:

```text
http://localhost:4000/api/docs
```

## Step 5: Run Frontend

Open terminal 2 and run:

```bash
cd apps/web
npx vite --host 0.0.0.0
```

Frontend will run at:

```text
http://localhost:5173
```

## Easy Development Command

If database and Redis are already running, you can also use:

```bash
npm run dev
```

This starts frontend and backend together.

Use this only after:

- Docker services are up
- database schema is pushed
- seed data is added

## Recommended Full Run Order

Use these commands in this exact order:

### Terminal A

```bash
npm install
copy .env.example .env
docker compose up -d postgres redis
```

### Terminal A

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/financedb'; npm run prisma:push --workspace=apps/api
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/financedb'; npm run seed --workspace=apps/api
```

### Terminal B

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/financedb'; npm run dev --workspace=apps/api
```

### Terminal C

```bash
cd apps/web
npx vite --host 0.0.0.0
```

## Build and Test

To show the assignment is working:

```bash
npm test --workspace=apps/api
npm run build
```

## Stop Project

To stop frontend and backend:

- close the terminal windows
- or press `Ctrl + C`

To stop Docker services:

```bash
docker compose down
```

## If Something Does Not Start

### If port `4000` is busy

Close the old backend terminal and run again.

### If port `5173` is busy

Close the old frontend terminal and run again.

### If database connection fails

Check that Docker Desktop is running and this command shows containers:

```bash
docker compose ps
```

### If demo users are missing

Run seed again:

```powershell
$env:DATABASE_URL='postgresql://user:pass@localhost:5432/financedb'; npm run seed --workspace=apps/api
```
