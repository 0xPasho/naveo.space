export const POSTS_PER_PAGE = 12
export const POSTS_MAX_LIMIT = 100
export const SLUGS_MAX_LIMIT = 1000

export const BLOG_CATEGORIES = [
  "prompting",
  "skills",
  "mcp",
  "agents",
  "tooling",
  "workflows",
  "comparisons",
] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export function isBlogCategory(value: string): value is BlogCategory {
  return (BLOG_CATEGORIES as readonly string[]).includes(value)
}
