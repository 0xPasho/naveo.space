import { Link } from "@/common/i18n/navigation"

type Props = {
  page: number
  totalPages: number
  category?: string
  labels: {
    prev: string
    next: string
    page: string
  }
}

function buildHref(page: number, category?: string): string {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  if (category) params.set("category", category)
  const qs = params.toString()
  return qs ? `/blog?${qs}` : "/blog"
}

export function BlogPagination({ page, totalPages, category, labels }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav className="mt-12 flex items-center justify-center gap-6 text-sm font-medium text-[color:var(--muted-foreground)]">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1, category)}
          className="hover:text-[color:var(--foreground)] transition-colors"
        >
          ← {labels.prev}
        </Link>
      ) : (
        <span className="opacity-40">← {labels.prev}</span>
      )}
      <span className="font-mono text-xs tracking-[0.14em] uppercase">
        {labels.page} {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={buildHref(page + 1, category)}
          className="hover:text-[color:var(--foreground)] transition-colors"
        >
          {labels.next} →
        </Link>
      ) : (
        <span className="opacity-40">{labels.next} →</span>
      )}
    </nav>
  )
}
