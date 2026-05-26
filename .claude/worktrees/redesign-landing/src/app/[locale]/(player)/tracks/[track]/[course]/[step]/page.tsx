import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { currentUser } from "@/server/auth"
import type { ContentLocale } from "@/modules/content/types"
import { getWallet } from "@/modules/economy/service"
import { getXpSnapshot } from "@/modules/gamification/service"
import { getStepWithNeighbors } from "@/modules/lessons/service"
import { LessonPlayerView } from "@/modules/lessons/lesson-player-view"
import { getOrCreateUser } from "@/modules/users/service"

type Props = {
  params: Promise<{
    locale: ContentLocale
    track: string
    course: string
    step: string
  }>
}

export default async function StepPage({ params }: Props) {
  const { locale, track, course, step } = await params
  setRequestLocale(locale)

  const clerkUser = await currentUser()
  const userId = clerkUser?.id ?? null

  const data = await getStepWithNeighbors(track, course, step, locale, userId)
  if (!data) notFound()

  let streak = 0
  let streakAtRisk = false
  let hearts: number | undefined
  let heartsMax: number | undefined
  if (clerkUser) {
    const user = await getOrCreateUser(clerkUser.id)
    const [snap, wallet] = await Promise.all([
      getXpSnapshot(user.id),
      getWallet(user.id),
    ])
    streak = snap.dailyStreak
    streakAtRisk = snap.atRiskToday
    hearts = wallet.hearts
    heartsMax = wallet.heartsMax
  }

  return (
    <LessonPlayerView
      data={data}
      locale={locale}
      streak={streak}
      streakAtRisk={streakAtRisk}
      hearts={hearts}
      heartsMax={heartsMax}
    />
  )
}
