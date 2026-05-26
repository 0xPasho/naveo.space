import { setRequestLocale } from "next-intl/server"

import "@/modules/catalog/styles.css"

import { ComingSoonView } from "@/common/components/coming-soon-view"
import type { ContentLocale } from "@/modules/content/types"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function PracticePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <ComingSoonView feature="practice" />
}
