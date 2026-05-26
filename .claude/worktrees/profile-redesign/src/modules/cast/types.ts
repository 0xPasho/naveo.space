// Brand color tokens for character glyphs. Strings reference CSS custom
// properties so they pick up theme changes automatically.
export type CharacterColor = "gold" | "cyan"

export type Character = {
  slug: "vega" | "atlas" | "echo" | "forge"
  name: string
  // Pedagogical role — one short line shown next to the name.
  role: string
  // Single Unicode glyph used as the visual mark. Picked for universal
  // font support; see docs/plan/cast.md for the rationale.
  glyph: string
  // Tint — alternated between the two brand accents for visual variety.
  color: CharacterColor
  // Tracks the character appears in. Free-form for now (humans read it).
  appearsIn: string
  // 1-2 sentence description of the character's vibe.
  description: string
}
