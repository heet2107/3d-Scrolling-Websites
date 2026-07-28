# WebHeroAI

An embeddable AI concierge for websites: it answers visitor questions grounded
in the site's own content, then executes approved navigation actions on the
page — scroll, highlight, open, prefill — until the visitor becomes a lead.
Sold white label, primarily through agencies.

**Status: Phase 0/1 foundation.** Monorepo, CI, tenancy schema and row level
security. No auth UI, no crawling, no widget yet.

## Stack

Next.js (App Router) · React · TypeScript strict · Tailwind CSS · Supabase
(Postgres + Auth) · Drizzle ORM with raw SQL migrations for RLS · Zod ·
pnpm workspaces · Turborepo · Vitest · GitHub Actions

## Repository layout

```
apps/
  web/          Next.js app: marketing pages + authenticated dashboard (route groups)
packages/
  config/       Shared tsconfig presets and ESLint flat config
  db/           Drizzle schema, RLS/trigger migrations, db client
  shared/       Zod schemas, roles, slug utilities — shared client/server
  ui/           Shared React components (design system home)
docs/           Branch protection, pilot sites, decisions
```

## Local setup (clean clone → running, under ten minutes)

1. **Prereqs:** Node ≥ 22 (`.nvmrc`), pnpm 10 (`corepack enable`).

2. **Install:**

   ```bash
   pnpm install
   ```

3. **Environment:**

   ```bash
   cp .env.example .env
   ```

   Fill in the values from your Supabase project (Settings → API and
   Settings → Database). `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are
   server-only secrets — never expose them with a `NEXT_PUBLIC_` prefix.

4. **Database** (order matters — policies reference the helper functions, and
   triggers reference both):

   ```bash
   pnpm db:push                                              # tables from the Drizzle schema
   psql "$DATABASE_URL" -f packages/db/migrations/0001_rls_helpers.sql
   psql "$DATABASE_URL" -f packages/db/migrations/0002_rls_policies.sql
   psql "$DATABASE_URL" -f packages/db/migrations/0003_triggers.sql
   ```

5. **Run:**

   ```bash
   pnpm dev        # → http://localhost:3000
   ```

## Scripts

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `pnpm dev`         | Run all dev servers via Turborepo     |
| `pnpm build`       | Build all packages and apps           |
| `pnpm lint`        | ESLint across the workspace           |
| `pnpm typecheck`   | `tsc --noEmit` across the workspace   |
| `pnpm test`        | Vitest unit tests                     |
| `pnpm format`      | Prettier write                        |
| `pnpm db:push`     | Push Drizzle schema to `DATABASE_URL` |
| `pnpm db:generate` | Generate SQL from the Drizzle schema  |

Commits follow [Conventional Commits](https://www.conventionalcommits.org) —
enforced by commitlint via Husky. Prettier runs on staged files via lint-staged.

## The security invariant

Every tenant-scoped table has row level security enabled and (from Phase 1) an
automated test proving cross-tenant access fails. A table without both does not
ship.

The helper functions in `packages/db/migrations/0001_rls_helpers.sql` are
`SECURITY DEFINER` deliberately: a policy on `memberships` that queries
`memberships` recurses infinitely in Postgres. Routing the lookup through a
definer function breaks the cycle. Do not "simplify" this.

## CI and branch protection

Every PR runs format check, lint, typecheck, unit tests, build and a
high-severity dependency audit (`.github/workflows/ci.yml`). Branch protection
on `main` requires both jobs — one-time setup in
[docs/branch_protection.md](docs/branch_protection.md).
