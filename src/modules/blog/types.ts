export type BlogLocale = "es" | "en"

export interface BlogPost {
  id: string
  locale: BlogLocale
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  metaTitle: string | null
  metaDescription: string | null
  ogImage: string | null
  translationKey: string | null
  publishedAt: string | null
  updatedAt: string
}

export interface BlogListItem {
  id: string
  locale: BlogLocale
  slug: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  ogImage: string | null
  publishedAt: string | null
}

export interface BlogListResponse {
  posts: BlogListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BlogSlug {
  slug: string
  updatedAt: string
}

export interface BlogSlugsResponse {
  slugs: BlogSlug[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface BlogTranslation {
  locale: BlogLocale
  slug: string
}
