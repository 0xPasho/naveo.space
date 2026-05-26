import type { BlogLocale } from "./types"

export function formatDate(dateStr: string | null, locale: BlogLocale): string {
  if (!dateStr) return ""
  const bcp = locale === "es" ? "es-ES" : "en-US"
  return new Date(dateStr).toLocaleDateString(bcp, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function buildCanonicalUrl(path: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${base}${suffix}`
}
