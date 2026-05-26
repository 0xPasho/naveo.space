import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — streak heatmap.
   7 columns (days, Mon-Sun) × N rows (weeks). Intensity drives the
   streak-flame opacity. Empty cells sit in bg-sunken with elev-inset. */
type StreakIntensity = 0 | 1 | 2 | 3

type StreakGridProps = {
  weeks: ReadonlyArray<ReadonlyArray<StreakIntensity>>
  className?: string
  cellSize?: number
}

const intensityClass: Record<StreakIntensity, string> = {
  0: "bg-bg-sunken shadow-elev-inset",
  1: "bg-stat-streak/30",
  2: "bg-stat-streak/60",
  3: "bg-stat-streak shadow-[0_2px_0_0_var(--stat-streak-shadow)]",
}

function StreakGrid({
  weeks,
  className,
  cellSize = 16,
}: StreakGridProps) {
  return (
    <div
      data-slot="streak-grid"
      className={cn("inline-flex flex-col gap-1.5", className)}
    >
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="flex gap-1.5">
          {week.map((intensity, dayIdx) => (
            <div
              key={dayIdx}
              data-intensity={intensity}
              className={cn(
                "rounded-xs",
                intensityClass[intensity],
              )}
              style={{ width: cellSize, height: cellSize }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export { StreakGrid }
export type { StreakGridProps, StreakIntensity }
