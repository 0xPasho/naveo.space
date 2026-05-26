import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { currentUser } from "@/server/auth"
import { resolveContentLocale } from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
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

  const contentLocale = await resolveContentLocale(locale)
  const data = await getStepWithNeighbors(track, course, step, contentLocale, userId)
  if (!data) notFound()

  let streak = 0
  let streakAtRisk = false
  if (clerkUser) {
    const user = await getOrCreateUser(clerkUser.id)
    const snap = await getXpSnapshot(user.id)
    streak = snap.dailyStreak
    streakAtRisk = snap.atRiskToday
  }

  return (
    <LessonPlayerView
      data={data}
      locale={contentLocale}
      streak={streak}
      streakAtRisk={streakAtRisk}
    />
  )
}
