import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — 7-day XP bar chart.
   Vertical chunky gold bars from a baseline; today's bar pops with a
   slightly thicker shadow. Day labels sit below. */
type XpChartDay = {
  label: string
  value: number
  isToday?: boolean
}

type XpChartProps = {
  days: ReadonlyArray<XpChartDay>
  max?: number
  height?: number
  className?: string
}

function XpChart({
  days,
  max,
  height = 140,
  className,
}: XpChartProps) {
  const resolvedMax = max ?? Math.max(...days.map((d) => d.value), 1)

  return (
    <div
      data-slot="xp-chart"
      className={cn("flex w-full items-end gap-2", className)}
      style={{ height: height + 28 }}
    >
      {days.map((day, i) => {
        const pct = Math.max(2, (day.value / resolvedMax) * 100)
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className="relative flex w-full flex-col justify-end rounded-md bg-bg-sunken shadow-elev-inset"
              style={{ height }}
            >
              <div
                className={cn(
                  "w-full rounded-md bg-stat-xp transition-[height] duration-slow ease-bounce",
                  day.isToday
                    ? "shadow-[0_5px_0_0_var(--stat-xp-shadow)]"
                    : "shadow-[0_3px_0_0_var(--stat-xp-shadow)]",
                )}
                style={{ height: `${pct}%` }}
                aria-label={`${day.label}: ${day.value} XP`}
              >
                <div className="mx-1.5 mt-0.5 h-1 rounded-full bg-white/45" />
              </div>
            </div>
            <span
              className={cn(
                "font-display font-bold text-[11px] uppercase tracking-wide",
                day.isToday ? "text-stat-xp" : "text-ink-3",
              )}
            >
              {day.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { XpChart }
export type { XpChartProps, XpChartDay }
