import { Check, Circle, X } from "lucide-react"

import { cn } from "@/common/lib/utils"

/* Naveo "Bridge" — single rubric criterion row.
   Three states: pending (outline circle, ink-3), passed (success disc),
   failed (danger disc + struck label). Stack multiple in a card to form
   the post-attempt rubric checklist. */
type RubricCheckState = "pending" | "passed" | "failed"

type RubricCheckProps = {
  state: RubricCheckState
  label: React.ReactNode
  hint?: React.ReactNode
  className?: string
}

const ICON_DISC: Record<RubricCheckState, string> = {
  pending: "bg-bg-raised border-2 border-line-strong text-ink-3",
  passed:
    "bg-success text-bg-deep border-2 border-success shadow-[0_2px_0_0_var(--success-shadow)]",
  failed:
    "bg-danger text-white border-2 border-danger shadow-[0_2px_0_0_var(--danger-shadow)]",
}

const LABEL_STYLE: Record<RubricCheckState, string> = {
  pending: "text-ink-3",
  passed: "text-ink-1",
  failed: "text-ink-2 line-through decoration-danger/60 decoration-2",
}

function RubricCheck({ state, label, hint, className }: RubricCheckProps) {
  return (
    <div
      data-slot="rubric-check"
      data-state={state}
      className={cn(
        "grid grid-cols-[auto_1fr] items-start gap-3 rounded-md border-2 border-line-soft bg-bg-surface p-3.5",
        className,
      )}
    >
      <div
        className={cn(
          "mt-0.5 inline-flex size-7 items-center justify-center rounded-full",
          ICON_DISC[state],
        )}
      >
        {state === "passed" ? (
          <Check className="size-4" strokeWidth={3.5} />
        ) : state === "failed" ? (
          <X className="size-4" strokeWidth={3.5} />
        ) : (
          <Circle className="size-3" strokeWidth={2.5} />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <div
          className={cn(
            "font-display font-bold text-base leading-snug",
            LABEL_STYLE[state],
          )}
        >
          {label}
        </div>
        {hint ? (
          <div className="font-sans text-sm font-semibold text-ink-3">
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { RubricCheck }
export type { RubricCheckProps, RubricCheckState }
