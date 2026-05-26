import { ArrowRight, ChevronDown } from "lucide-react"

import { cn } from "@/common/lib/utils"

type Props = {
  // Semicolon-separated `condition => action` pairs.
  // Either `=>` or `→` work as the separator inside each pair.
  branches: string
  fallback: string
  ifLabel?: string
  elseIfLabel?: string
  elseLabel?: string
  className?: string
}

type Branch = { condition: string; action: string }

const parseBranches = (raw: string): Branch[] => {
  if (!raw.trim()) return []
  return raw
    .split(";")
    .map((seg) => {
      const [condition, action] = seg.split(/=>|→/).map((s) => s.trim())
      return { condition: condition ?? "", action: action ?? "" }
    })
    .filter((b) => b.condition || b.action)
}

// Naveo "Bridge" chained decision diagram. Each `condition => action` pair
// is a row: label chip (SI / SINO SI) on the left, condition pill in the
// middle, arrow, action card on the right. A final fallback row (SINO)
// closes the chain. On mobile the row stacks vertically with a downward
// chevron between condition and action.
//
// Rebuilt so columns line up consistently across rows. The previous version
// used `flex flex-1` which produced inconsistent widths between rows.
export function DecisionChain({
  branches,
  fallback,
  ifLabel = "SI",
  elseIfLabel = "SINO SI",
  elseLabel = "SINO",
  className,
}: Props) {
  const items = parseBranches(branches)

  return (
    <figure
      className={cn(
        "my-5 flex flex-col gap-2 rounded-lg border-2 border-line-soft bg-bg-sunken p-4 font-mono shadow-elev-inset",
        className,
      )}
      aria-label="diagrama de decisión encadenada"
    >
      {items.map((b, i) => (
        <ChainRow
          key={i}
          label={i === 0 ? ifLabel : elseIfLabel}
          condition={b.condition}
          action={b.action}
          tone={i === 0 ? "primary" : "muted"}
        />
      ))}

      <FallbackRow label={elseLabel} action={fallback} />
    </figure>
  )
}

function ChainRow({
  label,
  condition,
  action,
  tone,
}: {
  label: string
  condition: string
  action: string
  tone: "primary" | "muted"
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-2 rounded-md bg-bg-raised/40 p-2 sm:grid-cols-[6rem_1fr_auto_1fr] sm:gap-3">
      <span
        className={cn(
          "shrink-0 self-start rounded-full border-2 px-2.5 py-1 text-center font-display text-[10px] font-bold uppercase tracking-[0.16em] sm:self-center",
          tone === "primary"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-line-strong bg-bg-raised text-ink-3",
        )}
      >
        {label}
      </span>

      <span className="min-w-0 rounded-md border-2 border-stat-xp/40 bg-stat-xp/10 px-3 py-1.5 text-sm font-bold text-stat-xp">
        {condition}
      </span>

      <span
        className="hidden items-center justify-center text-ink-3 sm:flex"
        aria-hidden
      >
        <ArrowRight className="size-4" strokeWidth={2.5} />
      </span>
      <span
        className="flex items-center justify-center text-ink-3 sm:hidden"
        aria-hidden
      >
        <ChevronDown className="size-4" strokeWidth={2.5} />
      </span>

      <span className="min-w-0 rounded-md border-2 border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-semibold text-primary">
        {action}
      </span>
    </div>
  )
}

function FallbackRow({
  label,
  action,
}: {
  label: string
  action: string
}) {
  return (
    <div className="mt-1 grid grid-cols-1 items-center gap-2 rounded-md border-t-2 border-dashed border-line-soft pt-3 sm:grid-cols-[6rem_1fr_auto_1fr] sm:gap-3">
      <span className="shrink-0 self-start rounded-full border-2 border-line-strong bg-bg-raised px-2.5 py-1 text-center font-display text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3 sm:self-center">
        {label}
      </span>
      <span
        className="hidden min-w-0 items-center px-3 font-sans text-xs italic text-ink-4 sm:flex"
        aria-hidden
      >
        ninguna condición se cumplió
      </span>
      <span
        className="hidden items-center justify-center text-ink-3 sm:flex"
        aria-hidden
      >
        <ArrowRight className="size-4" strokeWidth={2.5} />
      </span>
      <span
        className="flex items-center justify-center text-ink-3 sm:hidden"
        aria-hidden
      >
        <ChevronDown className="size-4" strokeWidth={2.5} />
      </span>
      <span className="min-w-0 rounded-md border-2 border-line-strong bg-bg-raised px-3 py-1.5 text-sm font-semibold text-ink-2">
        {action}
      </span>
    </div>
  )
}
