import type { CourseBadge } from "@/modules/progress/types"

type Props = {
  badges: CourseBadge[]
  emptyLabel: string
  formatDate: (d: Date) => string
}

export function BadgesGallery({ badges, emptyLabel, formatDate }: Props) {
  if (badges.length === 0) {
    return (
      <p className="rounded-md border-2 border-line-soft bg-bg-surface px-4 py-4 font-sans font-semibold text-sm text-ink-3">
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map((b) => {
        const initial = b.courseTitle.slice(0, 1).toUpperCase()
        return (
          <article
            key={b.courseSlug}
            className="rounded-xl border-2 border-stat-xp/40 bg-bg-surface p-4 text-center shadow-elev-3"
          >
            <span
              className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full border-2 border-stat-xp/50 bg-stat-xp/10 font-display font-bold text-2xl text-stat-xp"
              aria-hidden
            >
              {initial}
            </span>
            <p className="truncate font-display font-bold text-xs text-ink-1">
              {b.courseTitle}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-ink-3">
              {formatDate(b.earnedAt)}
            </p>
          </article>
        )
      })}
    </div>
  )
}
