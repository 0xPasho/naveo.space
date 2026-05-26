import type { MetadataRoute } from "next"

import { routing } from "@/common/i18n/routing"
import { countPublished, getSlugs } from "@/modules/blog/service"
import type { BlogLocale } from "@/modules/blog/types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naveo.space"
const CHUNK_SIZE = 1000

export const revalidate = 300
export const dynamic = "force-dynamic"

// Public, indexable static routes. Authenticated surfaces (dashboard, perfil,
// shop, workbench, etc.) are excluded by robots.ts and not listed here.
const STATIC_PATHS = ["", "/blog", "/tracks"] as const

function staticEntries(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []
  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "/blog" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
      })
    }
  }
  return entries
}

export async function generateSitemaps() {
  const counts = await Promise.all(
    routing.locales.map((locale) => countPublished(locale as BlogLocale)),
  )
  const totalPosts = counts.reduce((s, n) => s + n, 0)
  const chunks = Math.max(1, Math.ceil((totalPosts + staticEntries().length) / CHUNK_SIZE))
  return Array.from({ length: chunks }, (_, i) => ({ id: i }))
}

export default async function sitemap({
  id,
}: {
  id: Promise<number> | number
}): Promise<MetadataRoute.Sitemap> {
  const chunkIndex = Number(await Promise.resolve(id))

  // Build a stable, ordered stream: static entries first (chunk 0), then
  // posts ES, then posts EN. Compute how many items each chunk contains and
  // emit only the slice that belongs to this chunk.
  const counts = await Promise.all(
    routing.locales.map(async (locale) => ({
      locale: locale as BlogLocale,
      total: await countPublished(locale as BlogLocale),
    })),
  )

  const staticItems = staticEntries()
  let cursor = 0
  const chunkStart = chunkIndex * CHUNK_SIZE
  const chunkEnd = chunkStart + CHUNK_SIZE
  const out: MetadataRoute.Sitemap = []

  // Static block
  for (const item of staticItems) {
    if (cursor >= chunkStart && cursor < chunkEnd) out.push(item)
    cursor += 1
    if (cursor >= chunkEnd) return out
  }

  // Post blocks (per locale, ordered by publishedAt desc)
  for (const { locale, total } of counts) {
    if (total === 0) continue
    if (cursor + total <= chunkStart) {
      cursor += total
      continue
    }
    let page = 1
    while (cursor < chunkEnd && cursor < chunkStart + staticItems.length + total) {
      const batch = await getSlugs(locale, { page, limit: 500 })
      if (batch.slugs.length === 0) break
      for (const { slug, updatedAt } of batch.slugs) {
        if (cursor >= chunkStart && cursor < chunkEnd) {
          out.push({
            url: `${SITE_URL}/${locale}/blog/${slug}`,
            lastModified: new Date(updatedAt),
            changeFrequency: "monthly",
            priority: 0.7,
          })
        }
        cursor += 1
        if (cursor >= chunkEnd) return out
      }
      if (page >= batch.totalPages) break
      page += 1
    }
  }

  return out
}
