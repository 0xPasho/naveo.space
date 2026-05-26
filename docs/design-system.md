# Naveo "Bridge" — Design System

Single source of truth for visual language. The CSS tokens live in `src/app/globals.css` (inside `@layer base`); this doc explains intent and lists every token.

## Principles

1. **Dark-mode-only canvas.** Deep ink (`#0b1018`), not pure black. Surfaces step up in luminance (`bg-deep` → `bg-surface` → `bg-raised`) so card-on-card layouts read as a tier, not as flat overlays.
2. **Chunky 3D, flat surfaces.** Pressable elements get a *solid* drop shadow on the bottom edge — no blur. On `:active` the element translates down by the drop and the shadow collapses to zero. This is the entire "chunky" feel; it's all that's needed.
3. **Track-coded color, not theme-coded.** The brand primary is electric mint (`#19d9c4`). Each learning track gets its own hue so the catalog and lesson path feel like distinct neighborhoods, not a single tinted product.
4. **Tailwind + shadcn first.** Tokens are exposed as Tailwind utilities. Direct CSS is deprecated. Inline `style={{}}` is for runtime-computed values only (widths, transforms), never for color/spacing/radius/shadow.
5. **No AI-slop.** No gradients, no glows, no glassmorphism, no starfields, no cockpit overlays, no shimmer. If a surface needs emphasis, it gets a chunky drop and a stronger border — not a halo.

---

## Color tokens

All tokens are declared in `:root` inside `@layer base` and exposed to Tailwind via `@theme inline`. Reference them as utilities (`bg-bg-surface`, `text-ink-2`, `shadow-elev-3`) — never as hex codes in components.

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `bg-deep` | `#0b1018` | App shell, canvas |
| `bg-surface` | `#131a26` | Raised surface, primary card |
| `bg-raised` | `#1a2233` | Chip, secondary card, sidebar |
| `bg-sunken` | `#080c13` | Inset well, code block, progress track |
| `line-soft` | `rgba(255,255,255,0.06)` | Dashed dividers, subtle outlines |
| `line-strong` | `rgba(255,255,255,0.12)` | Card borders, defined edges |

### Ink (foreground tiers)

| Token | Hex | Use |
|---|---|---|
| `ink-1` | `#f3f6fb` | Primary body text, headings |
| `ink-2` | `#c5cee0` | Secondary text |
| `ink-3` | `#8896ad` | Tertiary, captions, eyebrows |
| `ink-4` | `#54607a` | Disabled |

### Primary — electric mint

| Token | Hex | Use |
|---|---|---|
| `primary` | `#19d9c4` | CTA fill, success, focus ring |
| `primary-foreground` | `#052420` | Text on primary fill |
| `primary-shadow` | `#0d9b8a` | Solid drop under chunky primary button |
| `primary-soft` | `rgba(25,217,196,0.14)` | Selected-state background, focus halo |
| `primary-glow` | `rgba(25,217,196,0.32)` | Focus ring expanded state |

### Tracks (one hue per learning track)

| Track | Top | Shadow | Ink-on-track |
|---|---|---|---|
| Prompting | `#4fb7ff` | `#2575c0` | `#04223b` |
| MCP | `#9d70ff` | `#6a40c4` | `#1c0c44` |
| Skills | `#ffb23e` | `#c47a10` | `#3a1f01` |
| Agents | `#ff5a8c` | `#b8285c` | `#3d0820` |
| Tooling | `#b8e63a` | `#7ea21a` | `#1a2400` |
| Evals | `#ff7551` | `#c0421e` | `#3a1004` |

Use as `bg-track-prompting text-track-prompting-ink shadow-[0_5px_0_0_var(--track-prompting-shadow)]` for a chunky track button.

### Stats

| Token | Hex | Use |
|---|---|---|
| `stat-xp` | `#f5c24e` | XP, level-ups, milestone gold |
| `stat-streak` | `#ff7551` | Streak flame |
| `stat-heart` | `#ff4e73` | Lives |
| `stat-gem` | `#7cb7ff` | Currency |

Each has a paired `-shadow` for chunky HUD pills.

### Semantic status

| Token | Hex | Use |
|---|---|---|
| `success` | `#19d9c4` | Pass, validated |
| `warn` | `#ffb23e` | Caution, in-progress |
| `danger` | `#ff4e73` | Error, lives lost |

Each has a `-soft` variant for tinted backgrounds.

### shadcn semantic mapping

The shadcn primitives still use the standard tokens — they're just repointed to Naveo Bridge values:

| shadcn token | → Naveo value |
|---|---|
| `--background` | `bg-deep` `#0b1018` |
| `--foreground` | `ink-1` `#f3f6fb` |
| `--card` | `bg-surface` `#131a26` |
| `--popover` | `bg-surface` |
| `--primary` | `primary` mint `#19d9c4` |
| `--primary-foreground` | `#052420` |
| `--secondary` / `--accent` / `--muted` | `bg-raised` `#1a2233` |
| `--muted-foreground` | `ink-3` `#8896ad` |
| `--destructive` | `danger` `#ff4e73` |
| `--border` / `--input` | `line-strong` `rgba(255,255,255,0.12)` |
| `--ring` | `primary` |
| `--sidebar` | `bg-surface` |

---

## Typography

| Family | Variable | Weights | Use |
|---|---|---|---|
| **Fredoka** | `--font-display` | 500, 600, 700 | Display, headings, eyebrows, chunky button labels |
| **Nunito** | `--font-sans` | 500, 600, 700, 800, 900 | Body, UI, captions, form fields |
| **JetBrains Mono** | `--font-mono` | 400, 600 | Code, mono labels, tokens |

Body weight is **600**, not 400 — Nunito reads thin and washed-out at 400 against the dark canvas.

### Type scale (CSS variables — bind through Tailwind text utilities when possible)

| Token | Size | Line height | Tailwind equivalent |
|---|---|---|---|
| `--fs-display-1` | 64px | 1.02 | `text-6xl` / custom |
| `--fs-display-2` | 48px | 1.05 | `text-5xl` |
| `--fs-title` | 32px | 1.1 | `text-3xl` |
| `--fs-subtitle` | 24px | 1.2 | `text-2xl` |
| `--fs-body-lg` | 18px | 1.5 | `text-lg` |
| `--fs-body` | 16px | 1.5 | `text-base` (default) |
| `--fs-body-sm` | 14px | 1.45 | `text-sm` |
| `--fs-caption` | 12px | 1.4 | `text-xs` |

Tracking: `--tracking-tight` `-0.02em` (headings) · `--tracking-wide` `0.06em` · `--tracking-caps` `0.12em` (eyebrows in caps).

---

## Spacing

4-step base scale exposed both as Tailwind spacing utilities and as raw `--s-*` vars.

| Var | px | Tailwind |
|---|---|---|
| `--s-1` | 4 | `1` |
| `--s-2` | 8 | `2` |
| `--s-3` | 12 | `3` |
| `--s-4` | 16 | `4` |
| `--s-5` | 20 | `5` |
| `--s-6` | 24 | `6` |
| `--s-7` | 32 | `8` |
| `--s-8` | 40 | `10` |
| `--s-9` | 56 | `14` |
| `--s-10` | 72 | `18` |
| `--s-11` | 96 | `24` |

Prefer Tailwind utilities (`p-4`, `gap-6`).

---

## Radius

Generous, friendly.

| Token | px | Tailwind |
|---|---|---|
| `--radius-xs` | 8 | `rounded-xs` |
| `--radius-sm` | 12 | `rounded-sm` |
| `--radius-md` | 16 | `rounded-md` (base) |
| `--radius-lg` | 20 | `rounded-lg` |
| `--radius-xl` | 28 | `rounded-xl` |
| `--radius-2xl` | 40 | `rounded-2xl` |
| `--radius-pill` | 999 | `rounded-full` |

Defaults: chips/pills `rounded-full` · buttons `rounded-md`–`rounded-xl` (by size) · cards `rounded-xl`–`rounded-2xl` · inputs `rounded-sm`–`rounded-md`.

---

## Elevation — chunky drops

Solid-color drops define the bottom edge of a pressable surface. They get paired with a `translateY` on `:active` to "press" the button into place.

| Token | Shadow | Use |
|---|---|---|
| `shadow-elev-1` | `0 3px 0 0 rgba(0,0,0,0.55)` | Chips, segmented |
| `shadow-elev-2` | `0 5px 0 0 rgba(0,0,0,0.55)` | Buttons, MCQ options |
| `shadow-elev-3` | `0 6px 0 0 rgba(0,0,0,0.6), 0 14px 24px -10px rgba(0,0,0,0.55)` | Primary CTA, cards, lesson nodes |
| `shadow-elev-4` | `0 8px 0 0 rgba(0,0,0,0.65), 0 24px 40px -18px rgba(0,0,0,0.65)` | Modals, boss nodes |
| `shadow-elev-inset` | `inset 0 2px 0 0 rgba(0,0,0,0.5)` | Progress wells, code blocks |

**Pressable pattern** (apply on any chunky button):

```tsx
className="bg-primary text-primary-foreground shadow-[0_5px_0_0_var(--primary-shadow)]
           transition-[transform,box-shadow] duration-[160ms] ease-out
           active:translate-y-[5px] active:shadow-none"
```

For track-colored variants, swap `--primary-shadow` for `--track-TRACK-shadow` (where `TRACK` is one of `prompting | mcp | skills | agents | tooling | evals`).

---

## Motion

| Token | Curve | Use |
|---|---|---|
| `--ease-bounce` | `cubic-bezier(.34, 1.56, .64, 1)` | Arrival, celebration, level-up |
| `--ease-spring` | `cubic-bezier(.5, 1.5, .5, 1)` | Node pop-in, expressive enter |
| `--ease-out` | `cubic-bezier(.2, .8, .2, 1)` | Standard (default) |
| `--ease-in` | `cubic-bezier(.8, .2, .8, 0)` | Exit, dismiss |
| `--ease-linear` | `linear` | Progress bars |

| Duration | ms | Use |
|---|---|---|
| `--dur-instant` | 80 | Press feedback |
| `--dur-fast` | 160 | Hover, micro-state |
| `--dur-base` | 240 | Default transitions |
| `--dur-slow` | 400 | Page-section reveals |
| `--dur-stage` | 600 | Celebrations, staged sequences |

All motion honors `prefers-reduced-motion: reduce` — animations collapse to `none`.

---

## Icons

**Lucide** is the icon library for product UI (configured in `components.json` as `iconLibrary: "lucide"`).

| Context | Pattern |
|---|---|
| Inside a button | `<Icon className="size-4" strokeWidth={2.5} />` — Button auto-sizes via `[&_svg:not([class*='size-'])]:size-4` |
| Standalone in a chunky disc / pill | `<Icon className="size-4" strokeWidth={2.5} />` inside a `size-7`/`size-9` wrapper |
| Inside a HudPill / chip / status badge | `<Icon className="size-3.5" strokeWidth={2.5} />` |
| Bottom tab icon | `<Icon className="size-full" strokeWidth={2.5} />` (the tab wrapper sizes via `size-7`) |
| Mascot eyes, insignias, mascot details | Custom SVG (not Lucide). See `Mascot` primitive. |
| Tutorial / crew character art | Painterly inline SVG with named layers. See `src/modules/crew/`. |

**Rules**
- `strokeWidth` defaults to `2` in Lucide — bump to `2.5` to match the chunky weight of Naveo's display type.
- Never inline a hex `fill` / `stroke` on a Lucide icon. Use `text-*` utilities; the icon inherits `currentColor`.
- Don't mix icon families in one screen (no Heroicons, no react-icons). If a glyph isn't in Lucide, hand-draw a custom SVG primitive next to the related component.

---

## Component patterns (target state)

These are the patterns we'll build into `src/common/components/ui/*` as we walk window-by-window. Don't hand-roll them in views — wait for the variant or extend the shadcn primitive.

| Component | Pattern |
|---|---|
| **Button — primary** | `bg-primary text-primary-foreground shadow-elev-2` + chunky press transform |
| **Button — secondary** | `bg-bg-raised text-ink-1 border-2 border-line-strong shadow-elev-2` |
| **Button — ghost** | `bg-transparent text-ink-2 hover:bg-bg-raised` (no shadow) |
| **Button — destructive** | `bg-danger text-white shadow-[0_5px_0_0_var(--danger-shadow)]` |
| **Button — track** | `bg-track-TRACK text-track-TRACK-ink shadow-[0_5px_0_0_var(--track-TRACK-shadow)]` (replace `TRACK` with `prompting`, `mcp`, etc.) |
| **Card** | `bg-bg-surface border-2 border-line-soft rounded-xl shadow-elev-3 p-6` |
| **Chip / pill** | `inline-flex items-center gap-2 px-3 py-1 rounded-full font-display font-bold text-xs uppercase tracking-[0.12em]` |
| **HUD pill** (XP/streak/heart) | chip with `bg-stat-<name>/16 text-stat-<name>` + tiny icon disc |
| **Input** | `bg-bg-sunken border-2 border-line-strong rounded-md shadow-elev-inset focus:border-primary focus:ring-4 focus:ring-primary-soft` |
| **Progress (chunky)** | inset well `bg-bg-sunken shadow-elev-inset` + filled bar with a 6px top highlight stripe |
| **Callout** | grid `auto 1fr` icon + body, `border-2 border-<status> bg-<status>-soft` |
| **Lesson node** | round chunky disc, track-colored, `shadow-elev-3`, big icon, label below in `text-track-TRACK-ink` (one of the 6 track tones) |

---

## Don'ts

- ❌ No new `*.css` files under `src/`. Direct CSS is deprecated.
- ❌ No inline `style={{ color, background, padding, borderRadius, boxShadow }}` — those go through utilities/variants.
- ❌ No hex codes, no `oklch(...)`, no `rgb(...)` in component files. Always token via Tailwind utility.
- ❌ No gradients on surfaces. No `linear-gradient`, no `radial-gradient` for backgrounds. The only exception is the deliberate 6px top highlight inside chunky progress bars (drawn via `::after`).
- ❌ No glow halos, no blur drop shadows on cards. Cards use `shadow-elev-3` (sharp solid + tight ambient), nothing fluffier.
- ❌ No starfield, cockpit, mission-briefing-panel, space-lane decoration — all removed.
- ❌ No reuse of removed tokens: `--brand-gold`, `--brand-cyan`, `--xp-gold` (now `--stat-xp`), `--signal-cyan`, `--mission-magenta`, `--hazard-red`, `--crew-green`, `--forge-orange`, `--plasma-violet`, `--orbit-steel`, `--breach-violet`, `--char-vega/atlas/echo/forge/orbit/hex`. If you need a character accent, pick a track color.
- ❌ No light mode. Don't add a toggle.

---

## Migration status

This DS replaces the previous "Crew dark + gold" theme. The new tokens are live in `globals.css`; the docs (`CLAUDE.md`, this file) reflect them. **Component and view migration is still pending** — many views reference the removed tokens and will render with missing colors until rewritten. We migrate window-by-window from here.
