import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { routing } from "@/common/i18n/routing"
import type { Locale } from "@/common/i18n/routing"
import { LegalView } from "@/modules/legal/legal-view"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naveo.space"

type RouteProps = {
  params: Promise<{ locale: Locale }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "legal.terms.meta" })

  const path = `/${locale}/terms`
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${SITE_URL}/${l}/terms`]),
  )

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${SITE_URL}${path}`,
      languages,
    },
  }
}

export default async function TermsPage({ params }: RouteProps) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LegalView document="terms" />
}
