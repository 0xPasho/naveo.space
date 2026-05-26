import { setRequestLocale } from "next-intl/server"

import type { ContentLocale } from "@/modules/content/types"
import { CrewRosterView } from "@/modules/crew/components/crew-roster-view"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function CrewPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <CrewRosterView locale={locale} />
}
