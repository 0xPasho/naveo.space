import "server-only"

import { db } from "@/server/db"
import type { ContentLocale } from "@/modules/content/types"

import type {
  CourseBadge,
  CourseProgress,
  JournalEntry,
  ProgressStatus,
  StepProgress,
  TrackProgress,
} from "./types"

type ProgressRow = {
  stepId: string
  stepLocale: string
  status: string
  attempts: number
  hintsUsed: number
  completedAt: Date | null
}

const toStepProgress = (r: ProgressRow): StepProgress => ({
  stepId: r.stepId,
  stepLocale: r.stepLocale,
  status: r.status as ProgressStatus,
  attempts: r.attempts,
  hintsUsed: r.hintsUsed,
  completedAt: r.completedAt,
})

export async function getStepProgress(
  userId: string,
  stepId: string,
  stepLocale: ContentLocale,
): Promise<StepProgress | null> {
  const row = await db.progress.findUnique({
    where: { userId_stepId_stepLocale: { userId, stepId, stepLocale } },
  })
  return row ? toStepProgress(row) : null
}

const stepIdsForCourse = async (courseSlug: string, locale: ContentLocale) =>
  db.contentPiece.findMany({
    where: { type: "step", parentSlug: courseSlug, locale },
    select: { id: true },
  })

export async function getCourseProgress(
  userId: string | null,
  courseSlug: string,
  locale: ContentLocale,
): Promise<CourseProgress> {
  const steps = await stepIdsForCourse(courseSlug, locale)
  if (!userId) return { courseSlug, total: steps.length, completed: 0 }

  const completed = await db.progress.count({
    where: {
      userId,
      stepLocale: locale,
      status: "completed",
      stepId: { in: steps.map((s) => s.id) },
    },
  })
  return { courseSlug, total: steps.length, completed }
}

export async function getTrackProgress(
  userId: string | null,
  trackSlug: string,
  locale: ContentLocale,
): Promise<TrackProgress> {
  const courses = await db.contentPiece.findMany({
    where: { type: "course", parentSlug: trackSlug, locale },
    select: { slug: true },
  })

  const perCourse = await Promise.all(
    courses.map((c) => getCourseProgress(userId, c.slug, locale)),
  )

  return perCourse.reduce<TrackProgress>(
    (acc, c) => ({
      trackSlug,
      total: acc.total + c.total,
      completed: acc.completed + c.completed,
    }),
    { trackSlug, total: 0, completed: 0 },
  )
}

export async function recordAttemptForStep(args: {
  userId: string
  stepId: string
  stepLocale: ContentLocale
  passed: boolean
}): Promise<StepProgress> {
  const { userId, stepId, stepLocale, passed } = args
  const row = await db.progress.upsert({
    where: { userId_stepId_stepLocale: { userId, stepId, stepLocale } },
    create: {
      userId,
      stepId,
      stepLocale,
      status: passed ? "completed" : "in_progress",
      attempts: 1,
      completedAt: passed ? new Date() : null,
    },
    update: {
      attempts: { increment: 1 },
      // Once completed, never demote. Only promote in_progress -> completed.
      ...(passed
        ? { status: "completed", completedAt: new Date() }
        : {}),
    },
  })
  return toStepProgress(row)
}

// Returns the user's completed steps in reverse-chronological order, joined
// with step + course + track metadata for display. Drops rows whose step no
// longer exists in the catalog (cleanup case) since they can't be navigated to.
export async function getJournal(
  userId: string,
  locale: ContentLocale,
  limit = 50,
): Promise<JournalEntry[]> {
  const rows = await db.progress.findMany({
    where: { userId, stepLocale: locale, status: "completed" },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: { stepId: true, completedAt: true },
  })
  if (rows.length === 0) return []

  const stepIds = rows.map((r) => r.stepId)
  const steps = await db.contentPiece.findMany({
    where: { id: { in: stepIds }, locale, type: "step" },
    select: { id: true, slug: true, title: true, parentSlug: true },
  })
  const stepById = new Map(steps.map((s) => [s.id, s]))

  const courseSlugs = Array.from(
    new Set(steps.map((s) => s.parentSlug).filter((s): s is string => !!s)),
  )
  const courses =
    courseSlugs.length === 0
      ? []
      : await db.contentPiece.findMany({
          where: { slug: { in: courseSlugs }, locale, type: "course" },
          select: { slug: true, title: true, parentSlug: true },
        })
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]))

  const entries: JournalEntry[] = []
  for (const r of rows) {
    const step = stepById.get(r.stepId)
    if (!step || !step.parentSlug) continue
    const course = courseBySlug.get(step.parentSlug)
    if (!course || !course.parentSlug || !r.completedAt) continue
    entries.push({
      stepId: r.stepId,
      stepSlug: step.slug,
      stepTitle: step.title,
      courseSlug: course.slug,
      courseTitle: course.title,
      trackSlug: course.parentSlug,
      completedAt: r.completedAt,
    })
  }
  return entries
}

// Returns the courses the user has fully completed (every step in the course
// has status=completed). The badge's earnedAt is the max completedAt of the
// constituent steps.
export async function getEarnedBadges(
  userId: string,
  locale: ContentLocale,
): Promise<CourseBadge[]> {
  const courses = await db.contentPiece.findMany({
    where: { type: "course", locale },
    select: { slug: true, title: true, parentSlug: true },
  })
  if (courses.length === 0) return []

  const badges: CourseBadge[] = []
  for (const course of courses) {
    if (!course.parentSlug) continue
    const steps = await db.contentPiece.findMany({
      where: { type: "step", locale, parentSlug: course.slug },
      select: { id: true },
    })
    if (steps.length === 0) continue

    const completed = await db.progress.findMany({
      where: {
        userId,
        stepLocale: locale,
        status: "completed",
        stepId: { in: steps.map((s) => s.id) },
      },
      select: { completedAt: true },
    })
    if (completed.length < steps.length) continue

    const latest = completed.reduce<Date | null>((acc, p) => {
      if (!p.completedAt) return acc
      if (!acc || p.completedAt > acc) return p.completedAt
      return acc
    }, null)
    if (!latest) continue

    badges.push({
      trackSlug: course.parentSlug,
      courseSlug: course.slug,
      courseTitle: course.title,
      earnedAt: latest,
    })
  }
  badges.sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime())
  return badges
}

// Marks a step as completed without recording an attempt. Used when a step
// has no exercise (pure narrative or demo) and the user advances to NEXT —
// the act of advancing IS the completion signal. Idempotent.
export async function markStepCompleted(args: {
  userId: string
  stepId: string
  stepLocale: ContentLocale
}): Promise<StepProgress> {
  const { userId, stepId, stepLocale } = args
  const row = await db.progress.upsert({
    where: { userId_stepId_stepLocale: { userId, stepId, stepLocale } },
    create: {
      userId,
      stepId,
      stepLocale,
      status: "completed",
      attempts: 0,
      completedAt: new Date(),
    },
    update: {
      status: "completed",
      completedAt: new Date(),
    },
  })
  return toStepProgress(row)
}
