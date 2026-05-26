import { ChevronDown } from "lucide-react"

import { cn } from "@/common/lib/utils"

type Props = {
  condition: string
  ifLabel?: string
  elseLabel?: string
  ifAction: string
  elseAction: string
  className?: string
}

// Naveo "Bridge" decision diagram: a condition pill at top, a splitter
// chevron, then two branches side by side. Each branch shows its label
// (SI / SINO), a downward chevron, and the resulting action card.
//
// Previous version tried to draw connecting lines with absolutely-sized
// divs; the math didn't match the action-card grid below so the connectors
// landed at the wrong positions. Chevrons read as flow direction without
// the geometry headache.
export function DecisionFlow({
  condition,
  ifLabel = "SI",
  elseLabel = "SINO",
  ifAction,
  elseAction,
  className,
}: Props) {
  return (
    <figure
      className={cn(
        "my-5 rounded-lg border-2 border-line-soft bg-bg-sunken px-4 py-5 font-mono shadow-elev-inset",
        className,
      )}
      aria-label="diagrama de decisión"
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <span className="rounded-md border-2 border-stat-xp/40 bg-stat-xp/10 px-4 py-2 text-center text-sm font-bold text-stat-xp">
          {condition}
        </span>

        <ChevronDown
          className="size-5 text-ink-3"
          strokeWidth={2.5}
          aria-hidden
        />

        <div className="grid w-full grid-cols-2 gap-3">
          <Branch label={ifLabel} action={ifAction} tone="primary" />
          <Branch label={elseLabel} action={elseAction} tone="muted" />
        </div>
      </div>
    </figure>
  )
}

function Branch({
  label,
  action,
  tone,
}: {
  label: string
  action: string
  tone: "primary" | "muted"
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "rounded-full border-2 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em]",
          tone === "primary"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-line-strong bg-bg-raised text-ink-3",
        )}
      >
        {label}
      </span>
      <ChevronDown
        className="size-4 text-ink-3"
        strokeWidth={2.5}
        aria-hidden
      />
      <div
        className={cn(
          "w-full rounded-md border-2 px-3 py-2 text-center text-sm font-semibold",
          tone === "primary"
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-line-strong bg-bg-raised text-ink-2",
        )}
      >
        {action}
      </div>
    </div>
  )
}
