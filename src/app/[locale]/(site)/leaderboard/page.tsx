import { setRequestLocale } from "next-intl/server"

import type { ContentLocale } from "@/modules/content/types"
import { LeaderboardView } from "@/modules/leaderboard/leaderboard-view"

type Props = {
  params: Promise<{ locale: ContentLocale }>
}

export default async function LeaderboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return <LeaderboardView locale={locale} />
}
