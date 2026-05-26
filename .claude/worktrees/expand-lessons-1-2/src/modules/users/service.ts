import "server-only"

import { db } from "@/server/db"
import type { ContentLocale } from "@/modules/content/types"
import { XP_PER_STEP } from "@/modules/users/placeholder-stats"

import type {
  ActivityEntry,
  AppUser,
  NextStepRef,
  UserStats,
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
  const [user, totalSteps, completedSteps, totalAttempts] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    db.contentPiece.count({ where: { type: "step", locale } }),
    db.progress.count({
      where: { userId, stepLocale: locale, status: "completed" },
    }),
    db.attempt.count({ where: { userId, stepLocale: locale } }),
  ])

  return {
    totalSteps,
    completedSteps,
    totalAttempts,
    memberSince: user?.createdAt ?? null,
    xp: completedSteps * XP_PER_STEP,
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
    select: { slug: true, title: true },
  })

  for (const track of tracks) {
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

// Last N attempts by this user, joined to the step + course breadcrumb so
// the UI can render a useful row. Attempts whose step no longer exists in
// the catalog still appear, with empty breadcrumb fields — silently dropping
// them would hide real activity from the user.
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

  const stepIds = Array.from(new Set(attempts.map((a) => a.stepId)))
  const steps = await db.contentPiece.findMany({
    where: {
      id: { in: stepIds },
      locale,
      type: "step",
    },
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
          where: {
            slug: { in: courseSlugs },
            locale,
            type: "course",
          },
          select: { slug: true, title: true, parentSlug: true },
        })
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]))

  return attempts.map((a) => {
    const step = stepById.get(a.stepId)
    const course = step?.parentSlug ? courseBySlug.get(step.parentSlug) : undefined
    return {
      attemptId: a.id,
      passed: a.passed,
      createdAt: a.createdAt,
      stepSlug: step?.slug ?? "",
      stepTitle: step?.title ?? a.stepId,
      trackSlug: course?.parentSlug ?? "",
      courseSlug: course?.slug ?? "",
      courseTitle: course?.title ?? "",
    }
  })
}
