import { cn } from "@/common/lib/utils"
import { CHARACTER_ACCENT } from "@/modules/cast/lib"

// Canonical names per docs/plan/cast.md. Add new members here as they're
// introduced in content; the key matches the slug used by `name="..."`.
const NAMES = {
  vega: "Vega",
  atlas: "Atlas",
  echo: "Echo",
  forge: "Forge",
} as const

export type CharacterName = keyof typeof NAMES

type Props = {
  name: CharacterName
  children?: React.ReactNode
  className?: string
}

// Character mention. Renders the canonical name in that crew member's
// signature color (--char-{slug}). Use inside MDX to highlight crew members;
// pass `children` to override the visible text (e.g. for possessive forms).
export function Character({ name, children, className }: Props) {
  return (
    <span
      data-character={name}
      className={cn(
        "font-semibold tracking-wide",
        CHARACTER_ACCENT[name].text,
        className,
      )}
    >
      {children ?? NAMES[name]}
    </span>
  )
}
