# Footera backend

NestJS API backed by Prisma and PostgreSQL. Each feature is a Nest module under `src/modules`; its controllers handle HTTP requests, its services hold domain behavior, and `src/database` contains the Prisma client, repository, and seed runner.

## Setup

```bash
bun install
cp .env.example .env
docker compose up -d postgres
bun run db:generate
bun run db:migrate --name init
bun run db:seed
bun run start:dev
```

On Windows PowerShell, create `.env` by copying `.env.example` with `Copy-Item .env.example .env`.

Set `DATABASE_URL` to a PostgreSQL connection string in `.env`. The example configuration and `docker-compose.yml` use the local `footera` database exposed on port 55432 (container port 5432), avoiding collisions with a PostgreSQL service already using the standard port. Apply future committed migrations with `bun run db:deploy`.

## Seeds

`bun run db:seed` builds the backend and runs the Prisma seed. It is safe to rerun: existing rows are kept and missing demo records are inserted. The in-app `POST /api/v1/auth/reset-demo` intentionally resets the demo database and re-seeds it. For a full CLI reset, set `RESET_DATABASE=true` before running the seed command.

The seed source remains in `src/database/seeds.ts`; `src/database/seed-data.ts` maps those fixtures to Prisma models and `prisma/seed.mjs` is the CLI entry point.

## Commands

```bash
bun run start:dev
bun run build
bun run db:generate
bun run db:migrate --name <migration-name>
bun run db:deploy
bun run db:seed
```
