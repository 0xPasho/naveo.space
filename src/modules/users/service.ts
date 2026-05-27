import "server-only"

import { db } from "@/server/db"
import type { ContentLocale } from "@/modules/content/types"
import { DAILY_QUEST_XP_PASS } from "@/modules/daily-quest/data"
import { getOrAssignDailyQuest } from "@/modules/daily-quest/service"
import { xpForFrontmatter } from "@/modules/gamification/service"

import type {
  ActivityEntry,
  AppUser,
  CalendarDay,
  NextAction,
  NextStepRef,
  TrackMastery,
  UserStats,
  WeeklyXp,
} from "./types"

export async function getOrCreateUser(clerkUserId: string): Promise<AppUser> {
  return db.user.upsert({
    where: { id: clerkUserId },
    update: {},
    create: { id: clerkUserId },
  })
}

export async function getUserStats(
  userId: string,
  locale: ContentLocale,
): Promise<UserStats> {
  const [user, totalSteps, completedSteps, totalAttempts, xpRow] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    db.contentPiece.count({ where: { type: "step", locale } }),
    db.progress.count({
      where: { userId, stepLocale: locale, status: "completed" },
    }),
    db.attempt.count({ where: { userId, stepLocale: locale } }),
    // Real XP from the gamification ledger. We used to compute
    // `completedSteps * XP_PER_STEP` here, which diverged from what
    // runForUser actually granted (first-try bonus, per-step overrides,
    // narrative steps grant 0). Reading the source of truth fixes it.
    db.xp.findUnique({ where: { userId }, select: { total: true } }),
  ])

  return {
    totalSteps,
    completedSteps,
    totalAttempts,
    memberSince: user?.createdAt ?? null,
    xp: xpRow?.total ?? 0,
  }
}

// Find the user's "next step": prefer any step they marked in_progress;
// otherwise the first step (in track→course→step order) that is NOT yet
// completed. Returns null when the user has completed everything.
export async function getNextStepForUser(
  userId: string,
  locale: ContentLocale,
): Promise<NextStepRef | null> {
  const tracks = await db.contentPiece.findMany({
    where: { type: "track", locale },
    orderBy: { order: "asc" },
    select: { slug: true, title: true, frontMatter: true },
  })

  for (const track of tracks) {
    // Optional tracks (e.g. the pre-flight bridge) are skipped unless the user
    // has already touched at least one step in them. Lets new users land on
    // Track 1 by default while keeping the optional track manually reachable.
    const isOptional =
      typeof track.frontMatter === "object" &&
      track.frontMatter !== null &&
      (track.frontMatter as { optional?: unknown }).optional === true

    if (isOptional) {
      // Progress has no relation to ContentPiece, so we resolve step ids
      // by walking course → steps for this track and querying by stepId.
      const trackCourses = await db.contentPiece.findMany({
        where: { type: "course", locale, parentSlug: track.slug },
        select: { slug: true },
      })
      const stepIdsInTrack =
        trackCourses.length === 0
          ? []
          : (
              await db.contentPiece.findMany({
                where: {
                  type: "step",
                  locale,
                  parentSlug: { in: trackCourses.map((c) => c.slug) },
                },
                select: { id: true },
              })
            ).map((s) => s.id)
      const touched =
        stepIdsInTrack.length === 0
          ? 0
          : await db.progress.count({
              where: {
                userId,
                stepLocale: locale,
                stepId: { in: stepIdsInTrack },
              },
            })
      if (touched === 0) continue
    }

    const courses = await db.contentPiece.findMany({
      where: { type: "course", locale, parentSlug: track.slug },
      orderBy: { order: "asc" },
      select: { slug: true, title: true },
    })

    for (const course of courses) {
      const steps = await db.contentPiece.findMany({
        where: { type: "step", locale, parentSlug: course.slug },
        orderBy: { order: "asc" },
        select: { id: true, slug: true, title: true },
      })
      if (steps.length === 0) continue

      const stepIds = steps.map((s) => s.id)
      const progress = await db.progress.findMany({
        where: { userId, stepLocale: locale, stepId: { in: stepIds } },
        select: { stepId: true, status: true },
      })

      const completed = new Set(
        progress.filter((p) => p.status === "completed").map((p) => p.stepId),
      )
      const inProgress = progress.find((p) => p.status === "in_progress")

      if (inProgress) {
        const step = steps.find((s) => s.id === inProgress.stepId)
        if (step) {
          return {
            trackSlug: track.slug,
            trackTitle: track.title,
            courseSlug: course.slug,
            courseTitle: course.title,
            stepSlug: step.slug,
            stepTitle: step.title,
            isInProgress: true,
          }
        }
      }

      const next = steps.find((s) => !completed.has(s.id))
      if (next) {
        return {
          trackSlug: track.slug,
          trackTitle: track.title,
          courseSlug: course.slug,
          courseTitle: course.title,
          stepSlug: next.slug,
          stepTitle: next.title,
          isInProgress: false,
        }
      }
    }
  }

  return null
}

// Resume CTA target: prefer the normal next-step path, fall back to a
// pending daily quest so a user who's cleared every active track still has
// a useful action surfaced ("come back tomorrow" is bad UX; "do today's
// 1-minute mission" is good UX). Returns null only when there's literally
// nothing left.
export async function getNextActionForUser(
  userId: string,
  locale: ContentLocale,
): Promise<NextAction | null> {
  const step = await getNextStepForUser(userId, locale)
  if (step) return { kind: "step", step }

  const daily = await getOrAssignDailyQuest(userId, locale)
  if (daily && !daily.passed) {
    return { kind: "daily-quest", questTitle: daily.quest.title }
  }
  return null
}

// Last N attempts by this user, joined to step or daily-quest content for a
// useful row. Daily-quest attempts (stepId starts with "daily:") are
// included alongside lesson steps because they're real practice the user
// did. Attempts whose ContentPiece no longer exists still appear with empty
// breadcrumb fields — silently dropping them would hide real activity.
//
// XP attribution caveat for daily quests: we surface the flat
// DAILY_QUEST_XP_PASS on every passing attempt, which double-counts on
// replays. The wallet/Xp total stays correct because awardXp only fires on
// the first-pass-of-day inside the action; this is a display-only nuance.
export async function getRecentActivity(
  userId: string,
  locale: ContentLocale,
  limit = 10,
): Promise<ActivityEntry[]> {
  const attempts = await db.attempt.findMany({
    where: { userId, stepLocale: locale },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, stepId: true, passed: true, createdAt: true },
  })
  if (attempts.length === 0) return []

  const pieceIds = Array.from(new Set(attempts.map((a) => a.stepId)))
  const [pieces, progressRows] = await Promise.all([
    db.contentPiece.findMany({
      where: { id: { in: pieceIds }, locale, type: { in: ["step", "daily"] } },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        parentSlug: true,
        frontMatter: true,
      },
    }),
    db.progress.findMany({
      where: { userId, stepLocale: locale, stepId: { in: pieceIds } },
      select: { stepId: true, firstTry: true },
    }),
  ])
  const pieceById = new Map(pieces.map((p) => [p.id, p]))
  const firstTryByStep = new Map(progressRows.map((p) => [p.stepId, p.firstTry]))

  const stepCourseSlugs = Array.from(
    new Set(
      pieces
        .filter((p) => p.type === "step")
        .map((p) => p.parentSlug)
        .filter((s): s is string => !!s),
    ),
  )
  const courses =
    stepCourseSlugs.length === 0
      ? []
      : await db.contentPiece.findMany({
          where: {
            slug: { in: stepCourseSlugs },
            locale,
            type: "course",
          },
          select: { slug: true, title: true, parentSlug: true },
        })
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]))

  return attempts.map((a) => {
    const piece = pieceById.get(a.stepId)
    if (piece?.type === "daily") {
      return {
        attemptId: a.id,
        passed: a.passed,
        createdAt: a.createdAt,
        stepSlug: piece.slug,
        stepTitle: piece.title,
        // Daily quests live outside the track/course tree; the dialog
        // ignores empty breadcrumbs and just shows the title.
        trackSlug: "",
        courseSlug: "",
        courseTitle: "",
        xp: a.passed ? DAILY_QUEST_XP_PASS : 0,
      }
    }
    const course = piece?.parentSlug
      ? courseBySlug.get(piece.parentSlug)
      : undefined
    const fm = piece?.frontMatter as
      | { exercise?: { kind?: string }; xp?: number }
      | undefined
    const stepFirstTry = firstTryByStep.get(a.stepId) ?? false
    const xp = a.passed && fm ? xpForFrontmatter(fm, stepFirstTry) : 0
    return {
      attemptId: a.id,
      passed: a.passed,
      createdAt: a.createdAt,
      stepSlug: piece?.slug ?? "",
      stepTitle: piece?.title ?? a.stepId,
      trackSlug: course?.parentSlug ?? "",
      courseSlug: course?.slug ?? "",
      courseTitle: course?.title ?? "",
      xp,
    }
  })
}

// UTC start-of-day for any Date (drops time portion).
const toUtcDay = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

// 12 weekly XP buckets, oldest → newest. Real XP grants per week. Combines
// two sources, matching what awardXp actually credits to User.xp:
//   1. Step completions — joins Progress.completedAt with ContentPiece
//      frontmatter and runs xpForFrontmatter (first-try bonus + per-step xp
//      overrides + per-kind defaults). Orphan stepIds (content rebuilt,
//      slug gone) contribute 0.
//   2. Daily-quest passes — DailyQuestAssignment.completedAt with the flat
//      DAILY_QUEST_XP_PASS reward. Without this, a user whose XP comes from
//      dailies sees an empty chart while their cumulative XP HUD pill is
//      non-zero.
export async function getWeeklyXp(
  userId: string,
  locale: ContentLocale,
): Promise<WeeklyXp[]> {
  const today = toUtcDay(new Date())
  const dow = (today.getUTCDay() + 6) % 7 // Mon = 0
  const currentWeekStart = new Date(today)
  currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() - dow)
  const firstWeekStart = new Date(currentWeekStart)
  firstWeekStart.setUTCDate(firstWeekStart.getUTCDate() - 7 * 11)

  const [progress, dailyPasses] = await Promise.all([
    db.progress.findMany({
      where: {
        userId,
        stepLocale: locale,
        status: "completed",
        completedAt: { gte: firstWeekStart },
      },
      select: { stepId: true, firstTry: true, completedAt: true },
    }),
    db.dailyQuestAssignment.findMany({
      where: {
        userId,
        questLocale: locale,
        passed: true,
        completedAt: { gte: firstWeekStart },
      },
      select: { completedAt: true },
    }),
  ])

  const buckets = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(firstWeekStart)
    start.setUTCDate(start.getUTCDate() + 7 * i)
    return { weekStart: start, xp: 0 }
  })

  const weekIdxOf = (when: Date) =>
    Math.floor(
      (toUtcDay(when).getTime() - firstWeekStart.getTime()) /
        (1000 * 60 * 60 * 24 * 7),
    )

  if (progress.length > 0) {
    const stepIds = [...new Set(progress.map((p) => p.stepId))]
    const pieces = await db.contentPiece.findMany({
      where: { OR: stepIds.map((id) => ({ id, locale })) },
      select: { id: true, frontMatter: true },
    })
    const fmById = new Map(
      pieces.map((p) => [p.id, p.frontMatter as { exercise?: { kind?: string }; xp?: number }]),
    )

    for (const p of progress) {
      if (!p.completedAt) continue
      const fm = fmById.get(p.stepId)
      if (!fm) continue
      const earned = xpForFrontmatter(fm, p.firstTry)
      if (earned === 0) continue
      const idx = weekIdxOf(p.completedAt)
      if (idx >= 0 && idx < 12) buckets[idx]!.xp += earned
    }
  }

  for (const p of dailyPasses) {
    if (!p.completedAt) continue
    const idx = weekIdxOf(p.completedAt)
    if (idx >= 0 && idx < 12) buckets[idx]!.xp += DAILY_QUEST_XP_PASS
  }

  return buckets
}

// 56-cell (8 weeks × 7 days) activity calendar — oldest top-left, today at
// row index `Math.floor(55 / 7)` etc. Each cell is "done" if the user had any
// attempt that calendar day, "miss" if they didn't, "future" for days after
// today, and "today" overrides on the current cell.
export async function getStreakCalendar(
  userId: string,
): Promise<CalendarDay[]> {
  const today = toUtcDay(new Date())
  const start = new Date(today)
  start.setUTCDate(start.getUTCDate() - 55)
  const exclusiveEnd = new Date(today)
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1)

  const attempts = await db.attempt.findMany({
    where: { userId, createdAt: { gte: start, lt: exclusiveEnd } },
    select: { createdAt: true },
  })

  const active = new Set<number>()
  for (const a of attempts) {
    const day = toUtcDay(a.createdAt)
    const idx = Math.round(
      (day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (idx >= 0 && idx < 56) active.add(idx)
  }

  return Array.from({ length: 56 }, (_, i): CalendarDay => {
    if (i === 55) return active.has(i) ? "today-done" : "today"
    return active.has(i) ? "done" : "miss"
  })
}

// Per-track mastery — fraction of steps in the track the user has completed.
// Tracks are returned in catalog order (ContentPiece.order on track row).
export async function getTrackMastery(
  userId: string,
  locale: ContentLocale,
): Promise<TrackMastery[]> {
  const tracks = await db.contentPiece.findMany({
    where: { type: "track", locale },
    orderBy: { order: "asc" },
    select: { slug: true, title: true },
  })

  const result: TrackMastery[] = []
  for (const track of tracks) {
    const courses = await db.contentPiece.findMany({
      where: { type: "course", locale, parentSlug: track.slug },
      select: { slug: true },
    })
    const courseSlugs = courses.map((c) => c.slug)
    if (courseSlugs.length === 0) {
      result.push({
        trackSlug: track.slug,
        trackTitle: track.title,
        completed: 0,
        total: 0,
        pct: 0,
      })
      continue
    }
    const steps = await db.contentPiece.findMany({
      where: {
        type: "step",
        locale,
        parentSlug: { in: courseSlugs },
      },
      select: { id: true },
    })
    const stepIds = steps.map((s) => s.id)
    const total = stepIds.length
    const completed =
      total === 0
        ? 0
        : await db.progress.count({
            where: {
              userId,
              stepLocale: locale,
              status: "completed",
              stepId: { in: stepIds },
            },
          })
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
    result.push({
      trackSlug: track.slug,
      trackTitle: track.title,
      completed,
      total,
      pct,
    })
  }
  return result
}
