# [Project Name] — Development Guidelines

## Project Overview

[Project Name] is [brief description]. **Monolith** Next.js application — frontend, API, and database access live in a single codebase.

- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS 4, shadcn/ui via `@base-ui/react`
- **Data**: Prisma ORM + PostgreSQL
- **Auth**: Clerk
- **i18n**: next-intl (path-based routing, locales `es`/`en`, default `es`)
- **Server work**: Next.js Route Handlers (`app/api/**`) and Server Actions
- **Background jobs / queues**: only when strictly required (start with sync handlers; add a queue when there's a real reason)

There is **no separate server package**. All API logic runs inside the Next.js app.

## Architecture: Domain-Driven Modules

### Directory layout (`src/`)

```
src/
  app/                    — Next.js App Router (routes, layouts, pages)
    [locale]/             — locale-prefixed routes (next-intl)
      (routes)/...        — Page routes
      layout.tsx          — wraps NextIntlClientProvider, calls setRequestLocale
    api/<domain>/         — Route Handlers (REST endpoints, NOT under [locale])
  modules/
    <module>/
      types.ts            — interfaces, type aliases
      data.ts             — constants, config arrays
      lib.ts              — pure helper functions (no React, no DB)
      hooks.ts            — custom React hooks (client)
      actions.ts          — Server Actions for this module
      service.ts          — server-side business logic (called by actions/handlers)
      components/         — extracted sub-components
      <name>-view.tsx     — page-level view component
  common/
    api/
      types.ts            — shared API types (e.g. AppUser, Organization)
      hooks/              — React Query hooks (one file per domain, re-exports types from modules)
      client.ts           — fetch wrapper / API client
    data/                 — shared constants
    lib/                  — shared pure helpers (format, utils, cn)
    components/           — shared reusable components
    layout/               — AppSidebar, PageHeader, etc.
    providers/            — AuthInitializer, ErrorBoundary, etc.
    i18n/
      routing.ts          — next-intl routing config (locales, default)
      navigation.ts       — locale-aware Link, redirect, useRouter
      request.ts          — getRequestConfig, loads messages per locale
  server/
    db.ts                 — Prisma client singleton
    auth.ts               — auth helpers (currentUser, currentOrg)
    rate-limit.ts         — rate limiting helper
  proxy.ts                — Next.js 16 middleware: clerkMiddleware + next-intl
messages/
  es.json                 — Spanish translations (default)
  en.json                 — English translations
prisma/
  schema.prisma
```

### Rules

1. **Types** go in `module/types.ts`, NOT inline in views or hooks
2. **Constants/data** go in `module/data.ts`, NOT inline in views
3. **Pure functions** go in `module/lib.ts`, NOT inline in views
4. **Custom hooks** go in `module/hooks.ts`, NOT inline in views
5. **Server-side business logic** goes in `module/service.ts` — Route Handlers and Server Actions are thin wrappers
6. **Server Actions** go in `module/actions.ts` — group by module, do not split one-action-per-file
7. **Shared code** (used by 2+ modules) goes in `common/`
8. **Component Props interfaces** are the ONLY types allowed inline in component files
9. **API hook files** (`common/api/hooks/`) contain ONLY hooks — types are re-exported from module types
10. **Never import server code into client components**. Server-only utilities must use `import "server-only"` to enforce this.

### Shared locations

- `common/api/types.ts` — AppUser, Organization, shared DTOs
- `common/api/hooks/` — React Query hooks (one file per domain)
- `common/lib/format.ts` — formatNumber, formatDate, etc.
- `common/lib/utils.ts` — cn (tailwind class merger)
- `common/layout/` — AppSidebar, PageHeader
- `common/providers/` — AuthInitializer, ErrorBoundary
- `server/db.ts` — Prisma singleton (always import from here, never `new PrismaClient()` elsewhere)

## Design System

### Dark mode only. No light mode.

The product is themed around **the crew** — a small team of humanoid robots the student joins (see `docs/plan/cast.md`). Visual identity leans dark, slightly industrial, with warm gold accents (insignias, crew badge, character names).

### Color palette: Zinc dark + warm gold accent

| Token | Approx | Use |
|-------|--------|-----|
| `--background` | near-black | Page bg |
| `--foreground` | near-white | Body text, headings |
| `--card` | slightly lighter dark | Cards, exercise pane bg |
| `--primary` | bright (light) | Primary buttons (`bg-primary` reads white-on-dark) |
| `--primary-foreground` | dark | Text on primary buttons |
| `--muted` | dark zinc | Subtle backgrounds |
| `--muted-foreground` | mid zinc | Secondary text |
| `--border` | translucent white | All borders |
| `--destructive` | warm red | Error states |
| `--brand-gold` | `#d4a24c`-ish | Logo, character names, "passed" highlights — accent only, NOT for primary buttons |

Brand accent (`--brand-gold`) is sprinkled intentionally — character names in MDX, the logo, the "passed" check on a criterion. Don't paint whole surfaces gold; it's a punctuation mark, not a background color.

### Typography

- **Font**: DM Sans (body), JetBrains Mono (code)
- **Headings**: `font-weight: 700`, `letter-spacing: -0.03em`
- **Body**: `font-weight: 400`, `16px`, `line-height: 1.5`

### Components

- Use **shadcn/ui** components exclusively (via `@base-ui/react`)
- Do NOT build manual buttons, inputs, cards, dialogs
- Primary action buttons: `variant="default"` (renders bright on dark via `bg-primary`)
- Secondary / nav buttons: `variant="outline"`
- Destructive buttons: `variant="destructive"`

### Spacing & Radius

- Border radius base: `8px` (`--radius-sm`)
- Cards: `rounded-lg` (16px)
- Buttons: `rounded-xl` (24px)
- Inputs: `rounded-xl`

## Code Style

- TypeScript strict mode
- Functional components only (no class components)
- React Query for server state on the client
- `"use client"` only when hooks/interactivity needed — keep components server by default
- `"use server"` only at the top of files that export Server Actions
- No emojis in code or UI
- Terse, direct commit messages

### Early Returns (mandatory)

Always use early returns. Never nest if/else. Guard clauses first, happy path last.

**Exception**: `else` is OK inside loops for control flow and for multi-branch value assignment where early return doesn't apply.

```tsx
// Functions
const getLabel = (age: number) => {
  if (age < 18) return "underage"
  if (age < 30) return "young"
  return "old"
}

// Components — always: error → loading → empty → data
function ListView() {
  const { data, isLoading, isError, error } = useItems()

  if (isError) {
    return <p className="text-destructive">{error.message}</p>
  }

  if (isLoading) {
    return <Loader2 className="animate-spin" />
  }

  if (!data?.length) {
    return <p className="text-muted-foreground">No items found</p>
  }

  return <div>{data.map(item => <Card key={item.id}>{item.title}</Card>)}</div>
}
```

### Error Handling

- **Inside React Query hooks**: `throw` is OK — React Query catches it and sets `isError`
- **Inside Route Handlers**: `throw` is OK — wrap with a top-level error handler that returns a JSON error response
- **Inside Server Actions**: return `{ ok: false, error }` results, do NOT throw — throwing surfaces as a generic error in client forms
- **Components / event handlers**: wrap in `try/catch`, show toast on failure
- **Downloads/async handlers**: wrap in `try/catch/finally`, show toast on error

```tsx
// GOOD — try/catch in event handler
const handleDownload = async () => {
  try {
    const url = await renderFrame()
    triggerDownload(url)
  } catch {
    toast.error("Download failed")
  }
}

// GOOD — server action returns a result
"use server"
export async function createItem(input: CreateItemInput) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const item = await itemService.create(parsed.data)
  return { ok: true as const, item }
}
```

### Fallbacks (be explicit, not silent)

- **OK**: `frame.text ?? ""` — empty string for text input is a valid default
- **OK**: `frame.backgroundUrl ?? frame.originalUrl` — explicit fallback chain
- **BAD**: `const items = data ?? []` then mapping over it — hides that data is missing
- **Better**: early return `if (!data) return <Empty />` then use `data` directly

## Internationalization

**All user-facing strings MUST go through `next-intl`. No hardcoded text in views, components, or server responses returned to users.**

### Setup

- **Locales**: `es` (default), `en`
- **Routing**: path-based (`/es/...`, `/en/...`). Root `/` redirects to default locale via middleware
- **Config**: `src/common/i18n/routing.ts` — single source of truth for locales/default
- **Messages**: `messages/<locale>.json` at repo root, organized by namespace (typically one top-level key per module: `home`, `auth`, `common`, etc.)
- **Plugin**: `createNextIntlPlugin('./src/common/i18n/request.ts')` in `next.config.ts`

### How to use translations

**Server Components** (default — most components):
```tsx
import { getTranslations } from "next-intl/server"

export async function HomeView() {
  const t = await getTranslations("home")
  return <h1>{t("heading")}</h1>
}
```

**Client Components** (`"use client"`):
```tsx
"use client"
import { useTranslations } from "next-intl"

export function Button() {
  const t = useTranslations("home")
  return <button>{t("submit")}</button>
}
```

**Rich text** (when a string contains a link or formatted span — keep the sentence intact, don't split):
```tsx
t.rich("intro", {
  templates: (chunks) => <a href="...">{chunks}</a>,
})
```
Message: `"intro": "Head over to <templates>Templates</templates> to start."`

**Interpolation**: `t("greeting", { name: user.firstName })` with message `"greeting": "Hello {name}"`.

### Routing & navigation

Always use the locale-aware navigation from `@/common/i18n/navigation` — NOT the bare Next.js ones:

```tsx
import { Link, useRouter, redirect } from "@/common/i18n/navigation"
```

These automatically prepend the active locale.

### Static rendering

In every `[locale]/layout.tsx` and `[locale]/.../page.tsx` that should be statically rendered, call `setRequestLocale(locale)` before any next-intl API:

```tsx
import { setRequestLocale } from "next-intl/server"
const { locale } = await params
setRequestLocale(locale)
```

And export `generateStaticParams` from the locale layout to pre-render both locales.

### Message file conventions

- One top-level key per module (or `common` for shared): `{ "home": {...}, "common": {...} }`
- Keep keys flat-ish (max 2-3 nesting levels) — deep nesting is hard to maintain
- ES is the source of truth — when adding a key, add it to `es.json` first, then mirror in `en.json`
- Never inline a fallback string in JSX (`t("missingKey") || "Hello"`) — fix the translation file

### Server-side messages (validation errors, API responses)

When a Server Action or Route Handler returns a user-facing message, fetch translations server-side:
```ts
const t = await getTranslations("auth")
return { ok: false, error: t("errors.invalidEmail") }
```
The locale is read from the request automatically.

## Backend (inside Next.js)

- **Route Handlers** (`app/api/<domain>/route.ts`) for REST-style endpoints consumed by React Query or external clients
- **Server Actions** (`module/actions.ts`) for form submissions and mutations triggered from RSC/forms
- Both call into `module/service.ts` — keep handlers/actions thin (auth check → validate → service → respond)
- **Validation**: Zod at every server entry point (route handlers, server actions). Never trust client input.
- **Auth**: Clerk. Use a `currentUser()` / `currentOrg()` helper from `server/auth.ts` and bail out with `401` / `unauthorized()` early.
- **Database**: Prisma. Always import the singleton from `server/db.ts`. Use `prisma db push` in dev, migrations in CI/prod.
- **Rate limiting**: apply to public/auth-light endpoints via a small helper in `server/rate-limit.ts`.
- **Storage**: abstraction layer (S3/local) toggled by `STORAGE_INTERFACE` env var.
- **Background work**: prefer synchronous handlers. Only introduce a queue (BullMQ, etc.) when there is a concrete reason — do not pre-build infra.

## Don'ts

- Don't add a separate backend package — this is a monolith
- Don't add a light-mode toggle — the product ships dark-only
- Don't use brightly colored primary — primary buttons stay grayscale (high contrast)
- Don't paint surfaces with `--brand-gold` — it's an accent, not a fill
- Don't put types in hook files
- Don't duplicate data across modules
- Don't use modals when inline UI or popovers work
- Don't over-engineer — ship the minimum needed
- Don't throw errors outside React Query hooks or Route Handlers
- Don't throw inside Server Actions — return result objects instead
- Don't import server code (db, auth, services) into client components
- Don't instantiate `new PrismaClient()` outside `server/db.ts`
- Don't skip Zod validation on server entry points
- Don't use if/else — use early returns
- Don't use `?? []` to hide missing data — use early returns for empty states
- Don't nest ternaries in JSX — extract to early returns or variables
- Don't hardcode user-facing strings — every visible string goes through `next-intl` (`t("...")`)
- Don't use `next/link` or `next/navigation`'s `useRouter`/`redirect` directly — use the locale-aware versions from `@/common/i18n/navigation`
- Don't add a new feature without adding its message keys to BOTH `messages/es.json` and `messages/en.json`
- Don't put `[locale]` segment around `app/api/**` — API routes stay at `/api/...`, not `/es/api/...`
