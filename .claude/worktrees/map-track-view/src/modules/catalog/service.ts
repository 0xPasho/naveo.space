import "server-only"

import type { ContentLocale } from "@/modules/content/types"
import {
  getCourse,
  getTrack,
  listCourses,
  listSteps,
  listTracks,
} from "@/modules/content/service"
import {
  PLAYER_STATS_PLACEHOLDER,
  XP_DELTA_PER_WEEK,
  XP_PER_STEP,
} from "@/modules/users/placeholder-stats"
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
  CourseMap,
  CourseMapNode,
  SyllabusItem,
} from "./types"

const PLACEHOLDER_XP_PER_STEP = XP_PER_STEP
const PLACEHOLDER_XP_DELTA_PER_WEEK = XP_DELTA_PER_WEEK

export async function getCatalog(
  userId: string | null,
  locale: ContentLocale,
): Promise<Catalog> {
  const tracks = await listTracks(locale)
  const progressByTrack = await Promise.all(
    tracks.map((t) => getTrackProgress(userId, t.slug, locale)),
  )
  const courses = tracks.map((track, i) =>
    toCatalogCourse({ track, progress: progressByTrack[i] }),
  )

  const progressDone = courses.reduce((s, c) => s + c.lessonsDone, 0)
  const progressTotal = courses.reduce((s, c) => s + c.lessons, 0)
  const progressPct =
    progressTotal === 0
      ? 0
      : Math.min(100, Math.round((progressDone / progressTotal) * 100))
  const xpBanked = progressDone * PLACEHOLDER_XP_PER_STEP
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
      xpDelta: PLACEHOLDER_XP_DELTA_PER_WEEK,
      capstonesDone,
      capstonesTotal,
    },
  }
}

// ---------- Course detail (syllabus) ----------

const PLACEHOLDER_HEARTS = PLAYER_STATS_PLACEHOLDER.hearts
const PLACEHOLDER_HEARTS_MAX = PLAYER_STATS_PLACEHOLDER.heartsMax

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

  const progressByCourse = await Promise.all(
    courses.map((c) => getCourseProgress(userId, c.slug, locale)),
  )

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
    const kind = syllabusKindFor(track.slug, course.slug, isLast)
    const isBoss = kind === "boss"

    let status: SyllabusItem["status"] = "active"
    if (done >= total && total > 0) status = "done"
    else if (i === currentIdx) status = "current"
    else if (currentIdx >= 0 && i > currentIdx && pct === 0) status = "locked"

    return {
      courseSlug: course.slug,
      index: i + 1,
      title: course.title,
      desc: course.frontMatter.narrativeHook ?? "",
      pct,
      stepsDone: done,
      stepsTotal: total,
      xp: total * PLACEHOLDER_XP_PER_STEP,
      kind,
      status,
      isBoss,
    }
  })

  const stepsDone = syllabus.reduce((s, r) => s + r.stepsDone, 0)
  const stepsTotal = syllabus.reduce((s, r) => s + r.stepsTotal, 0)
  const xpBanked = stepsDone * PLACEHOLDER_XP_PER_STEP
  const xpTotal = stepsTotal * PLACEHOLDER_XP_PER_STEP
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
      hearts: PLACEHOLDER_HEARTS,
      heartsMax: PLACEHOLDER_HEARTS_MAX,
    },
    capstoneTitle: detailMeta.capstoneTitleKey,
    signingOfficer: detailMeta.signingOfficer,
    syllabus,
    continueAt,
  }
}

// ---------- Course map (Duolingo-style step zigzag) ----------

export async function getCourseMap(
  userId: string | null,
  trackSlug: string,
  courseSlug: string,
  locale: ContentLocale,
): Promise<CourseMap | null> {
  const [track, course, steps] = await Promise.all([
    getTrack(trackSlug, locale),
    getCourse(courseSlug, locale),
    listSteps(courseSlug, locale),
  ])
  if (!track || !course || course.trackSlug !== track.slug) return null
  if (steps.length === 0) return null

  const meta = trackMetaFor(track.slug, track.order)

  // Per-step status: hit progress for each step (only when authed). The first
  // not-completed step becomes "current"; everything after stays "locked"
  // until its predecessor is cleared. Without auth, the first step is current
  // and the rest are locked — same shape as a brand-new account.
  const completed: boolean[] = new Array(steps.length).fill(false)
  if (userId) {
    const rows = await Promise.all(
      steps.map((s) => getStepProgress(userId, s.id, locale)),
    )
    rows.forEach((row, i) => {
      completed[i] = row?.status === "completed"
    })
  }

  const currentIdx = completed.findIndex((c) => !c)
  const allDone = currentIdx === -1
  const lastIdx = steps.length - 1

  const nodes: CourseMapNode[] = steps.map((step, i) => {
    const isBoss = i === lastIdx
    let status: CourseMapNode["status"] = "locked"
    if (completed[i]) status = "done"
    else if (i === currentIdx) status = "current"
    else if (allDone) status = "available"

    return {
      stepSlug: step.slug,
      index: i + 1,
      title: step.title,
      status,
      isBoss,
      stars: completed[i] ? 3 : undefined,
    }
  })

  const doneSteps = completed.filter(Boolean).length
  const totalSteps = steps.length
  const pct =
    totalSteps === 0 ? 0 : Math.min(100, Math.round((doneSteps / totalSteps) * 100))

  const resumeIdx = allDone ? 0 : currentIdx
  const resumeStep = steps[resumeIdx]
  const resumeAt = allDone
    ? null
    : {
        stepSlug: resumeStep.slug,
        stepNumber: resumeIdx + 1,
        stepTitle: resumeStep.title,
      }

  return {
    trackSlug: track.slug,
    trackTitle: track.title,
    courseSlug: course.slug,
    courseTitle: course.title,
    unit: track.order,
    blurb: course.frontMatter.narrativeHook ?? "",
    mascot: meta.mascot,
    color: meta.color,
    totalSteps,
    doneSteps,
    pct,
    resumeAt,
    nodes,
  }
}
