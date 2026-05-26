import { Link } from "@/common/i18n/navigation"

import { formatDate } from "../lib"
import type { BlogListItem, BlogLocale } from "../types"

type Props = {
  post: BlogListItem
  locale: BlogLocale
  categoryLabel: string
}

export function BlogCard({ post, locale, categoryLabel }: Props) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border-2 border-line-soft bg-card p-6 shadow-elev-3 transition-colors hover:border-line-strong hover:bg-bg-raised"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-track-prompting/15 px-2.5 py-1 font-display font-bold text-[10px] uppercase tracking-[0.16em] text-track-prompting">
          {categoryLabel}
        </span>
        <span className="font-display font-bold text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {formatDate(post.publishedAt, locale)}
        </span>
      </div>
      <h2 className="mb-2 font-display font-bold text-xl tracking-tight text-ink-1 transition-colors group-hover:text-stat-xp">
        {post.title}
      </h2>
      <p className="font-sans font-semibold text-sm leading-relaxed text-ink-2">
        {post.excerpt}
      </p>
    </Link>
  )
}
