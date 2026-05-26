import { Check } from "lucide-react"

import { Link } from "@/common/i18n/navigation"
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
      <p className="rounded-md border-2 border-line-soft bg-bg-surface px-4 py-4 font-sans font-semibold text-sm text-ink-3">
        {emptyLabel}
      </p>
    )
  }

  return (
    <ul className="divide-y-2 divide-line-soft rounded-md border-2 border-line-soft bg-bg-surface">
      {entries.map((e) => {
        const href = `/tracks/${e.trackSlug}/${e.courseSlug}/${e.stepSlug}`
        return (
          <li key={e.stepId}>
            <Link
              href={href}
              className="block transition-colors hover:bg-bg-raised"
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <span
                  className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-stat-xp/15 text-stat-xp"
                  aria-hidden
                >
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans font-semibold text-sm text-ink-1">
                    {e.stepTitle}
                  </p>
                  <p className="truncate font-mono text-[10px] text-ink-3">
                    {e.courseTitle}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-3">
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
