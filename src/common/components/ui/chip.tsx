import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — caps lozenge for TIP / NEW / IN PROGRESS / etc.
   Tinted soft background + saturated foreground. Use chip for status,
   tags, and quick labels; reserve HudPill for HUD counters (XP, streak). */
const chipVariants = cva(
  [
    "inline-flex items-center gap-1.5 px-3 py-1",
    "rounded-full",
    "font-display font-bold text-[11px] uppercase tracking-[0.12em]",
    "border-2 border-transparent",
  ].join(" "),
  {
    variants: {
      tone: {
        primary: "bg-primary-soft text-primary",
        success: "bg-success-soft text-success",
        warn: "bg-warn-soft text-warn",
        danger: "bg-danger-soft text-danger",
        xp: "bg-stat-xp/16 text-stat-xp",
        streak: "bg-stat-streak/16 text-stat-streak",
        heart: "bg-stat-heart/16 text-stat-heart",
        gem: "bg-stat-gem/16 text-stat-gem",
        outline: "bg-transparent text-ink-2 border-line-strong",
        prompting: "bg-track-prompting/16 text-track-prompting",
        mcp: "bg-track-mcp/16 text-track-mcp",
        skills: "bg-track-skills/16 text-track-skills",
        agents: "bg-track-agents/16 text-track-agents",
        tooling: "bg-track-tooling/16 text-track-tooling",
        evals: "bg-track-evals/16 text-track-evals",
      },
    },
    defaultVariants: { tone: "primary" },
  },
)

type ChipProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof chipVariants>

function Chip({ className, tone, ...props }: ChipProps) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ tone }), className)}
      {...props}
    />
  )
}

export { Chip, chipVariants }
export type { ChipProps }
