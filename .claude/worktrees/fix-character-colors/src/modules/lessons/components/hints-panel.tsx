"use client"

import { Lightbulb } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { cn } from "@/common/lib/utils"

type Props = {
  hints: string[]
}

// Progressive hint reveal. Starts collapsed; clicking the opener reveals the
// first hint; each subsequent click reveals one more. No DB sync of hintsUsed
// yet — that lands when we wire the hint counter back into Progress.
export function HintsPanel({ hints }: Props) {
  const t = useTranslations("lessons.hints")
  const [revealed, setRevealed] = useState(0)
  const total = hints.length
  const remaining = total - revealed

  if (revealed === 0) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(1)}
        className="group inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted"
      >
        <Lightbulb className="size-4 text-[color:var(--brand-gold)]" />
        <span>{t("opener")}</span>
        <span className="font-mono text-xs text-muted-foreground">
          ({total})
        </span>
      </button>
    )
  }

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-background/60 p-4",
        "space-y-3",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[color:var(--brand-cyan)]/80">
          <Lightbulb className="size-3.5" />
          {t("heading")}
        </p>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {revealed} / {total}
        </span>
      </div>

      <ol className="space-y-2 text-sm leading-relaxed">
        {hints.slice(0, revealed).map((h, i) => (
          <li
            key={i}
            className="flex gap-2 text-foreground"
          >
            <span className="mt-0.5 inline-block min-w-[1.25rem] font-mono text-xs text-muted-foreground tabular-nums">
              {i + 1}.
            </span>
            <span>{h}</span>
          </li>
        ))}
      </ol>

      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setRevealed((r) => r + 1)}
          className="text-xs text-[color:var(--brand-gold)] underline-offset-4 hover:underline"
        >
          {t("show", { remaining })}
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">{t("exhausted")}</p>
      )}
    </section>
  )
}
