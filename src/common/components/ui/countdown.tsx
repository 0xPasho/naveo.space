import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — countdown tiles (days / hours / mins / secs).
   Used on League screen "this week ends in" and similar. Display-only
   primitive; pass already-computed values. */
type CountdownUnit = {
  label: React.ReactNode
  value: number
  /** Min digits, padded with leading zeros. Default 2. */
  pad?: number
}

type CountdownProps = {
  units: ReadonlyArray<CountdownUnit>
  className?: string
}

function pad(value: number, width: number) {
  return value.toString().padStart(width, "0")
}

function Countdown({ units, className }: CountdownProps) {
  return (
    <div
      data-slot="countdown"
      className={cn("inline-flex items-stretch gap-2", className)}
    >
      {units.map((unit, i) => (
        <div
          key={i}
          className="flex w-16 flex-col items-center justify-center rounded-md border-2 border-line-strong bg-bg-deep px-1 py-2.5"
        >
          <span className="font-display font-bold text-3xl tracking-tight tabular-nums text-ink-1">
            {pad(unit.value, unit.pad ?? 2)}
          </span>
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.12em] text-ink-3">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export { Countdown }
export type { CountdownProps, CountdownUnit }
