import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { routing } from "@/common/i18n/routing"
import { BlogPostView } from "@/modules/blog/blog-post-view"
import { buildCanonicalUrl } from "@/modules/blog/lib"
import {
  getPostBySlug,
  getSlugs,
  getTranslations as getBlogTranslations,
} from "@/modules/blog/service"
import type { BlogLocale } from "@/modules/blog/types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naveo.space"

export const revalidate = 300

type RouteProps = {
  params: Promise<{ locale: BlogLocale; slug: string }>
}

export async function generateStaticParams() {
  const all: { locale: BlogLocale; slug: string }[] = []
  for (const locale of routing.locales) {
    let page = 1
    while (true) {
      const batch = await getSlugs(locale, { page, limit: 500 })
      for (const { slug } of batch.slugs) all.push({ locale, slug })
      if (page >= batch.totalPages || batch.slugs.length === 0) break
      page += 1
    }
  }
  return all
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await getPostBySlug(locale, slug)
  if (!post) return { title: "Not found" }

  const title = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt

  const translations = await getBlogTranslations(post.translationKey)
  const languages = Object.fromEntries(
    translations.map((t) => [
      t.locale,
      buildCanonicalUrl(`/${t.locale}/blog/${t.slug}`, SITE_URL),
    ]),
  )

  const canonical = buildCanonicalUrl(`/${locale}/blog/${post.slug}`, SITE_URL)

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: Object.keys(languages).length > 0 ? languages : undefined,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function BlogPostPage({ params }: RouteProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const post = await getPostBySlug(locale, slug)
  if (!post) notFound()

  const canonical = buildCanonicalUrl(`/${locale}/blog/${post.slug}`, SITE_URL)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription ?? post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: canonical,
    author: {
      "@type": "Organization",
      name: "Naveo",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Naveo",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: buildCanonicalUrl("/icons/naveo/naveo-icon.svg", SITE_URL),
      },
    },
    inLanguage: locale,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostView post={post} />
    </>
  )
}
