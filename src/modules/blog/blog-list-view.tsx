import { getTranslations } from "next-intl/server"

import { Eyebrow } from "@/common/components/ui"

import { BlogCard } from "./components/blog-card"
import { BlogPagination } from "./components/blog-pagination"
import { POSTS_PER_PAGE, isBlogCategory } from "./data"
import { listPosts } from "./service"
import type { BlogLocale } from "./types"

type Props = {
  locale: BlogLocale
  page: number
  category?: string
}

export async function BlogListView({ locale, page, category }: Props) {
  const t = await getTranslations("blog")
  const tCat = await getTranslations("blog.categories")
  const { posts, totalPages } = await listPosts(locale, {
    page,
    limit: POSTS_PER_PAGE,
    category,
  })

  return (
    <section className="mx-auto max-w-5xl px-6 pt-20 pb-24">
      <header className="mb-12 flex flex-col gap-3">
        <Eyebrow className="text-track-prompting">{t("eyebrow")}</Eyebrow>
        <h1 className="font-display font-bold text-5xl leading-[0.98] tracking-tight text-ink-1 md:text-6xl">
          {t("title")}
          <span className="text-stat-xp">.</span>
        </h1>
        <p className="max-w-2xl font-sans font-semibold text-lg leading-relaxed text-ink-2">
          {t("subtitle")}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="py-12 font-sans font-semibold text-ink-3">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              locale={locale}
              categoryLabel={
                isBlogCategory(post.category) ? tCat(post.category) : post.category
              }
            />
          ))}
        </div>
      )}

      <BlogPagination
        page={page}
        totalPages={totalPages}
        category={category}
        labels={{
          prev: t("pagination.prev"),
          next: t("pagination.next"),
          page: t("pagination.page"),
        }}
      />
    </section>
  )
}
