import { Check } from "lucide-react"

import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import { timeAgo } from "@/common/lib/format"
import type { JournalEntry } from "@/modules/progress/types"

type Props = {
  entries: JournalEntry[]
  locale?: string
  emptyLabel: string
}

export function CrewJournal({ entries, locale = "es", emptyLabel }: Props) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-[color:var(--brand-cyan)]/20 bg-black/35 px-4 py-4 text-sm text-muted-foreground backdrop-blur-xl">
        {emptyLabel}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-white/10 rounded-lg border border-[color:var(--brand-cyan)]/20 bg-black/35 backdrop-blur-xl">
      {entries.map((e) => {
        const href = `/tracks/${e.trackSlug}/${e.courseSlug}/${e.stepSlug}`
        return (
          <li key={e.stepId}>
            <Link
              href={href}
              className="block transition-colors hover:bg-[color:var(--brand-cyan)]/5"
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-gold)]/15 text-[color:var(--brand-gold)]",
                  )}
                  aria-hidden
                >
                  <Check className="size-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {e.stepTitle}
                  </p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">
                    {e.courseTitle}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
                  {timeAgo(e.completedAt, locale)}
                </span>
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
