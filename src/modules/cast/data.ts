import type { Character } from "./types"

// Source of truth for the SHAPE of crew members (slug, glyph, color, accent,
// lockedTrack). Conceptual definitions live in docs/plan/cast.md — this file
// mirrors the visual vocabulary only.
//
// All localized text (role, description, appearsIn, plus the longer dossier
// fields) lives in `messages/<locale>.json` under `crew.dossier.<slug>`.
// Consumers read them via `useTranslations("crew.dossier")` and key by slug.
export const CAST: readonly Character[] = [
  {
    slug: "vega",
    name: "Vega",
    glyph: "⬢",
    color: "gold",
    accent: "--brand-gold",
    lockedTrack: null,
  },
  {
    slug: "echo",
    name: "Echo",
    glyph: "◇",
    color: "cyan",
    accent: "--signal-cyan",
    lockedTrack: null,
  },
  {
    slug: "atlas",
    name: "Atlas",
    glyph: "▲",
    color: "cyan",
    accent: "--mission-magenta",
    lockedTrack: null,
  },
  {
    slug: "forge",
    name: "Forge",
    glyph: "⚙",
    color: "gold",
    accent: "--forge-orange",
    lockedTrack: "tools-y-mcps",
  },
  {
    slug: "orbit",
    name: "Orbit",
    glyph: "◴",
    color: "cyan",
    accent: "--orbit-steel",
    lockedTrack: "flujos-complejos",
  },
  {
    slug: "hex",
    name: "Hex",
    glyph: "✦",
    color: "gold",
    accent: "--breach-violet",
    lockedTrack: "seguridad-de-sistemas-ia",
  },
] as const
