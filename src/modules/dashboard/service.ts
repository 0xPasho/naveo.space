import "server-only"

import { trackDetailMetaFor, trackMetaFor } from "@/modules/catalog/data"
import { resolveStepLeadCharacter } from "@/modules/content/lib"
import type { ContentLocale } from "@/modules/content/types"
import { listSteps, listTracks } from "@/modules/content/service"
import {
  getRealXpInWindow,
  getXpSnapshot,
} from "@/modules/gamification/service"
import {
  getCourseProgress,
  getTrackProgress,
} from "@/modules/progress/service"
import { getNextStepForUser } from "@/modules/users/service"

import {
  DASHBOARD_CREW,
  DASHBOARD_PLACEHOLDER_STATS,
} from "./data"
import type { Dashboard, DashboardCapstone } from "./types"

const timeOfDayFor = (date: Date): Dashboard["timeOfDay"] => {
  const h = date.getHours()
  if (h < 12) return "morning"
  if (h < 19) return "afternoon"
  return "evening"
}

const shipTimeFor = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`

// Find the next capstone the user is working toward. Walks tracks in order;
// the first one flagged `boss: true` AND not yet fully cleared by this user
// is returned. Returns null when no capstones remain (or the curriculum has
// none / user is anon).
async function resolveNextCapstone(
  userId: string,
  locale: ContentLocale,
): Promise<DashboardCapstone | null> {
  const tracks = await listTracks(locale)
  for (const t of tracks) {
    const meta = trackMetaFor(t.slug, t.order)
    if (!meta.boss) continue
    const progress = await getTrackProgress(userId, t.slug, locale)
    if (progress.total === 0) continue
    if (progress.completed >= progress.total) continue // already cleared
    const detailMeta = trackDetailMetaFor(t.slug)
    return {
      trackSlug: t.slug,
      trackTitle: t.title,
      capstoneTitleKey: detailMeta.capstoneTitleKey,
      signingOfficer: detailMeta.signingOfficer,
      stepsAway: progress.total - progress.completed,
    }
  }
  return null
}

export async function getDashboard(args: {
  userId: string | null
  locale: ContentLocale
  greetingName: string
}): Promise<Dashboard> {
  const { userId, locale, greetingName } = args
  const now = new Date()

  const next = userId ? await getNextStepForUser(userId, locale) : null

  let continueAt: Dashboard["continueAt"] = null
  let mascotSlug: Dashboard["mascotSlug"] = "vega"
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
    }
    const activeStep = steps.find((s) => s.slug === next.stepSlug)
    if (activeStep) {
      const lead = resolveStepLeadCharacter(activeStep.frontMatter)
      // All 6 crew slugs are valid DashboardMascotSlug now. Narrow defensively
      // (CharacterSlug and DashboardMascotSlug are the same set, but typed
      // separately so the dashboard module doesn't depend on `cast`).
      mascotSlug =
        lead === "vega" ||
        lead === "atlas" ||
        lead === "echo" ||
        lead === "forge" ||
        lead === "orbit" ||
        lead === "hex"
          ? lead
          : "vega"
    }
  }

  // Real streak + real per-day XP from Progress.completedAt (same formula
  // awardXp uses).
  const xpSnap = userId ? await getXpSnapshot(userId) : null
  const streakDays = xpSnap?.dailyStreak ?? 0
  const bestStreak = xpSnap?.bestStreak ?? 0

  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)

  // Mon-as-start week boundary (matches getStreakWeek).
  const dow = (todayStart.getUTCDay() + 6) % 7
  const weekStart = new Date(todayStart)
  weekStart.setUTCDate(weekStart.getUTCDate() - dow)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7)

  const [xpToday, xpYesterday, xpThisWeek, xpPrevWeek] = userId
    ? await Promise.all([
        getRealXpInWindow({
          userId,
          locale,
          start: todayStart,
          endExclusive: tomorrowStart,
        }),
        getRealXpInWindow({
          userId,
          locale,
          start: yesterdayStart,
          endExclusive: todayStart,
        }),
        getRealXpInWindow({
          userId,
          locale,
          start: weekStart,
          endExclusive: tomorrowStart,
        }),
        getRealXpInWindow({
          userId,
          locale,
          start: prevWeekStart,
          endExclusive: weekStart,
        }),
      ])
    : [0, 0, 0, 0]

  const capstone = userId ? await resolveNextCapstone(userId, locale) : null

  return {
    locale,
    greetingName,
    timeOfDay: timeOfDayFor(now),
    shipTime: shipTimeFor(now),
    continueAt,
    capstone,
    crew: [...DASHBOARD_CREW],
    stats: {
      ...DASHBOARD_PLACEHOLDER_STATS,
      streakDays,
      bestStreak,
      xpToday,
      xpDelta: xpToday - xpYesterday,
      xpThisWeek,
      xpWeekDelta: xpThisWeek - xpPrevWeek,
    },
    mascotSlug,
  }
}
