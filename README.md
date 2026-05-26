# Naveo

Gamified, interactive platform to learn **applied AI** (prompt engineering, MCPs, agents, complex flows) and **basic programming as a bridge**. CryptoZombies-style layout: lesson on the left, activity on the right. You join a small crew of humanoid robots and learn to coordinate them through prompting.

> Read `docs/plan/` first. It is the source of truth for product scope, curriculum, exercise types, evaluation, and architecture.

## Stack

- **Next.js 16** (App Router, React 19), monolith. No separate backend package.
- **TypeScript** strict mode.
- **Tailwind CSS 4** + **shadcn/ui** (`@base-ui/react`). Dark mode only. See `docs/design-system.md`.
- **Prisma 7** + **PostgreSQL** with the `pgvector` extension.
- **Clerk** for auth.
- **next-intl** for i18n (`es` default, `en`). Path-based routing.
- **OpenRouter** for all LLM calls, via the Vercel `ai` SDK + `@openrouter/ai-sdk-provider`.
- **MDX** for lesson content, authored in `content/<locale>/`.

## Getting started

### 1. Prerequisites

- Node 20+
- A Postgres instance with `pgvector` installed (`CREATE EXTENSION vector`)
- A Clerk project (publishable + secret keys)
- An OpenRouter API key

### 2. Install

```bash
pnpm install
```

Note: `pnpm` is preferred. The `postinstall` hook runs `prisma generate`.

### 3. Configure environment

Copy `.env.example` to `.env` and fill in:

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Postgres connection string (must have `pgvector` available) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From the Clerk dashboard |
| `CLERK_SECRET_KEY` | From the Clerk dashboard |
| `OPENROUTER_API_KEY` | Used by LLM-judge checks and the blog generator |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (drives canonical URLs, sitemap, OG, JSON-LD) |

### 4. Database

```bash
pnpm db:push      # sync Prisma schema to your local DB
pnpm db:studio    # optional: open Prisma Studio
```

### 5. Build content + run

Lesson content lives in `content/<locale>/` as MDX. The build step compiles it into the runtime catalog:

```bash
pnpm build:content   # compile MDX + frontmatter into the catalog
pnpm dev             # start the dev server
```

Open <http://localhost:3000>. The root path redirects to the default locale (`/es`).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build locally |
| `pnpm lint` | ESLint (also enforces CSS/style guardrails) |
| `pnpm db:push` | Push Prisma schema to DB |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm build:content` | Compile MDX lesson content into the catalog |
| `pnpm blog:topics` | Generate blog topic ideas |
| `pnpm blog:sample` | Dump a sample blog post for inspection |
| `pnpm blog:generate` | Generate blog posts via OpenRouter |

## Repository layout

```
src/
  app/           Next.js App Router (locale-prefixed routes + /api)
  modules/       Domain modules (lessons, exercises, daily-quest, etc.)
  common/        Shared UI primitives, layout, i18n config, helpers
  server/        Prisma client, auth, cache, rate-limit (server-only)
  proxy.ts       Next.js 16 middleware: Clerk + next-intl
content/         MDX lesson content per locale
messages/        next-intl translation files (es, en)
prisma/          Prisma schema
docs/
  plan/          Product + architecture plan (read this first)
  design-system.md   Full visual language spec
scripts/         Content build + blog generation
```

For detailed conventions (where types live, error handling, i18n, design system rules), see `CLAUDE.md`.

## Contributing

1. Read `docs/plan/` and `CLAUDE.md` before opening a PR.
2. Every user-facing string goes through `next-intl`. Add keys to both `messages/es.json` and `messages/en.json`. ES is the source of truth.
3. No em-dashes in user-facing copy (translation files, MDX, hardcoded strings rendered to users). See the copy rule in `CLAUDE.md`.
4. No new `*.css` files under `src/`. Use Tailwind utilities and shadcn primitives. ESLint will fail otherwise.
5. Commit messages are terse and direct.

## License

Private. All rights reserved.
