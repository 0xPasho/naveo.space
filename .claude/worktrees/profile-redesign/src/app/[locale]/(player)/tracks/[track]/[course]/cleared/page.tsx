import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import "@/modules/lessons/styles.css"

import { LessonDebrief } from "@/modules/lessons/components/lesson-debrief"
import { getCourseDetail } from "@/modules/catalog/service"
import {
  getCourse,
  getTrack,
  listSteps,
  listTracks,
} from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import { getXpSnapshot } from "@/modules/gamification/service"
import { XP_PER_STEP } from "@/modules/users/placeholder-stats"
import { getOrCreateUser } from "@/modules/users/service"
import { currentUser } from "@/server/auth"

type Props = {
  params: Promise<{
    locale: ContentLocale
    track: string
    course: string
  }>
}

// Lesson-cleared celebration. Lands here when a user finishes the last step
// of a course (NEXT button on the final step routes here). We don't gate on
// real completion this pass — the navigation flow is the only entry point.

export default async function ClearedPage({ params }: Props) {
  const { locale, track: trackSlug, course: courseSlug } = await params
  setRequestLocale(locale)

  const clerkUser = await currentUser()
  const userId = clerkUser?.id ?? null

  const [track, course, steps, detail] = await Promise.all([
    getTrack(trackSlug, locale),
    getCourse(courseSlug, locale),
    listSteps(courseSlug, locale),
    getCourseDetail(userId, trackSlug, locale),
  ])

  if (!track || !course || course.trackSlug !== track.slug) notFound()
  if (steps.length === 0) notFound()

  const stepsCleared = steps.length
  const xpEarned = stepsCleared * XP_PER_STEP

  // Resolve the "Next track" link by walking listTracks ordering.
  const allTracks = await listTracks(locale)
  const idx = allTracks.findIndex((t) => t.slug === track.slug)
  const nextTrack = idx >= 0 ? allTracks[idx + 1] : undefined
  const nextTrackHref = nextTrack ? `/tracks/${nextTrack.slug}` : null

  let streakDays = 0
  if (clerkUser) {
    const user = await getOrCreateUser(clerkUser.id)
    const snap = await getXpSnapshot(user.id)
    streakDays = snap.dailyStreak
  }

  return (
    <LessonDebrief
      trackTitle={track.title}
      courseTitle={course.title}
      stepsCleared={stepsCleared}
      totalSteps={stepsCleared}
      xpEarned={xpEarned}
      signingOfficer={detail?.signingOfficer ?? "echo"}
      courseHref={`/tracks/${track.slug}`}
      nextTrackHref={nextTrackHref}
      streakDays={streakDays}
    />
  )
}
