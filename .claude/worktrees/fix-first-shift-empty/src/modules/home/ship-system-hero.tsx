import type { LucideIcon } from "lucide-react"

import { cn } from "@/common/lib/utils"
import type { Character } from "@/modules/cast/types"

const colorClass = {
  gold: {
    text: "text-[color:var(--brand-gold)]",
    border: "border-[color:var(--brand-gold)]/35",
    glow: "bg-[color:var(--brand-gold)]",
  },
  cyan: {
    text: "text-[color:var(--brand-cyan)]",
    border: "border-[color:var(--brand-cyan)]/35",
    glow: "bg-[color:var(--brand-cyan)]",
  },
} as const

export function ShipSystemPanel({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-card/70 p-3 backdrop-blur">
      <div className="mb-3 flex size-8 items-center justify-center rounded-md border border-[color:var(--brand-cyan)]/25 text-[color:var(--brand-cyan)]">
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-tight">{value}</p>
    </div>
  )
}

export function CrewMascotPlaceholder({
  character,
}: {
  character: Character
}) {
  const tone = colorClass[character.color]

  return (
    <article className="relative min-w-0 overflow-hidden rounded-lg border border-white/10 bg-background/80 p-3 backdrop-blur-md">
      <div
        className={cn(
          "absolute right-3 top-3 size-2 rounded-full blur-[1px]",
          tone.glow,
        )}
        aria-hidden
      />
      <div
        className={cn(
          "mx-auto flex aspect-square max-h-24 min-h-20 items-center justify-center rounded-lg border bg-black/30",
          tone.border,
        )}
        data-placeholder={`mascot-${character.slug}`}
      >
        <div className="relative flex size-14 items-center justify-center">
          <span
            className={cn("text-4xl leading-none", tone.text)}
            aria-hidden
          >
            {character.glyph}
          </span>
          <span
            className={cn(
              "absolute inset-x-2 bottom-0 h-px shadow-[0_0_18px_currentColor]",
              tone.text,
            )}
            aria-hidden
          />
        </div>
      </div>
      <p className="mt-3 truncate text-sm font-bold leading-tight">
        {character.name}
      </p>
      <p className="mt-1 line-clamp-2 font-mono text-[10px] uppercase leading-snug tracking-wider text-muted-foreground">
        {character.role}
      </p>
    </article>
  )
}
