import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { routing } from "@/common/i18n/routing"
import { BlogListView } from "@/modules/blog/blog-list-view"
import { buildCanonicalUrl } from "@/modules/blog/lib"
import type { BlogLocale } from "@/modules/blog/types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naveo.space"

export const revalidate = 300

type RouteProps = {
  params: Promise<{ locale: BlogLocale }>
  searchParams: Promise<{ page?: string; category?: string }>
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "blog" })

  const path = `/${locale}/blog`
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, buildCanonicalUrl(`/${l}/blog`, SITE_URL)]),
  )

  return {
    title: t("meta.listTitle"),
    description: t("meta.listDescription"),
    alternates: {
      canonical: buildCanonicalUrl(path, SITE_URL),
      languages,
    },
    openGraph: {
      type: "website",
      title: t("meta.listTitle"),
      description: t("meta.listDescription"),
      url: buildCanonicalUrl(path, SITE_URL),
    },
  }
}

export default async function BlogListPage({ params, searchParams }: RouteProps) {
  const { locale } = await params
  setRequestLocale(locale)

  const sp = await searchParams
  const page = sp.page ? Math.max(1, parseInt(sp.page, 10) || 1) : 1
  const category = sp.category

  return <BlogListView locale={locale} page={page} category={category} />
}
