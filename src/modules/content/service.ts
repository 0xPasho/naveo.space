import "server-only"

import { db } from "@/server/db"

import type {
  ContentLocale,
  Course,
  CourseFrontmatter,
  DailyFrontmatter,
  DailyQuest,
  Step,
  StepFrontmatter,
  Track,
  TrackFrontmatter,
} from "./types"

type PieceRow = {
  id: string
  locale: string
  type: string
  slug: string
  title: string
  parentSlug: string | null
  order: number | null
  body: string
  frontMatter: unknown
}

const toTrack = (row: PieceRow): Track => ({
  id: row.id,
  locale: row.locale as ContentLocale,
  slug: row.slug,
  title: row.title,
  order: row.order ?? 0,
  frontMatter: row.frontMatter as TrackFrontmatter,
})

const toCourse = (row: PieceRow): Course => ({
  id: row.id,
  locale: row.locale as ContentLocale,
  slug: row.slug,
  trackSlug: row.parentSlug ?? "",
  title: row.title,
  order: row.order ?? 0,
  frontMatter: row.frontMatter as CourseFrontmatter,
})

const toDailyQuest = (row: PieceRow): DailyQuest => ({
  id: row.id,
  locale: row.locale as ContentLocale,
  slug: row.slug,
  title: row.title,
  body: row.body,
  frontMatter: row.frontMatter as DailyFrontmatter,
})

const toStep = (row: PieceRow): Step => ({
  id: row.id,
  locale: row.locale as ContentLocale,
  slug: row.slug,
  courseSlug: row.parentSlug ?? "",
  title: row.title,
  order: row.order ?? 0,
  body: row.body,
  frontMatter: row.frontMatter as StepFrontmatter,
})

export async function listTracks(locale: ContentLocale): Promise<Track[]> {
  const rows = await db.contentPiece.findMany({
    where: { type: "track", locale },
    orderBy: { order: "asc" },
  })
  return rows.map(toTrack)
}

export async function getTrack(slug: string, locale: ContentLocale): Promise<Track | null> {
  const row = await db.contentPiece.findFirst({
    where: { type: "track", locale, slug },
  })
  return row ? toTrack(row) : null
}

export async function listCourses(trackSlug: string, locale: ContentLocale): Promise<Course[]> {
  const rows = await db.contentPiece.findMany({
    where: { type: "course", locale, parentSlug: trackSlug },
    orderBy: { order: "asc" },
  })
  return rows.map(toCourse)
}

export async function getCourse(slug: string, locale: ContentLocale): Promise<Course | null> {
  const row = await db.contentPiece.findFirst({
    where: { type: "course", locale, slug },
  })
  return row ? toCourse(row) : null
}

export async function listSteps(courseSlug: string, locale: ContentLocale): Promise<Step[]> {
  const rows = await db.contentPiece.findMany({
    where: { type: "step", locale, parentSlug: courseSlug },
    orderBy: { order: "asc" },
  })
  return rows.map(toStep)
}

// Step slugs are NOT globally unique — two courses can each have a step
// named `capstone` or `cuando-un-prompt-no-alcanza`. The `courseSlug`
// parameter disambiguates by filtering on `parentSlug`. Without it, a
// findFirst would silently return the wrong row.
export async function getStep(
  slug: string,
  locale: ContentLocale,
  courseSlug?: string,
): Promise<Step | null> {
  const row = await db.contentPiece.findFirst({
    where: {
      type: "step",
      locale,
      slug,
      ...(courseSlug ? { parentSlug: courseSlug } : {}),
    },
  })
  return row ? toStep(row) : null
}

export async function listDailyQuests(locale: ContentLocale): Promise<DailyQuest[]> {
  const rows = await db.contentPiece.findMany({
    where: { type: "daily", locale },
    orderBy: { slug: "asc" },
  })
  return rows.map(toDailyQuest)
}

export async function getDailyQuestById(
  id: string,
  locale: ContentLocale,
): Promise<DailyQuest | null> {
  const row = await db.contentPiece.findUnique({
    where: { id_locale: { id, locale } },
  })
  if (!row || row.type !== "daily") return null
  return toDailyQuest(row)
}
