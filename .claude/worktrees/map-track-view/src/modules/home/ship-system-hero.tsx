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

export function StarTunnelViewport() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_50%_52%,rgb(255_255_255_/_0.18),transparent_4%),radial-gradient(circle_at_48%_46%,rgb(127_229_232_/_0.16),transparent_18%),linear-gradient(115deg,rgb(8_18_38),rgb(3_5_12)_44%,rgb(13_21_45))]">
      <div className="ship-hero-tunnel absolute inset-[-20%]" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_42%,rgb(0_0_0_/_0.45)_78%),linear-gradient(90deg,rgb(0_0_0_/_0.48),transparent_20%,transparent_80%,rgb(0_0_0_/_0.42))]"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-[47%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/55 shadow-[0_0_80px_rgb(127_229_232_/_0.24)]"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-[47%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_28px_12px_rgb(255_255_255_/_0.48)]"
        aria-hidden
      />
      <div
        className="absolute inset-x-[15%] bottom-0 h-24 rounded-t-[50%] border-t border-white/15 bg-gradient-to-t from-black/80 to-transparent"
        aria-hidden
      />
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
