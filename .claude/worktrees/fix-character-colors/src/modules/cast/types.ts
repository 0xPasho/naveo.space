export type CharacterSlug = "vega" | "atlas" | "echo" | "forge"

// Each character has its own signature accent. Slug doubles as the color key
// because each character owns one color. Actual CSS values live in the
// --char-{slug} tokens in globals.css.
export type CharacterColor = CharacterSlug

export type Character = {
  slug: CharacterSlug
  name: string
  // Pedagogical role — one short line shown next to the name.
  role: string
  // Signature accent — same as slug. Kept on the record so call sites can
  // pass `character.color` to a tone lookup without re-deriving it.
  color: CharacterColor
  // Tracks the character appears in. Free-form for now (humans read it).
  appearsIn: string
  // 1-2 sentence description of the character's vibe.
  description: string
}
