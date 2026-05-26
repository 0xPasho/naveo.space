import type { PersonaSlug } from "./types"

// Default tutor persona used by the lesson player drawer.
export const DEFAULT_TUTOR_SLUG: PersonaSlug = "vega"
export const DEFAULT_TUTOR_NAME = "Vega"

// Cap how much of the lesson body we feed the model — keeps prompts cheap and
// inside Haiku's context comfortably even for long lessons.
export const MAX_BODY_CHARS = 6000
