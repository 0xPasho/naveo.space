import { Check, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import { timeAgo } from "@/common/lib/format"
import type { ActivityEntry } from "@/modules/users/types"

type Props = {
  entries: ActivityEntry[]
  // Locale used for relative-time formatting. Default ES.
  locale?: string
}

// Last N attempts as a compact list. Each row links to the step (when the
// breadcrumb is intact). Uses native Intl.RelativeTimeFormat for "hace 2 h"
// — no extra dep.
export function ActivityFeed({ entries, locale = "es" }: Props) {
  const t = useTranslations("activity")

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        {t("empty")}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {entries.map((e) => {
        const hasBreadcrumb = e.trackSlug && e.courseSlug && e.stepSlug
        const href = hasBreadcrumb
          ? `/tracks/${e.trackSlug}/${e.courseSlug}/${e.stepSlug}`
          : null
        const row = (
          <div className="flex items-start gap-3 px-4 py-3">
            <span
              className={cn(
                "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                e.passed
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-destructive/15 text-destructive",
              )}
              aria-hidden
            >
              {e.passed ? <Check className="size-3" /> : <X className="size-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {e.stepTitle}
              </p>
              {e.courseTitle ? (
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {e.courseTitle}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground tabular-nums">
              {timeAgo(e.createdAt, locale)}
            </span>
          </div>
        )
        return (
          <li key={e.attemptId}>
            {href ? (
              <Link
                href={href}
                className="block transition-colors hover:bg-muted/40"
              >
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        )
      })}
    </ul>
  )
}
