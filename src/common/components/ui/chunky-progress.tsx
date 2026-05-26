import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — chunky progress with inset well + top highlight stripe.
   The well sits sunken (elev-inset) and the filled bar carries a 6px
   white-ish stripe on top for the chunky "candy bar" look. */
const chunkyProgressVariants = cva("rounded-full", {
  variants: {
    tone: {
      primary: "bg-primary",
      xp: "bg-stat-xp",
      streak: "bg-stat-streak",
      success: "bg-success",
      prompting: "bg-track-prompting",
      mcp: "bg-track-mcp",
      skills: "bg-track-skills",
      agents: "bg-track-agents",
      tooling: "bg-track-tooling",
      evals: "bg-track-evals",
    },
  },
  defaultVariants: { tone: "primary" },
})

type ChunkyProgressProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof chunkyProgressVariants> & {
    value: number
    max?: number
    label?: React.ReactNode
    showLabel?: boolean
  }

function ChunkyProgress({
  className,
  tone,
  value,
  max = 100,
  label,
  showLabel = false,
  ...props
}: ChunkyProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cn("w-full", className)} {...props}>
      {label ? (
        <div className="mb-1.5 font-display font-bold text-[11px] uppercase tracking-[0.12em] text-ink-3">
          {label}
        </div>
      ) : null}
      <div
        data-slot="chunky-progress"
        className="relative h-5 w-full overflow-hidden rounded-full bg-bg-sunken shadow-elev-inset"
      >
        <div
          className={cn(
            chunkyProgressVariants({ tone }),
            "absolute inset-y-0 left-0 transition-[width] duration-slow ease-bounce",
          )}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-x-1.5 top-0.5 h-1 rounded-full bg-white/45" />
        </div>
        {showLabel ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 font-display font-bold text-[11px] text-black/60">
            {Math.round(pct)}%
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { ChunkyProgress, chunkyProgressVariants }
export type { ChunkyProgressProps }
