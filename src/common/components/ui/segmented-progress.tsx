import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — segmented progress for "lesson 3 of 6" indicators.
   Filled segments adopt the tone; empty segments are sunken inset wells. */
const segmentVariants = cva("flex-1 rounded-full transition-colors", {
  variants: {
    tone: {
      primary: "bg-primary",
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

type SegmentedProgressProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof segmentVariants> & {
    total: number
    current: number
    height?: number
  }

function SegmentedProgress({
  className,
  tone,
  total,
  current,
  height = 10,
  ...props
}: SegmentedProgressProps) {
  return (
    <div
      data-slot="segmented-progress"
      className={cn("flex w-full gap-1.5", className)}
      style={{ height }}
      {...props}
    >
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current
        return (
          <div
            key={i}
            className={cn(
              filled ? segmentVariants({ tone }) : "flex-1 rounded-full bg-bg-sunken shadow-elev-inset",
            )}
          />
        )
      })}
    </div>
  )
}

export { SegmentedProgress }
export type { SegmentedProgressProps }
