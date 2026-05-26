import { setRequestLocale } from "next-intl/server"

import type { ContentLocale } from "@/modules/content/types"
import { PracticeView } from "@/modules/practice/practice-view"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function PracticePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <PracticeView locale={locale} />
}
