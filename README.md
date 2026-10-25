# Commerce Monorepo

A full-stack commerce application built with Next.js, Fastify, PostgreSQL, Prisma, and pnpm workspaces.

## Workspace

- `apps/web` — Next.js storefront.
- `apps/api` — Fastify HTTP API.
- `packages/db` — Prisma schema, migrations, and seed.
- `packages/business-logic` — Shared commerce rules when sharing is appropriate.
- `packages/types` — Shared TypeScript types.
- `packages/validation` — Shared Zod schemas.
- `packages/ui` — Shared React UI components.
- `packages/config` — Shared TypeScript and code-quality configuration.

## Local development

Prerequisites: Node.js 22 or newer, pnpm 10 or newer, and Docker Desktop (or a local PostgreSQL 16+ server).

```powershell
Copy-Item .env.example .env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The storefront and API can also be started independently with `pnpm --filter @commerce/web dev` and `pnpm --filter @commerce/api dev`.

Environment variables and endpoint details will be documented here as their implementations are added.
