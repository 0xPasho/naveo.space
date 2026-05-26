import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { LessonDebrief } from "@/modules/lessons/components/lesson-debrief"
import { getCourseDetail } from "@/modules/catalog/service"
import {
  getCourse,
  getTrack,
  listSteps,
  listTracks,
} from "@/modules/content/service"
import type { ContentLocale } from "@/modules/content/types"
import {
  getXpSnapshot,
  xpFromCompletedSteps,
} from "@/modules/gamification/service"
import { getStepProgress } from "@/modules/progress/service"
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

  // Resolve the "Next track" link by walking listTracks ordering.
  const allTracks = await listTracks(locale)
  const idx = allTracks.findIndex((t) => t.slug === track.slug)
  const nextTrack = idx >= 0 ? allTracks[idx + 1] : undefined
  const nextTrackHref = nextTrack ? `/tracks/${nextTrack.slug}` : null

  // Compute REAL stepsCleared + xpEarned. Anon users see steps.length and 0
  // XP (they didn't actually earn anything yet). Signed-in users get a
  // per-step lookup driven by Progress: count completed and sum xpForStep.
  // This is what the user asked for: "sumar los que sí completaste".
  let stepsCleared = steps.length
  let xpEarned = 0
  let streakDays = 0
  if (clerkUser) {
    const user = await getOrCreateUser(clerkUser.id)
    const [snap, perStepProgress] = await Promise.all([
      getXpSnapshot(user.id),
      Promise.all(
        steps.map((s) => getStepProgress(user.id, s.id, locale)),
      ),
    ])
    streakDays = snap.dailyStreak
    const completed = perStepProgress.map((p, i) => ({
      step: steps[i]!,
      completed: p?.status === "completed",
      // Real first-try flag, frozen on Progress at first completion. Stays
      // true even if the user later replays the step and fails, so the
      // debrief XP matches the 1.5x bonus actually in Xp.total.
      firstTry: p?.firstTry ?? false,
    }))
    stepsCleared = completed.filter((c) => c.completed).length
    xpEarned = xpFromCompletedSteps(completed)
  }

  return (
    <LessonDebrief
      trackTitle={track.title}
      courseTitle={course.title}
      stepsCleared={stepsCleared}
      totalSteps={steps.length}
      xpEarned={xpEarned}
      signingOfficer={detail?.signingOfficer ?? "echo"}
      isCapstone={detail?.hasCapstone ?? false}
      courseHref={`/tracks/${track.slug}`}
      nextTrackHref={nextTrackHref}
      streakDays={streakDays}
    />
  )
}
