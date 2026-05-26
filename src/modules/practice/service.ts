import "server-only"

import { db } from "@/server/db"
import type { ContentLocale, Step } from "@/modules/content/types"
import { xpForStep } from "@/modules/gamification/service"

import {
  EXERCISE_KIND_TO_RAIL,
  PRACTICE_RAIL_ORDER,
  type PracticeItem,
  type PracticeRailKind,
} from "./types"

// Window used to source review candidates. Older failures are still
// shown in the user's catalog progress but are no longer surfaced as
// "review this" — once a step is stale, the rail forgets it.
const REVIEW_WINDOW_DAYS = 30
// Hard cap on how many distinct steps we materialize before bucketing.
// Used purely as a query budget — the bucket result is still constrained
// to one item per kind in `getPracticeRail`.
const CANDIDATE_FETCH_CAP = 60

// Returns one practice item per rail kind, populated from the user's
// most recent failed attempts. Buckets without a candidate are simply
// absent in the result map — callers decide whether to render an empty
// slot or hide the row.
//
// `getPracticeQueue` is the expanded variant: same source, no per-kind
// dedupe, larger limit. Both share the candidate-fetch path.
export async function getPracticeRail(
  userId: string | null,
  locale: ContentLocale,
): Promise<{
  items: Partial<Record<PracticeRailKind, PracticeItem>>
  total: number
}> {
  if (!userId) return { items: {}, total: 0 }

  const candidates = await collectCandidates(userId, locale)
  const items: Partial<Record<PracticeRailKind, PracticeItem>> = {}
  for (const candidate of candidates) {
    if (items[candidate.kind]) continue
    items[candidate.kind] = candidate
    if (Object.keys(items).length === PRACTICE_RAIL_ORDER.length) break
  }
  return { items, total: candidates.length }
}

// Expanded list for the /practice page. No per-kind dedupe — every
// recent failed step is included, sorted by recency.
export async function getPracticeQueue(
  userId: string | null,
  locale: ContentLocale,
): Promise<PracticeItem[]> {
  if (!userId) return []
  return collectCandidates(userId, locale)
}

type AttemptAgg = {
  stepId: string
  fails: number
  lastFailedAt: Date
}

async function collectCandidates(
  userId: string,
  locale: ContentLocale,
): Promise<PracticeItem[]> {
  const since = new Date(
    Date.now() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  )

  // Failed attempts in the window, scored to a per-step "most recent
  // failure" record. We don't filter out steps the user has since
  // cleared — the design treats a fail as a permanent invitation to
  // review until it scrolls out of the 30-day window.
  const rawFails = await db.attempt.findMany({
    where: {
      userId,
      stepLocale: locale,
      passed: false,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: { stepId: true, createdAt: true },
  })

  const byStep = new Map<string, AttemptAgg>()
  for (const row of rawFails) {
    const existing = byStep.get(row.stepId)
    if (existing) {
      existing.fails += 1
      continue
    }
    byStep.set(row.stepId, {
      stepId: row.stepId,
      fails: 1,
      lastFailedAt: row.createdAt,
    })
  }
  if (byStep.size === 0) return []

  const stepIds = Array.from(byStep.keys()).slice(0, CANDIDATE_FETCH_CAP)
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
  const courseBySlug = new Map(
    courseRows.map((c) => [c.slug, c]),
  )

  const trackSlugs = Array.from(
    new Set(
      courseRows
        .map((c) => c.parentSlug)
        .filter((s): s is string => !!s),
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

  const out: PracticeItem[] = []
  for (const row of stepRows) {
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

    const kind = EXERCISE_KIND_TO_RAIL[exercise.kind]
    if (!kind) continue

    const course = courseBySlug.get(step.courseSlug)
    if (!course || !course.parentSlug) continue
    const track = trackBySlug.get(course.parentSlug)
    if (!track) continue

    const agg = byStep.get(step.id)
    if (!agg) continue

    out.push({
      kind,
      stepId: step.id,
      stepSlug: step.slug,
      stepTitle: step.title,
      courseSlug: course.slug,
      courseTitle: course.title,
      trackSlug: track.slug,
      trackTitle: track.title,
      lastFailedAt: agg.lastFailedAt,
      attempts: agg.fails,
      xpReward: xpForStep(step, false),
      exerciseKind: exercise.kind,
    })
  }

  out.sort((a, b) => b.lastFailedAt.getTime() - a.lastFailedAt.getTime())
  return out
}
