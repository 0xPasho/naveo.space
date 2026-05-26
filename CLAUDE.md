# Naveo. Development Guidelines

## Project Overview

Naveo is a gamified, interactive platform to learn **applied AI** (prompt engineering, MCPs, agents, complex flows) and **basic programming as a bridge**, CryptoZombies-style: **lesson left, activity right**. Narrative spine: a small crew of humanoid robots you join and learn to coordinate through prompting.

**Monolith** Next.js app. Frontend, API, and DB access live in one codebase. There is no separate server package.

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19), TypeScript strict |
| Styling | Tailwind CSS 4 + shadcn/ui via `@base-ui/react`. Dark mode only |
| Data | Prisma 7 + PostgreSQL with `pgvector` |
| Auth | Clerk |
| i18n | next-intl, path-based, locales `es` (default) / `en` |
| LLM | OpenRouter via the Vercel `ai` SDK (`@openrouter/ai-sdk-provider`) |
| Server work | Route Handlers (`app/api/**`) + Server Actions. Sync by default. Add a queue only when there is a real reason |
| Content | MDX in `content/<locale>/` |

**Read `docs/plan/` first.** It is the source of truth for product scope, curriculum, evaluation, and architecture. `docs/design-system.md` is the full visual spec.

## Architecture: Domain-Driven Modules

### Directory layout (`src/`)

```
src/
  app/                    Next.js App Router
    [locale]/             locale-prefixed routes (next-intl)
      (routes)/...        page routes
      layout.tsx          wraps NextIntlClientProvider, calls setRequestLocale
    api/<domain>/         Route Handlers (NOT under [locale])
    globals.css           the ONLY CSS file allowed under src/
  modules/
    <module>/
      types.ts            interfaces, type aliases
      data.ts             constants, config arrays
      lib.ts              pure helpers (no React, no DB)
      hooks.ts            client React hooks
      actions.ts          Server Actions for the module
      service.ts          server-side business logic
      components/         extracted sub-components
      <name>-view.tsx     page-level view component
  common/
    components/ui/        shadcn-style primitives (Button, Card, MCQOption, etc.)
    layout/               sidebar, HUD pills, language switcher
    hooks/                shared client hooks (e.g. use-mobile)
    lib/                  shared helpers (format, utils/cn)
    i18n/                 routing.ts, navigation.ts, request.ts
  server/                 db.ts, auth.ts, cache.ts, rate-limit.ts (server-only)
  proxy.ts                Next.js 16 middleware: clerkMiddleware + next-intl
messages/                 es.json (source of truth), en.json
content/<locale>/         MDX lessons + daily quests
prisma/schema.prisma
```

### Module rules

- One file per role: `types.ts` for types, `data.ts` for constants, `lib.ts` for pure functions, `hooks.ts` for client hooks, `actions.ts` for Server Actions (grouped per module, not one-per-file), `service.ts` for server business logic. Route Handlers and Server Actions stay thin (auth, validate, call service, respond).
- The ONLY types allowed inline in component files are `Props` interfaces.
- Shared code (used by 2+ modules) lives in `common/`. Server-only utilities use `import "server-only"`.
- Never import server code from client components. Never `new PrismaClient()` outside `server/db.ts`.

## Design System: Naveo "Bridge"

Full spec in `docs/design-system.md`. Tokens are declared inside `@layer base` in `src/app/globals.css` (Tailwind v4 prunes unlayered `:root` tokens).

### Principles

1. **Dark mode only.** No light toggle. Canvas is deep ink (`#0b1018`), not pure black.
2. **Chunky 3D, flat surfaces.** Pressables get a SOLID shadow on the bottom edge (`--elev-1` to `--elev-4`). `:active` translates down by the drop and collapses the shadow. No gradients, glows, glassmorphism, sparkles, or ambient shimmers.
3. **Track-coded color, not theme-coded.** Brand action is **electric mint** (`--primary` = `#19d9c4`). Each track has its own hue (prompting blue, MCP violet, skills amber, agents pink, tooling lime, evals coral). Nodes and unit banners pick it up automatically.
4. **Tailwind + shadcn/ui only.** Direct CSS is deprecated.

### Tokens (all exposed as Tailwind utilities)

| Group | Tokens | Use |
|---|---|---|
| Surfaces | `bg-deep` `bg-surface` `bg-raised` `bg-sunken` | App shell, card, chip, inset well |
| Ink | `ink-1..4` | Body, secondary, caption, disabled |
| Lines | `line-soft` `line-strong` | Dividers vs. defined borders |
| Primary | `primary` (mint) + `primary-shadow` + `primary-soft` | CTAs, success, default ring |
| Tracks | `track-{prompting,mcp,skills,agents,tooling,evals}` + paired `-shadow` + `-ink` | Nodes, banners, chips |
| Stats | `stat-{xp,streak,heart,gem}` + paired `-shadow` | HUD chips, rewards |
| Status | `success` `warn` `danger` (+ `-soft`) | Semantic feedback |

Use as `bg-track-mcp`, `text-stat-xp`, `border-line-strong`, `shadow-elev-3`, etc.

### Typography, spacing, radius, elevation, motion

- **Typography**: `font-display` (Fredoka 500/600/700) for headings, eyebrows, button labels. `font-sans` (Nunito 500-900) for body/UI, **body weight 600** (Nunito reads thin at 400). `font-mono` (JetBrains Mono 400/600) for code. Body `16px / 1.5`. Headings `letter-spacing: -0.02em` (`--tracking-tight`). Eyebrows/caps `0.12em` (`--tracking-caps`). Don't mix Fredoka and Nunito arbitrarily.
- **Spacing**: 4-step base (`--s-1` 4px to `--s-11` 96px). Use Tailwind utilities.
- **Radius**: `rounded-xs` 8 · `sm` 12 · `md` 16 (base) · `lg` 20 · `xl` 28 · `2xl` 40 · `pill` 999. Buttons `md`-`xl`. Cards `xl`-`2xl`.
- **Elevation**: `shadow-elev-1` chips · `elev-2` buttons/MCQ · `elev-3` primary CTA, cards, lesson nodes · `elev-4` modals, boss nodes · `elev-inset` progress wells, code.
- **Motion**: `ease-bounce` (arrival, celebration), `ease-spring` (node pop-in), `ease-out` (standard), `ease-in` (exit). Durations `dur-instant` 80ms to `dur-stage` 600ms. Honor `prefers-reduced-motion: reduce`.

### Styling rules: shadcn + Tailwind ONLY. CSS-direct is BANNED.

ESLint enforces this. These are guardrails, not conventions.

**Allowed**
- `@/common/components/ui/*` primitives.
- Tailwind utility classes. All Naveo tokens are exposed (`bg-bg-surface`, `text-ink-2`, `shadow-elev-3`, `rounded-xl`, `font-display`, `duration-fast`, `ease-bounce`, `bg-track-mcp/16`).
- Tailwind arbitrary-value classes that embed tokens: `shadow-[0_var(--press-y)_0_0_var(--primary-shadow)]`. Use for chunky variants that don't map to a stock utility.
- Inline `style={{}}` ONLY for runtime-computed values that genuinely can't be Tailwind: `width` / `height` / `transform` / `gap` driven by props, custom property assignments (`{"--press-y": "5px"}`). NEVER for color, background, border, radius, padding, margin, font, shadow.

**Banned (lint will error)**
- New `*.css` files anywhere under `src/`. `globals.css` is the single source of CSS truth. Legacy module-level CSS was deleted (see `docs/css-migration.md` for the historical record).
- Hex codes (`#XXXXXX`), `oklch(...)`, `rgb(...)`/`rgba(...)` literals in `.tsx`/`.ts`. Always go through a token.
- `style={{ color, background, backgroundColor, padding, margin, border, borderRadius, boxShadow, font, fontFamily, fontSize, fontWeight, lineHeight }}` keys.
- `<style>` JSX tags, `dangerouslySetInnerHTML` for CSS, styled-components, CSS-in-JS libraries.
- Gradients, glows, blur halos, starfields, cockpit overlays, or any "AI-slop" decoration.
- Removed tokens: `--brand-gold`, `--brand-cyan`, `xp-gold`, `signal-cyan`, `mission-magenta`, character ribbon tokens. Gold lives as `--stat-xp`. Cyan went away entirely.
- Painting large surfaces (cards, page backgrounds) with track colors. `bg-track-*` is only for lesson nodes, banners, and chips. Cards stay on `bg-surface`.

**Chunky button anatomy** (use the `Button` variant, don't copy-paste): `bg-primary text-primary-foreground shadow-[0_var(--press-y)_0_0_var(--primary-shadow)] active:translate-y-[var(--press-y)] active:shadow-none transition-[transform,box-shadow] duration-fast`.

**Button variants**: `default` (mint primary), `secondary` (raised surface), `outline`, `ghost`, `destructive` (magenta), `link`, `track-prompting | track-mcp | track-skills | track-agents | track-tooling | track-evals`.

## Code Style

- TypeScript strict. Functional components only.
- Server Components by default. `"use client"` only when hooks/interactivity are needed.
- Server data flows through Server Components (RSC fetch) and Server Actions. We do NOT use React Query in modules.
- `"use server"` only at the top of Server Action files.
- No emojis in code or UI. Terse, direct commit messages.

### Naming

- **Files**: kebab-case (`step-shell.tsx`, `lesson-node.tsx`, `tutor-drawer.tsx`). Views end in `-view.tsx`.
- **React components**: PascalCase. Default-export only for Next.js pages/layouts. Everything else is a named export.
- **Types**: PascalCase. Prefer `type` aliases. Use `interface` only for `Props` declarations.
- **Constants**: `UPPER_SNAKE_CASE` for module-level frozen data (`SHOP_ITEMS`, `PROMPT_LANGS`). Regular camelCase for everything else.
- **Booleans**: `is*` / `has*` / `can*` / `should*` (`isLoading`, `hasError`, `canSubmit`). Never `flag` or `loading` (ambiguous).
- **Event handlers**: local handler functions are `handleX` (`handleClick`, `handleSubmit`). Props that accept a handler are `onX` (`onCheck`, `onAdvance`). Wire as `onClick={handleClick}` or `onClick={onSend}`.
- **Server Actions**: end in `Action` (`purchaseShopItemAction`). Return a discriminated union typed `Promise<...Result>`.
- **Zod schemas**: `XxxSchema` for the schema, `XxxInput` for the inferred type.

### Server vs Client Components

Default to Server. Reach for `"use client"` only when you need: state (`useState`/`useReducer`), effects (`useEffect`), refs, event handlers, browser APIs, or a hook from a client-only library.

**Common pitfalls**
- Don't pass functions, class instances, or Date objects across the server→client boundary as props. Pass primitives and plain objects, format/parse on the receiving side.
- A client component can render server children only when those children are passed in as `children`/slots from a server parent. Importing a server component from inside a client tree silently makes it client.
- Anything imported by a client component is bundled to the client. Use `import "server-only"` on any file that touches the DB, secrets, or `auth()` to fail the build if a client import sneaks in.
- Server Components can be `async`. Client Components cannot. Use `<Suspense>` (or a route-level `loading.tsx`) to stream when an async server child is slow.
- Hoist `"use client"` to the smallest leaf possible. Don't mark a whole view client just because one button needs interactivity. Extract the button.

### Copy rule: NO em-dashes ever

The em-dash character `—` (U+2014) and its asymmetric variants are **banned in all user-facing copy**: `messages/*.json`, `content/**/*.{mdx,yaml}`, and any hardcoded string in `.tsx`/`.ts` that renders to a user (alt text, placeholders, demo copy, dialog bubbles).

**Why**: it's an AI-tell. The product writes like a person.

**Use instead**:
- Parenthetical aside: comma. `Hey Pasho, bridge crew here.`
- Clause break: period. `Insurance only. Never a skip on evaluation.`
- Label/value separator: colon or middle dot. `Section 1 · Unit 4`.

In code comments inside `.tsx`/`.ts`, em-dashes are tolerated (internal docs, not UI), but prefer plain punctuation if it reads fine.

### Early returns (mandatory)

Guard clauses first, happy path last. Never nest if/else. `else` is OK inside loops and for multi-branch value assignment where early return doesn't apply.

```tsx
const getLabel = (age: number) => {
  if (age < 18) return "underage"
  if (age < 30) return "young"
  return "old"
}

// Components: error, then loading, then empty, then data
function ListView() {
  const { data, isLoading, isError, error } = useItems()
  if (isError) return <p className="text-destructive">{error.message}</p>
  if (isLoading) return <Loader2 className="animate-spin" />
  if (!data?.length) return <p className="text-muted-foreground">No items found</p>
  return <div>{data.map(item => <Card key={item.id}>{item.title}</Card>)}</div>
}
```

Don't nest ternaries in JSX. Extract to early returns or variables.

### Error handling

- **React Query hooks**: `throw` is OK. RQ sets `isError`.
- **Route Handlers**: `throw` is OK. Wrap with a top-level error handler returning a JSON response.
- **Server Actions**: NEVER throw. Return `{ ok: false, error }` / `{ ok: true, ... }`. Throwing surfaces as a generic error in client forms.
- **Components / event handlers / downloads**: wrap in `try/catch` (or `try/catch/finally`), show toast on failure.

```tsx
const handleDownload = async () => {
  try {
    const url = await renderFrame()
    triggerDownload(url)
  } catch {
    toast.error("Download failed")
  }
}

"use server"
export async function createItem(input: CreateItemInput) {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: "Invalid input" }
  const item = await itemService.create(parsed.data)
  return { ok: true as const, item }
}
```

### Fallbacks (explicit, not silent)

- OK: `frame.text ?? ""` (empty string is a valid default for text input).
- OK: `frame.backgroundUrl ?? frame.originalUrl` (explicit fallback chain).
- BAD: `const items = data ?? []` then mapping. Hides missing data.
- Better: early return `if (!data) return <Empty />`, then use `data` directly.

### Forms + Server Actions (standard pattern)

```tsx
"use client"
import { useState, useTransition } from "react"

export function BuyButton({ slug }: { slug: ShopItemSlug }) {
  const t = useTranslations("shop")
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<null | { kind: "success" | "error"; message: string }>(null)
  const router = useRouter()

  const handleBuy = () => {
    setFeedback(null)
    startTransition(async () => {
      const result = await purchaseShopItemAction({ slug })
      if (result.ok) {
        setFeedback({ kind: "success", message: t("bought") })
        router.refresh()
        return
      }
      setFeedback({ kind: "error", message: t(`errors.${result.error}`) })
    })
  }

  return <Button onClick={handleBuy} disabled={pending}>{pending ? t("buying") : t("buy")}</Button>
}
```

- The action validates with Zod and returns a discriminated union `{ ok: true, ... } | { ok: false, error: "code" }`. Codes are stable strings the UI maps to translations.
- Pending state from `useTransition` disables the submit and drives label changes.
- `router.refresh()` re-renders the current server route with fresh data. Use `revalidatePath`/`revalidateTag` inside the action when other routes need invalidation.
- Never throw inside the action. Errors return as `{ ok: false, error }`. Throw only from the inner `service.ts` if a real exception occurs, and let the top-level action wrapper convert it.

### Tailwind helpers + icons + assets

- **`cn()`** from `@/common/lib/utils` (clsx + tailwind-merge). Use for conditional classes: `cn("base", isActive && "ring-2 ring-primary", className)`. Always merge an incoming `className` prop last so callers can override.
- **`cva`** (`class-variance-authority`) for component variants in primitives. Define variants once in the primitive (see `lesson-node.tsx`, `dialog-bubble.tsx`), never inline at the call site.
- **Icons: Lucide-only.** No Heroicons, no react-icons. If a glyph isn't in Lucide, hand-draw a custom SVG primitive next to the related component (see `Mascot`).
- **Icon sizing**: pass `className="size-4"` / `size-5` / `size-6`. Don't pass numeric `size={16}`.
- **Static assets** live in `public/`. Use `next/image` for raster art (`<Image src="/..." alt="" width={} height={} />`). SVGs that need theming inline as React components (see `mdx-components.tsx` and primitives). User-uploaded media goes through the storage abstraction (`STORAGE_INTERFACE` env var), never directly to `public/`.

### Comments + docs philosophy

- Default to **no comments**. Well-named identifiers do the explaining.
- Add a comment ONLY when the *why* is non-obvious: a hidden constraint, a workaround for a specific bug, behavior that would surprise a reader. Never to restate the *what*.
- Don't reference the current task or caller ("used by X", "added for the Y flow"). That rots. PR description is the right place.
- No documentation files (`*.md`) unless asked. The plan in `docs/plan/` is the long-form doc. CLAUDE.md and the README are the only general guides.
- JSDoc only on functions exported across module boundaries where signatures are non-obvious. Internal helpers don't need it.

### Accessibility baseline

- Use semantic HTML first (`<button>`, `<nav>`, `<main>`, `<form>`, `<label htmlFor>`). Custom `<div onClick>` only when there is no semantic option.
- Keyboard parity: every interactive thing must work with `Tab` + `Enter`/`Space`. Don't kill outline styles. shadcn primitives give you focus-visible rings for free, keep them.
- ARIA only when the semantic HTML and the shadcn primitive don't already convey the role/state. Don't slap `aria-*` on every node.
- `alt` on every `<img>`/`Image>`. Decorative images use `alt=""`.
- Contrast: stick to ink/surface token pairs. Don't put `ink-3`/`ink-4` text on `bg-surface` for primary content (caption-only).
- Respect `prefers-reduced-motion: reduce`. The motion utilities already wire this up. Don't reintroduce raw `@keyframes`.

## Internationalization

**Every user-facing string MUST go through `next-intl`. No hardcoded text in views, components, or server responses returned to users.**

### Setup

- Locales: `es` (default), `en`. Root `/` redirects to default locale via middleware.
- Config: `src/common/i18n/routing.ts` is the single source of truth for locales/default.
- Messages: `messages/<locale>.json`, organized by namespace (typically one top-level key per module: `home`, `auth`, `common`, etc.).
- Plugin: `createNextIntlPlugin('./src/common/i18n/request.ts')` in `next.config.ts`.

### Usage

```tsx
// Server Component (default for most components)
import { getTranslations } from "next-intl/server"
export async function HomeView() {
  const t = await getTranslations("home")
  return <h1>{t("heading")}</h1>
}

// Client Component
"use client"
import { useTranslations } from "next-intl"
export function SubmitButton() {
  const t = useTranslations("home")
  return <button>{t("submit")}</button>
}

// Rich text (keep the sentence intact, don't split)
t.rich("intro", { templates: (chunks) => <a href="...">{chunks}</a> })
// "intro": "Head over to <templates>Templates</templates> to start."

// Interpolation
t("greeting", { name: user.firstName })  // "Hello {name}"
```

For Server Actions / Route Handlers returning user-facing messages:
```ts
const t = await getTranslations("auth")
return { ok: false, error: t("errors.invalidEmail") }
```

### Routing, static rendering, message conventions

- **Always import from `@/common/i18n/navigation`** (`Link`, `useRouter`, `redirect`), NOT bare `next/link` or `next/navigation`. These prepend the active locale automatically.
- **Static rendering**: in every `[locale]/layout.tsx` and `[locale]/.../page.tsx`, call `setRequestLocale(locale)` before any next-intl API. Export `generateStaticParams` from the locale layout to pre-render both locales.
- **Message files**: ES is the source of truth (add keys there first, then mirror in `en.json`). One top-level key per module. Keep nesting to 2-3 levels max. Never inline a JS fallback string (`t("missingKey") || "Hello"`). Fix the translation file.
- **API routes stay at `/api/...`**, NOT under `[locale]`.

## MDX content authoring

Lesson content and daily quests live in `content/<locale>/`. The build step (`pnpm build:content`) compiles MDX + frontmatter into the runtime catalog. Both `es` and `en` must stay in lockstep for any published step.

### Step frontmatter (`content/<locale>/steps/<track>/<slug>.mdx`)

```yaml
title: "Contraejemplos: enseñar con lo que NO hacer"
order: 8                    # within the course
estimatedMinutes: 5
characters:                  # which crew members star in this step
  - echo
exercise:
  kind: prompt-AB            # one of the kinds supported by src/modules/exercises
  question: |
    Multi-line prompt copy goes here.
  optionA: |
    ```
    Prompt A literal
    ```
  optionB: |
    ```
    Prompt B literal
    ```
  correct: B
```

### Daily quest frontmatter (`content/<locale>/daily/NNN-<slug>.mdx`)

```yaml
title: "Misión exprés: corrección quirúrgica"
intro: |
  One-paragraph hook shown on the daily card.
station: vega                # owner station (see docs/plan/10-estaciones.md)
teaches:                     # concept slugs from the knowledge bank
  - surgical-correction-prompt
characters:
  - echo
  - vega
scenes:                      # min 5 scenes (see docs/plan/11-daily-quests.md)
  - kind: prompt-AB
    ...
```

### Allowed MDX components

The MDX runtime exposes only what is registered in `src/common/components/mdx-components.tsx`. As of now: `Callout`, `Character`, `DecisionChain`, `DecisionFlow`, `PromptEditor`, plus themed HTML elements (headings, paragraphs, lists, code fences, anchors, tables). Don't import arbitrary React components into MDX. If you need a new one, register it there.

### Content copy rules

- Same NO-em-dash rule as everywhere else. Use commas, periods, colons, or `·`.
- Spanish is the source of truth. Author `es` first, then mirror to `en`. Don't ship a step in only one locale.
- Keep paragraphs short (2-4 sentences). The reading pane is narrow (62ch).
- Code fences with `xml`, `html`, `markdown`, `md` get the rich `PromptEditor` (CodeMirror). Other languages render in the compact `.mdx-code` wrapper.
- `teaches:` slugs must exist in the knowledge bank. Daily quests bias selection by intersection with the user's completed concepts (see `docs/plan/11-daily-quests.md`).

## Backend (inside Next.js)

- **Route Handlers** (`app/api/<domain>/route.ts`) for REST endpoints consumed by React Query or external clients.
- **Server Actions** (`module/actions.ts`) for form submissions and mutations from RSC/forms.
- Both call `module/service.ts`. Handlers and actions stay thin: auth, validate, service, respond.
- **Validation**: Zod at every server entry point. Never trust client input.
- **Auth**: Clerk. Use `currentUser()` from `server/auth.ts` and bail out with `401` / `unauthorized()` early.
- **DB**: Prisma. Import the singleton from `server/db.ts`. `prisma db push` in dev, migrations in CI/prod.
  - **Naming**: models PascalCase singular (`ContentPiece`, not `content_pieces`). Fields camelCase. Let Prisma map automatically (no `@@map` / `@map` unless needed).
  - **Relations**: name both sides explicitly when there are multiple FKs to the same model (see `PieceRelation` with `from`/`to`).
  - **pgvector**: declare as `Unsupported("vector(1024)")`. Read/write via raw SQL only.
  - **Raw SQL**: use `prisma.$queryRaw` ONLY for pgvector similarity (`<->`, `<=>`) or operations Prisma can't express. Everything else goes through the typed client.
  - **Transactions**: wrap a write that depends on a read, or multiple coordinated writes, in `prisma.$transaction([...])`. Don't sprinkle transactions on isolated single-table updates.
  - **N+1**: include relations up front (`include` / `select`). Never loop a list issuing one query per item.
  - **Indexes**: any column used in a `WHERE` or `ORDER BY` for a hot path needs `@@index`. Locale-prefixed compound keys are the norm (`[type, locale]`, `[parentSlug, locale]`).
- **Rate limiting**: `server/rate-limit.ts` helper on public/auth-light endpoints.
- **LLM**: route everything through OpenRouter (`@openrouter/ai-sdk-provider`) via the Vercel `ai` SDK. Default models live in `src/modules/llm/data.ts`.

## Quick reference: never

- Add a separate backend package, a light-mode toggle, or new `*.css` files under `src/`.
- Reach for React Query. We use Server Actions + RSC fetch. If you need client cache, ask first.
- Reintroduce removed tokens (`--brand-gold`, `--brand-cyan`, `xp-gold`, `signal-cyan`, `mission-magenta`, character ribbons).
- Paint cards or page surfaces with `bg-track-*`.
- Put types in hook files. Duplicate data across modules. Use modals when inline UI or popovers work. Over-engineer.
- Throw inside Server Actions. Throw outside Route Handlers or RSC fetch boundaries.
- Pass functions, Date objects, or class instances across the RSC→client boundary.
- Mark a whole view `"use client"` because one button is interactive. Extract the leaf instead.
- Import server code (db, auth, services) into client components. `new PrismaClient()` outside `server/db.ts`. Skip Zod validation on server entry points.
- Use if/else (prefer early returns). Use `?? []` to hide missing data. Nest ternaries in JSX.
- Hardcode user-facing strings. Use em-dashes in user copy. Use bare `next/link` or `next/navigation`'s `useRouter`/`redirect`.
- Ship a new feature without adding message keys to BOTH `messages/es.json` and `messages/en.json`.
- Ship a step or daily quest in only one locale. ES first, then mirror to EN.
- Import an unregistered React component inside MDX. Register it in `mdx-components.tsx` first.
- Use numeric icon sizes (`size={16}`). Use Tailwind `size-*` classes. No icon library other than Lucide.
- Put `[locale]` around `app/api/**`.
- Use `prisma.$queryRaw` for anything Prisma can express. Reserve raw SQL for pgvector similarity.
- Write comments that restate the *what*, reference the current PR, or duplicate JSDoc on internal helpers. Default to no comments.
