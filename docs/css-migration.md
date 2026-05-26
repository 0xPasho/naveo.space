# CSS Migration — Naveo "Bridge"

**Status: complete.** All 9 legacy module-level CSS files have been deleted. The single allowed stylesheet is `src/app/globals.css` (the design-token source of truth).

ESLint enforces the rule going forward (see `eslint.config.mjs`):
- No new `*.css` imports anywhere except `globals.css`.
- No hex / oklch / rgb literals in `.tsx` / `.ts` files (except for the palette data files in the allowlist).

## Final inventory

| File | LOC | Status |
|---|---:|---|
| `src/modules/shop/styles.css` | 14 | ✓ Deleted |
| `src/modules/home/styles.css` | 113 | ✓ Deleted |
| `src/modules/practice/styles.css` | 119 | ✓ Deleted |
| `src/modules/users/profile-styles.css` | 599 | ✓ Deleted |
| `src/modules/leaderboard/styles.css` | 727 | ✓ Deleted |
| `src/modules/dashboard/styles.css` | 880 | ✓ Deleted |
| `src/common/layout/styles.css` | 1380 | ✓ Deleted |
| `src/modules/catalog/styles.css` | 1779 | ✓ Deleted |
| `src/modules/lessons/styles.css` | 1838 | ✓ Deleted |

**Total deleted:** 7,449 LOC of legacy CSS across 9 files. Everything now renders through:
- Tailwind utility classes backed by tokens in `src/app/globals.css`.
- Primitives in `src/common/components/ui/` (44+ components, see `docs/design-system.md`).

## What the rule means going forward

- New views import primitives from `@/common/components/ui`, not styles.
- Tokens live exclusively in `globals.css`. Reference them via Tailwind utilities (`bg-bg-surface`, `text-ink-2`, `shadow-elev-3`) or arbitrary-value classes (`shadow-[0_5px_0_0_var(--primary-shadow)]`).
- Inline `style={{}}` is reserved for runtime-computed values that genuinely can't be Tailwind: dynamic widths, transforms, custom property assignments. Never for color/background/border/radius/padding/margin/font/shadow.
- Hex / oklch literals in `.tsx` are banned by lint. Palette data files (`catalog/data.ts`, `cast/data.ts`, `crew/data.ts`, `dashboard/data.ts`, `crew/lib.tsx`) are allowlisted because they're the source of truth for the catalog color schemes.

If a future feature requires a new CSS file, that's a smell — push back and route through the design system tokens or a new primitive instead.
