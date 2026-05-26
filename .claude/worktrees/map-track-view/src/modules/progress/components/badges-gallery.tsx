import type { CourseBadge } from "@/modules/progress/types"

type Props = {
  badges: CourseBadge[]
  emptyLabel: string
  formatDate: (d: Date) => string
}

export function BadgesGallery({ badges, emptyLabel, formatDate }: Props) {
  if (badges.length === 0) {
    return (
      <p className="rounded-lg border border-[color:var(--brand-cyan)]/20 bg-black/35 px-4 py-4 text-sm text-muted-foreground backdrop-blur-xl">
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
            className="rounded-lg border border-[color:var(--brand-gold)]/30 bg-black/35 p-4 text-center backdrop-blur-xl transition-shadow hover:shadow-[0_0_30px_-12px_var(--brand-gold)]"
          >
            <span
              className="mx-auto mb-3 inline-flex size-14 items-center justify-center rounded-full border-2 border-[color:var(--brand-gold)]/50 bg-[color:var(--brand-gold)]/10 text-2xl font-bold text-[color:var(--brand-gold)] shadow-[0_0_24px_-10px_var(--brand-gold)]"
              aria-hidden
            >
              {initial}
            </span>
            <p className="truncate text-xs font-bold text-foreground">
              {b.courseTitle}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
              {formatDate(b.earnedAt)}
            </p>
          </article>
        )
      })}
    </div>
  )
}
