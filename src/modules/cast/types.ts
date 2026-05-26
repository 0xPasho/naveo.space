// Brand color tokens for character glyphs. Strings reference CSS custom
// properties so they pick up theme changes automatically.
export type CharacterColor = "gold" | "cyan"

// CSS custom-property name used as the dossier accent for each crew member.
// Mapped to a single var so the dossier UI can theme posters, bond meters,
// and stat values without branching by character.
export type CharacterAccent =
  | "--brand-gold"
  | "--signal-cyan"
  | "--mission-magenta"
  | "--forge-orange"
  | "--orbit-steel"
  | "--breach-violet"

export type CharacterSlug = "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"

// Character SHAPE only — localized strings (role, description, appearsIn)
// live in `messages/<locale>.json` under `crew.dossier.<slug>` so the UI
// renders the right language. Consumers read them via `useTranslations`.
export type Character = {
  slug: CharacterSlug
  name: string
  // Single Unicode glyph used as the visual mark. Picked for universal
  // font support; see docs/plan/cast.md for the rationale.
  glyph: string
  // Tint — alternated between the two brand accents for visual variety.
  color: CharacterColor
  // Per-character accent applied across the dossier UI.
  accent: CharacterAccent
  // Track slug that gates access to the character. Null means available
  // from day one. When set, the dossier renders in a locked state until
  // the player has reached that track.
  lockedTrack: string | null
}
