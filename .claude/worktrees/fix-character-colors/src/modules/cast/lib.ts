import type { CharacterSlug } from "./types"

// Per-character Tailwind class fragments. Backed by the --char-{slug} tokens
// in globals.css so the palette stays in one place. Tailwind needs the class
// strings to appear verbatim in source, which is why each variant is spelled
// out instead of being computed from the slug.
export const CHARACTER_ACCENT = {
  vega: {
    cssVar: "var(--char-vega)",
    text: "text-[color:var(--char-vega)]",
    border: "border-[color:var(--char-vega)]/40",
    bg: "bg-[color:var(--char-vega)]/10",
    ring: "ring-[color:var(--char-vega)]/20",
  },
  atlas: {
    cssVar: "var(--char-atlas)",
    text: "text-[color:var(--char-atlas)]",
    border: "border-[color:var(--char-atlas)]/40",
    bg: "bg-[color:var(--char-atlas)]/10",
    ring: "ring-[color:var(--char-atlas)]/20",
  },
  echo: {
    cssVar: "var(--char-echo)",
    text: "text-[color:var(--char-echo)]",
    border: "border-[color:var(--char-echo)]/40",
    bg: "bg-[color:var(--char-echo)]/10",
    ring: "ring-[color:var(--char-echo)]/20",
  },
  forge: {
    cssVar: "var(--char-forge)",
    text: "text-[color:var(--char-forge)]",
    border: "border-[color:var(--char-forge)]/40",
    bg: "bg-[color:var(--char-forge)]/10",
    ring: "ring-[color:var(--char-forge)]/20",
  },
} as const satisfies Record<CharacterSlug, unknown>
