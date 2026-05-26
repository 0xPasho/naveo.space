import "server-only"

import { db } from "@/server/db"
import type { ContentLocale } from "@/modules/content/types"
import {
  getTrack,
  listCourses,
  listSteps,
  listTracks,
} from "@/modules/content/service"
import {
  getRealXpInWindow,
  getXpSnapshot,
  xpForFrontmatter,
} from "@/modules/gamification/service"
import {
  getCourseProgress,
  getStepProgress,
  getTrackProgress,
} from "@/modules/progress/service"

import {
  CATALOG_CHIPS,
  syllabusKindFor,
  trackDetailMetaFor,
  trackMetaFor,
} from "./data"
import { toCatalogCourse } from "./lib"
import type {
  Catalog,
  CourseDetail,
  CoursePathNode,
  SyllabusItem,
  SyllabusStatus,
} from "./types"

export async function getCatalog(
  userId: string | null,
  locale: ContentLocale,
): Promise<Catalog> {
  const tracks = await listTracks(locale)
  const [progressByTrack, xpByTrack] = await Promise.all([
    Promise.all(tracks.map((t) => getTrackProgress(userId, t.slug, locale))),
    computeXpByTrack(tracks.map((t) => t.slug), userId, locale),
  ])
  const courses = tracks.map((track, i) =>
    toCatalogCourse({
      track,
      progress: progressByTrack[i],
      xpEarned: xpByTrack.get(track.slug) ?? 0,
    }),
  )

  const progressDone = courses.reduce((s, c) => s + c.lessonsDone, 0)
  const progressTotal = courses.reduce((s, c) => s + c.lessons, 0)
  const progressPct =
    progressTotal === 0
      ? 0
      : Math.min(100, Math.round((progressDone / progressTotal) * 100))
  // Real banked XP: read the user's Xp.total from gamification. Anon users
  // (no userId) see 0 — they haven't accumulated XP. We no longer compute
  // a virtual `completedSteps × XP_PER_STEP` here because that was always
  // diverging from the actual XP_REWARD rules (first-try bonus, per-step
  // overrides).
  const xpSnap = userId ? await getXpSnapshot(userId) : null
  const xpBanked = xpSnap?.total ?? 0
  // Real XP earned this calendar week (Mon → today, UTC). Replays
  // xpForFrontmatter over Progress.completedAt rows in the window.
  const xpDelta = userId ? await getXpDeltaThisWeek(userId, locale) : 0
  const capstonesTotal = courses.filter((c) => c.boss).length
  const capstonesDone = courses.filter((c) => c.boss && c.complete).length

  const chips = CATALOG_CHIPS.map((c) =>
    c.id === "all" ? { ...c, count: courses.length } : c,
  )

  return {
    locale,
    courses,
    chips,
    summary: {
      progressDone,
      progressTotal,
      progressPct,
      xpBanked,
      xpDelta,
      capstonesDone,
      capstonesTotal,
    },
  }
}

const getXpDeltaThisWeek = async (
  userId: string,
  locale: ContentLocale,
): Promise<number> => {
  const now = new Date()
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const dow = (weekStart.getUTCDay() + 6) % 7 // Mon = 0
  weekStart.setUTCDate(weekStart.getUTCDate() - dow)
  const weekEndExclusive = new Date(weekStart)
  weekEndExclusive.setUTCDate(weekEndExclusive.getUTCDate() + 7)
  return getRealXpInWindow({ userId, locale, start: weekStart, endExclusive: weekEndExclusive })
}

// ---------- Course detail (syllabus) ----------

export async function getCourseDetail(
  userId: string | null,
  trackSlug: string,
  locale: ContentLocale,
): Promise<CourseDetail | null> {
  const track = await getTrack(trackSlug, locale)
  if (!track) return null

  const courses = await listCourses(track.slug, locale)
  if (courses.length === 0) return null

  const meta = trackMetaFor(track.slug, track.order)
  const detailMeta = trackDetailMetaFor(track.slug)

  const [progressByCourse, courseXp] = await Promise.all([
    Promise.all(courses.map((c) => getCourseProgress(userId, c.slug, locale))),
    computeCourseXp(courses.map((c) => c.slug), userId, locale),
  ])

  // First incomplete course is "current"; subsequent ones are "locked" only
  // when there is at least one earlier course not yet started — otherwise
  // they're "active" (open and ready, but not the next-up). Last course is
  // visualized as a boss row.
  const currentIdx = progressByCourse.findIndex((p) => p.completed < p.total)

  const syllabus: SyllabusItem[] = courses.map((course, i) => {
    const p = progressByCourse[i]
    const total = p.total
    const done = p.completed
    const pct = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100))
    const isLast = i === courses.length - 1
    const kind = syllabusKindFor(track.slug, course.slug, isLast, meta.boss)
    const isBoss = kind === "boss"

    let status: SyllabusItem["status"] = "active"
    if (done >= total && total > 0) status = "done"
    else if (i === currentIdx) status = "current"
    else if (currentIdx >= 0 && i > currentIdx && pct === 0) status = "locked"

    const courseStats = courseXp.get(course.slug) ?? { earned: 0, total: 0 }
    return {
      courseSlug: course.slug,
      index: i + 1,
      title: course.title,
      desc: course.frontMatter.narrativeHook ?? "",
      pct,
      stepsDone: done,
      stepsTotal: total,
      // Course "xp" label in the syllabus = max XP earnable in this course
      // (sum of xpForFrontmatter across its exercise steps, without the
      // first-try bonus). Same number for every learner; what changes is
      // how much they've banked of it.
      xp: courseStats.total,
      kind,
      status,
      isBoss,
    }
  })

  const stepsDone = syllabus.reduce((s, r) => s + r.stepsDone, 0)
  const stepsTotal = syllabus.reduce((s, r) => s + r.stepsTotal, 0)
  const xpBanked = [...courseXp.values()].reduce((s, c) => s + c.earned, 0)
  const xpTotal = [...courseXp.values()].reduce((s, c) => s + c.total, 0)
  const pct =
    stepsTotal === 0 ? 0 : Math.min(100, Math.round((stepsDone / stepsTotal) * 100))

  // Resolve continueAt: first not-completed step in the current course. If the
  // track is fully complete, point back to the first step so the course remains
  // replayable instead of presenting a dead end.
  let continueAt: CourseDetail["continueAt"] = null
  const continueCourse = currentIdx >= 0 ? courses[currentIdx] : courses[0]
  if (continueCourse) {
    const currentCourse = continueCourse
    const steps = await listSteps(currentCourse.slug, locale)
    if (steps.length > 0) {
      let target = steps[0]
      let stepNumber = 1
      if (userId && currentIdx >= 0) {
        for (let s = 0; s < steps.length; s++) {
          const sp = await getStepProgress(userId, steps[s].id, locale)
          if (!sp || sp.status !== "completed") {
            target = steps[s]
            stepNumber = s + 1
            break
          }
        }
      }
      continueAt = {
        trackSlug: track.slug,
        courseSlug: currentCourse.slug,
        stepSlug: target.slug,
        stepNumber,
        stepTitle: target.title,
      }
    }
  }

  return {
    trackSlug: track.slug,
    unit: track.order,
    title: track.title,
    blurb: track.frontMatter.description,
    duration: meta.duration,
    tags: meta.tags,
    mascot: meta.mascot,
    rank: meta.rank,
    color: meta.color,
    summary: {
      stepsDone,
      stepsTotal,
      pct,
      xpBanked,
      xpTotal,
    },
    hasCapstone: meta.boss,
    capstoneTitle: detailMeta.capstoneTitleKey,
    signingOfficer: detailMeta.signingOfficer,
    syllabus,
    continueAt,
  }
}

// Compute earned XP per top-level track for `userId`. Walks track → courses →
// steps, joins to Progress.completed, runs xpForFrontmatter. Anon users
// get an empty map (every track lookup falls through to 0).
const computeXpByTrack = async (
  trackSlugs: string[],
  userId: string | null,
  locale: ContentLocale,
): Promise<Map<string, number>> => {
  if (!userId || trackSlugs.length === 0) return new Map()

  const courses = await db.contentPiece.findMany({
    where: { type: "course", locale, parentSlug: { in: trackSlugs } },
    select: { slug: true, parentSlug: true },
  })
  if (courses.length === 0) return new Map()

  const courseToTrack = new Map<string, string>()
  for (const c of courses) {
    if (c.parentSlug) courseToTrack.set(c.slug, c.parentSlug)
  }

  const steps = await db.contentPiece.findMany({
    where: { type: "step", locale, parentSlug: { in: courses.map((c) => c.slug) } },
    select: { id: true, parentSlug: true, frontMatter: true },
  })
  if (steps.length === 0) return new Map()

  const progress = await db.progress.findMany({
    where: {
      userId,
      stepLocale: locale,
      status: "completed",
      stepId: { in: steps.map((s) => s.id) },
    },
    select: { stepId: true, firstTry: true },
  })
  // stepId -> persisted firstTry flag. Membership in the map === "this step
  // is completed for this user", so we still get the "skip if not completed"
  // gate without a separate set.
  const firstTryByStep = new Map(progress.map((p) => [p.stepId, p.firstTry]))

  const out = new Map<string, number>()
  for (const s of steps) {
    if (!s.parentSlug) continue
    const trackSlug = courseToTrack.get(s.parentSlug)
    if (!trackSlug) continue
    if (!firstTryByStep.has(s.id)) continue
    const fm = s.frontMatter as { exercise?: { kind?: string }; xp?: number }
    const earned = xpForFrontmatter(fm, firstTryByStep.get(s.id)!)
    out.set(trackSlug, (out.get(trackSlug) ?? 0) + earned)
  }
  return out
}

// Compute per-course XP totals (max earnable + actually earned by `userId`)
// from real frontmatter. Anonymous users (null userId) get earned=0 across
// the board.
const computeCourseXp = async (
  courseSlugs: string[],
  userId: string | null,
  locale: ContentLocale,
): Promise<Map<string, { earned: number; total: number }>> => {
  if (courseSlugs.length === 0) return new Map()

  const steps = await db.contentPiece.findMany({
    where: { type: "step", locale, parentSlug: { in: courseSlugs } },
    select: { id: true, parentSlug: true, frontMatter: true },
  })
  if (steps.length === 0) {
    return new Map(courseSlugs.map((slug) => [slug, { earned: 0, total: 0 }]))
  }

  // stepId -> persisted firstTry flag for COMPLETED steps. Membership === the
  // step is completed for this user; the boolean drives the 1.5x bonus.
  const firstTryByStep = new Map<string, boolean>()
  if (userId) {
    const progress = await db.progress.findMany({
      where: {
        userId,
        stepLocale: locale,
        status: "completed",
        stepId: { in: steps.map((s) => s.id) },
      },
      select: { stepId: true, firstTry: true },
    })
    for (const p of progress) firstTryByStep.set(p.stepId, p.firstTry)
  }

  const out = new Map<string, { earned: number; total: number }>()
  for (const slug of courseSlugs) out.set(slug, { earned: 0, total: 0 })
  for (const s of steps) {
    if (!s.parentSlug) continue
    const bucket = out.get(s.parentSlug)
    if (!bucket) continue
    const fm = s.frontMatter as { exercise?: { kind?: string }; xp?: number }
    const max = xpForFrontmatter(fm, false) // base XP, no first-try bonus
    bucket.total += max
    if (firstTryByStep.has(s.id)) {
      bucket.earned += xpForFrontmatter(fm, firstTryByStep.get(s.id)!)
    }
  }
  return out
}

// ---------- Course path nodes ----------
//
// Flatten every step in a track (across all courses) into a list the
// CoursePath component renders as winding path nodes. Status = done /
// current / locked / active driven by Progress; the last step of the
// last course is marked as the boss/capstone node.
export async function getTrackPathNodes(
  userId: string | null,
  trackSlug: string,
  locale: ContentLocale,
): Promise<CoursePathNode[]> {
  const track = await getTrack(trackSlug, locale)
  if (!track) return []

  const courses = await listCourses(track.slug, locale)
  if (courses.length === 0) return []

  // The boss visual on the last step is only valid when the track actually
  // has a capstone. Tracks without one (e.g. pre-flight) end on a normal
  // step, not a magenta boss node.
  const trackMeta = trackMetaFor(track.slug, track.order)

  const stepsPerCourse = await Promise.all(
    courses.map((c) => listSteps(c.slug, locale)),
  )

  // Flat (course, step) pairs in order. The last entry is the boss.
  type Pair = {
    courseSlug: string
    stepSlug: string
    stepTitle: string
    stepId: string
  }
  const pairs: Pair[] = []
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i]!
    for (const s of stepsPerCourse[i] ?? []) {
      pairs.push({
        courseSlug: c.slug,
        stepSlug: s.slug,
        stepTitle: s.title,
        stepId: s.id,
      })
    }
  }
  if (pairs.length === 0) return []

  // One Progress lookup per step. Sequential to keep the query plan simple
  // for small tracks; a batch helper could replace this for big tracks.
  const completed = new Set<string>()
  if (userId) {
    for (const p of pairs) {
      const sp = await getStepProgress(userId, p.stepId, locale)
      if (sp?.status === "completed") completed.add(p.stepId)
    }
  }

  // First non-completed step is "current"; everything after stays "active"
  // (open to attempt) until you hit a step inside a course that hasn't been
  // started — those become "locked".
  const firstIncompleteIdx = pairs.findIndex((p) => !completed.has(p.stepId))
  const lastBossIdx = pairs.length - 1

  return pairs.map((p, i) => {
    let status: SyllabusStatus = "active"
    if (completed.has(p.stepId)) status = "done"
    else if (i === firstIncompleteIdx) status = "current"
    else if (firstIncompleteIdx >= 0 && i > firstIncompleteIdx) status = "locked"

    return {
      courseSlug: p.courseSlug,
      stepSlug: p.stepSlug,
      stepTitle: p.stepTitle,
      status,
      isBoss: i === lastBossIdx && trackMeta.boss,
    }
  })
}
