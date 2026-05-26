import type { Character } from "./types"

// Source of truth for crew members rendered in product UI (Bridge crew grid,
// future Character cards, etc.). Conceptual definitions live in
// docs/plan/cast.md — this file mirrors the visual vocabulary only.
export const CAST: readonly Character[] = [
  {
    slug: "vega",
    name: "Vega",
    role: "Primera oficial — mentor",
    glyph: "⬢",
    color: "gold",
    appearsIn: "Track 1",
    description:
      "Te recibe a bordo. Te enseña cómo se da una instrucción que no se malinterprete.",
  },
  {
    slug: "atlas",
    name: "Atlas",
    role: "Capitán",
    glyph: "▲",
    color: "cyan",
    appearsIn: "Track 1 (final), Track 4",
    description:
      "Quien firma tu primer parte. Demanda estructura precisa y pocas palabras.",
  },
  {
    slug: "echo",
    name: "Echo",
    role: "Quartermaster",
    glyph: "◇",
    color: "cyan",
    appearsIn: "Track 1, Track 4",
    description:
      "Verifica datos. Habla en checklists. Le encantan los formatos limpios.",
  },
  {
    slug: "forge",
    name: "Forge",
    role: "Chief engineer",
    glyph: "⚙",
    color: "gold",
    appearsIn: "Track 3+",
    description:
      "Construye los tools que usa la crew. Le encanta explicar cómo funcionan las cosas por dentro.",
  },
] as const
