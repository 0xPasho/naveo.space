import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — chunky HUD counter pill.
   Used in the top status bar of every screen for XP / streak / hearts /
   gems. Saturated background, tiny iconographic disc, chunky elev-1 drop. */
const hudPillVariants = cva(
  [
    "inline-flex items-center gap-2",
    "py-1 pr-3 pl-1",
    "rounded-full",
    "font-display font-bold text-base tracking-tight",
    "shadow-elev-1",
  ].join(" "),
  {
    variants: {
      kind: {
        xp: "bg-stat-xp text-track-skills-ink shadow-[0_3px_0_0_var(--stat-xp-shadow)]",
        streak: "bg-stat-streak text-track-evals-ink shadow-[0_3px_0_0_var(--stat-streak-shadow)]",
        heart: "bg-stat-heart text-white shadow-[0_3px_0_0_var(--stat-heart-shadow)]",
        gem: "bg-stat-gem text-track-prompting-ink shadow-[0_3px_0_0_var(--stat-gem-shadow)]",
        muted: "bg-bg-raised text-ink-1 shadow-elev-1",
      },
    },
    defaultVariants: { kind: "xp" },
  },
)

type HudPillProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof hudPillVariants> & {
    icon?: React.ReactNode
    value: React.ReactNode
    label?: React.ReactNode
  }

function HudPill({
  className,
  kind,
  icon,
  value,
  label,
  ...props
}: HudPillProps) {
  return (
    <div
      data-slot="hud-pill"
      className={cn(hudPillVariants({ kind }), className)}
      {...props}
    >
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-white/25">
        {icon}
      </span>
      <span className="leading-none">{value}</span>
      {label ? (
        <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
          {label}
        </span>
      ) : null}
    </div>
  )
}

export { HudPill, hudPillVariants }
export type { HudPillProps }
