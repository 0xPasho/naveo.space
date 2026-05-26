import { cn } from "@/common/lib/utils"

type Props = {
  completed: number
  total: number
  className?: string
}

export function ProgressBar({ completed, total, className }: Props) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-sunken shadow-elev-inset">
        <div
          className="h-full rounded-full bg-stat-xp transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-ink-3">
        {completed} / {total}
      </span>
    </div>
  )
}
