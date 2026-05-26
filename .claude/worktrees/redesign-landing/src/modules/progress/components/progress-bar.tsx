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
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-[color:var(--brand-gold)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {completed} / {total}
      </span>
    </div>
  )
}
