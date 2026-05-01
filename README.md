# PaperWeave Development Commands

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (running locally or via Docker)

## Initial Setup

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

3. Update `apps/api/.env` with your database URL and secrets.

## Development

Start all apps in parallel:
```bash
pnpm dev
```

Start individual apps:
```bash
pnpm --filter @paperweave/web dev
pnpm --filter @paperweave/api dev
```

## Type Checking

```bash
pnpm typecheck
```

## Linting

```bash
pnpm lint
```

## Formatting

```bash
pnpm format
```

## Building

```bash
pnpm build
```

## Database

Generate Drizzle migrations:
```bash
pnpm --filter @paperweave/api db:generate
```

Run migrations:
```bash
pnpm --filter @paperweave/api db:migrate
```

Open Drizzle Studio:
```bash
pnpm --filter @paperweave/api db:studio
```

## Project Structure

```
paperweave/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/           # Hono backend API
├── packages/
│   ├── shared/        # Shared Zod schemas, env validation, utils
│   └── ai/            # AI provider abstraction
├── tsconfig.json     # Root TypeScript config
├── pnpm-workspace.yaml
└── package.json      # Root workspace config
```