import { getTranslations } from "next-intl/server"

import { Button, Card, Eyebrow } from "@/common/components/ui"
import { Link } from "@/common/i18n/navigation"

import { BlogProse } from "./components/blog-prose"
import { isBlogCategory } from "./data"
import { formatDate } from "./lib"
import type { BlogPost } from "./types"

type Props = {
  post: BlogPost
}

export async function BlogPostView({ post }: Props) {
  const t = await getTranslations("blog")
  const tCat = await getTranslations("blog.categories")
  const categoryLabel = isBlogCategory(post.category)
    ? tCat(post.category)
    : post.category

  return (
    <article className="mx-auto max-w-3xl px-6 pt-16 pb-24">
      <Link
        href="/blog"
        className="mb-12 inline-block font-display font-bold text-[11px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink-1"
      >
        ← {t("backToList")}
      </Link>

      <header className="mb-10">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-track-prompting/15 px-2.5 py-1 font-display font-bold text-[10px] uppercase tracking-[0.16em] text-track-prompting">
            {categoryLabel}
          </span>
          <span className="font-display font-bold text-[10px] uppercase tracking-[0.14em] text-ink-3">
            {formatDate(post.publishedAt, post.locale)}
          </span>
        </div>
        <h1 className="mb-5 font-display font-bold text-4xl leading-tight tracking-tight text-ink-1 md:text-5xl">
          {post.title}
        </h1>
        <p className="font-sans font-semibold text-lg leading-relaxed text-ink-2">
          {post.excerpt}
        </p>
      </header>

      <BlogProse html={post.content} />

      {post.tags.length > 0 ? (
        <ul className="mt-12 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border-2 border-line-strong px-2.5 py-1 font-display font-bold text-[10px] uppercase tracking-[0.14em] text-ink-3"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <Card className="mt-16 flex flex-col items-center gap-3 p-8 text-center">
        <Eyebrow className="text-track-prompting">{t("cta.eyebrow")}</Eyebrow>
        <h2 className="font-display font-bold text-2xl tracking-tight text-ink-1">
          {t("cta.title")}
        </h2>
        <p className="mx-auto max-w-md font-sans font-semibold text-ink-2">
          {t("cta.body")}
        </p>
        <Button size="lg" render={<Link href="/dashboard" />} className="mt-3">
          {t("cta.button")}
        </Button>
      </Card>
    </article>
  )
}
