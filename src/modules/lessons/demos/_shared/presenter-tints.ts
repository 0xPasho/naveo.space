import { CAST } from "@/modules/cast/data"
import type { CrewSlug } from "@/modules/crew"

export type PresenterTint = {
  text: string
  border: string
  bg: string
  glow: string
}

const TINTS_BY_COLOR = {
  gold: {
    text: "text-stat-xp",
    border: "border-stat-xp/40",
    bg: "bg-stat-xp/10",
    glow: "shadow-[0_0_42px_-12px_var(--stat-xp)]",
  },
  cyan: {
    text: "text-track-prompting",
    border: "border-track-prompting/40",
    bg: "bg-track-prompting/10",
    glow: "shadow-[0_0_42px_-12px_var(--track-prompting)]",
  },
} as const satisfies Record<"gold" | "cyan", PresenterTint>

export function getPresenterTint(slug: CrewSlug): PresenterTint {
  const character = CAST.find((c) => c.slug === slug)
  return TINTS_BY_COLOR[character?.color ?? "cyan"]
}
