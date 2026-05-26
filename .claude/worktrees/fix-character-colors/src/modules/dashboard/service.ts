import "server-only"

import type { ContentLocale } from "@/modules/content/types"
import { listSteps } from "@/modules/content/service"
import { getXpSnapshot } from "@/modules/gamification/service"
import { getCourseProgress } from "@/modules/progress/service"
import { getNextStepForUser } from "@/modules/users/service"

import {
  DASHBOARD_COMMS,
  DASHBOARD_CREW,
  DASHBOARD_PLACEHOLDER_CAPSTONE_LOCK_STEPS,
  DASHBOARD_PLACEHOLDER_MINUTES_LEFT,
  DASHBOARD_PLACEHOLDER_STATS,
} from "./data"
import type { Dashboard } from "./types"

const timeOfDayFor = (date: Date): Dashboard["timeOfDay"] => {
  const h = date.getHours()
  if (h < 12) return "morning"
  if (h < 19) return "afternoon"
  return "evening"
}

const shipTimeFor = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`

export async function getDashboard(args: {
  userId: string | null
  locale: ContentLocale
  greetingName: string
}): Promise<Dashboard> {
  const { userId, locale, greetingName } = args
  const now = new Date()

  const next = userId ? await getNextStepForUser(userId, locale) : null

  let continueAt: Dashboard["continueAt"] = null
  if (next) {
    const [steps, progress] = await Promise.all([
      listSteps(next.courseSlug, locale),
      getCourseProgress(userId, next.courseSlug, locale),
    ])
    const stepNumber = Math.max(
      1,
      steps.findIndex((s) => s.slug === next.stepSlug) + 1,
    )
    const total = steps.length || progress.total
    const done = progress.completed
    const pct = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100))
    continueAt = {
      next,
      unitNumber: 1,
      stepNumber,
      totalSteps: total,
      pct,
      estimatedMinutesLeft: DASHBOARD_PLACEHOLDER_MINUTES_LEFT,
    }
  }

  // Real streak from gamification. xpDelta + xpToday stay placeholder until
  // we track per-day XP grants.
  const xpSnap = userId ? await getXpSnapshot(userId) : null
  const streakDays = xpSnap?.dailyStreak ?? 0
  const bestStreak = xpSnap?.bestStreak ?? 0

  return {
    locale,
    greetingName,
    timeOfDay: timeOfDayFor(now),
    shipTime: shipTimeFor(now),
    continueAt,
    capstoneStepsToUnlock: DASHBOARD_PLACEHOLDER_CAPSTONE_LOCK_STEPS,
    crew: [...DASHBOARD_CREW],
    comms: [...DASHBOARD_COMMS],
    stats: {
      ...DASHBOARD_PLACEHOLDER_STATS,
      streakDays,
      bestStreak,
    },
  }
}
