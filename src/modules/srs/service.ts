import "server-only"

import { db } from "@/server/db"
import type { ContentLocale, Step } from "@/modules/content/types"
import { xpForStep } from "@/modules/gamification/service"

import { computeNextReview, initialMastery } from "./lib"
import type { MasteryState, ReviewItem, UpdateMasteryInput } from "./types"

// How many review items we materialize for /practice in one shot. We
// over-fetch a little so the renderer can do its own ordering / dedupe
// against the failure rails without re-querying.
const REVIEW_FETCH_CAP = 60

// Idempotent SRS update. Called from `exercises/service.runForUser`
// after the attempt has been recorded. Returns silently for steps that
// aren't yet in the user's mastery set if the attempt failed — we only
// start tracking a step once the user has demonstrated they can pass
// it, otherwise every failed attempt on never-cleared content would
// pollute the review queue.
//
// Best-effort: callers wrap this in try/catch and log on failure.
// SRS state lagging by one attempt is recoverable; blocking the
// response on a writer error is not.
export async function updateMastery(input: UpdateMasteryInput): Promise<void> {
  const { userId, stepId, stepLocale, passed } = input
  const now = new Date()

  const existing = await db.masteryRecord.findUnique({
    where: { userId_stepId_stepLocale: { userId, stepId, stepLocale } },
  })

  if (!existing) {
    // No prior record. We only start tracking mastery on a successful
    // attempt — a fail on never-cleared content is regular progress,
    // not decay. So fails here are no-ops.
    if (!passed) return
    const seed = initialMastery(now)
    await db.masteryRecord.create({
      data: {
        userId,
        stepId,
        stepLocale,
        intervalDays: seed.intervalDays,
        ease: seed.ease,
        nextReviewAt: seed.nextReviewAt,
        lastReviewedAt: seed.lastReviewedAt,
        lapses: seed.lapses,
        streak: seed.streak,
      },
    })
    return
  }

  const prevState: MasteryState = {
    intervalDays: existing.intervalDays,
    ease: existing.ease,
    nextReviewAt: existing.nextReviewAt,
    lastReviewedAt: existing.lastReviewedAt,
    lapses: existing.lapses,
    streak: existing.streak,
  }
  const next = computeNextReview(prevState, passed, now)
  await db.masteryRecord.update({
    where: { userId_stepId_stepLocale: { userId, stepId, stepLocale } },
    data: {
      intervalDays: next.intervalDays,
      ease: next.ease,
      nextReviewAt: next.nextReviewAt,
      lastReviewedAt: next.lastReviewedAt,
      lapses: next.lapses,
      streak: next.streak,
    },
  })
}

// Count of due review items for a user. Cheap query — used by the HUD
// badge / dashboard ribbon without paying the join cost for full items.
export async function getDueReviewCount(
  userId: string | null,
  locale: ContentLocale,
): Promise<number> {
  if (!userId) return 0
  return db.masteryRecord.count({
    where: {
      userId,
      stepLocale: locale,
      nextReviewAt: { lte: new Date() },
    },
  })
}

// Materialize the user's due review queue with step / course / track
// metadata for rendering. Mirrors the candidate-fetch shape in
// `practice/service.ts.collectCandidates` so the renderer can treat the
// two lists symmetrically.
export async function getReviewQueue(
  userId: string | null,
  locale: ContentLocale,
): Promise<ReviewItem[]> {
  if (!userId) return []

  const records = await db.masteryRecord.findMany({
    where: {
      userId,
      stepLocale: locale,
      nextReviewAt: { lte: new Date() },
    },
    orderBy: { nextReviewAt: "asc" },
    take: REVIEW_FETCH_CAP,
  })
  if (records.length === 0) return []

  const stepIds = records.map((r) => r.stepId)
  const stepRows = await db.contentPiece.findMany({
    where: {
      id: { in: stepIds },
      locale,
      type: "step",
    },
    select: {
      id: true,
      locale: true,
      slug: true,
      title: true,
      order: true,
      parentSlug: true,
      body: true,
      frontMatter: true,
    },
  })

  const courseSlugs = Array.from(
    new Set(
      stepRows.map((r) => r.parentSlug).filter((s): s is string => !!s),
    ),
  )
  const courseRows =
    courseSlugs.length === 0
      ? []
      : await db.contentPiece.findMany({
          where: { type: "course", locale, slug: { in: courseSlugs } },
          select: { slug: true, title: true, parentSlug: true },
        })
  const courseBySlug = new Map(courseRows.map((c) => [c.slug, c]))

  const trackSlugs = Array.from(
    new Set(
      courseRows.map((c) => c.parentSlug).filter((s): s is string => !!s),
    ),
  )
  const trackRows =
    trackSlugs.length === 0
      ? []
      : await db.contentPiece.findMany({
          where: { type: "track", locale, slug: { in: trackSlugs } },
          select: { slug: true, title: true },
        })
  const trackBySlug = new Map(trackRows.map((t) => [t.slug, t]))

  const stepById = new Map(stepRows.map((s) => [s.id, s]))

  const out: ReviewItem[] = []
  for (const rec of records) {
    const row = stepById.get(rec.stepId)
    if (!row) continue
    const step: Step = {
      id: row.id,
      locale: row.locale as ContentLocale,
      slug: row.slug,
      courseSlug: row.parentSlug ?? "",
      title: row.title,
      order: row.order ?? 0,
      body: row.body,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      frontMatter: row.frontMatter as any,
    }
    const exercise = step.frontMatter.exercise
    if (!exercise) continue

    const course = courseBySlug.get(step.courseSlug)
    if (!course || !course.parentSlug) continue
    const track = trackBySlug.get(course.parentSlug)
    if (!track) continue

    out.push({
      stepId: step.id,
      stepSlug: step.slug,
      stepTitle: step.title,
      courseSlug: course.slug,
      courseTitle: course.title,
      trackSlug: track.slug,
      trackTitle: track.title,
      nextReviewAt: rec.nextReviewAt,
      intervalDays: rec.intervalDays,
      streak: rec.streak,
      // Review passes earn the base step XP without the first-try bonus.
      // The user has already cleared this step once; replay = base reward.
      xpReward: xpForStep(step, false),
      exerciseKind: exercise.kind,
    })
  }

  return out
}
