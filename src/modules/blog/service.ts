import "server-only"

import { db } from "@/server/db"

import { POSTS_MAX_LIMIT, POSTS_PER_PAGE, SLUGS_MAX_LIMIT } from "./data"
import type {
  BlogListItem,
  BlogListResponse,
  BlogLocale,
  BlogPost,
  BlogSlugsResponse,
  BlogTranslation,
} from "./types"

interface ListOptions {
  page?: number
  limit?: number
  category?: string
}

export async function listPosts(
  locale: BlogLocale,
  { page = 1, limit = POSTS_PER_PAGE, category }: ListOptions = {},
): Promise<BlogListResponse> {
  const safeLimit = Math.max(1, Math.min(limit, POSTS_MAX_LIMIT))
  const safePage = Math.max(1, page)
  const where = {
    locale,
    published: true,
    ...(category ? { category } : {}),
  }

  const [rows, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      select: {
        id: true,
        locale: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        tags: true,
        ogImage: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    db.blogPost.count({ where }),
  ])

  const posts: BlogListItem[] = rows.map((p) => ({
    id: p.id,
    locale: p.locale as BlogLocale,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    tags: p.tags,
    ogImage: p.ogImage,
    publishedAt: p.publishedAt?.toISOString() ?? null,
  }))

  return {
    posts,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  }
}

export async function getPostBySlug(
  locale: BlogLocale,
  slug: string,
): Promise<BlogPost | null> {
  const row = await db.blogPost.findUnique({
    where: { locale_slug: { locale, slug } },
  })
  if (!row || !row.published) return null
  return {
    id: row.id,
    locale: row.locale as BlogLocale,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    tags: row.tags,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    ogImage: row.ogImage,
    translationKey: row.translationKey,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  }
}

interface SlugsOptions {
  page?: number
  limit?: number
}

export async function getSlugs(
  locale: BlogLocale,
  { page = 1, limit = 500 }: SlugsOptions = {},
): Promise<BlogSlugsResponse> {
  const safeLimit = Math.max(1, Math.min(limit, SLUGS_MAX_LIMIT))
  const safePage = Math.max(1, page)
  const where = { locale, published: true }

  const [rows, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    db.blogPost.count({ where }),
  ])

  return {
    slugs: rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString() })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  }
}

export async function countPublished(locale: BlogLocale): Promise<number> {
  return db.blogPost.count({ where: { locale, published: true } })
}

export async function getTranslations(
  translationKey: string | null,
): Promise<BlogTranslation[]> {
  if (!translationKey) return []
  const rows = await db.blogPost.findMany({
    where: { translationKey, published: true },
    select: { locale: true, slug: true },
  })
  return rows.map((r) => ({ locale: r.locale as BlogLocale, slug: r.slug }))
}
