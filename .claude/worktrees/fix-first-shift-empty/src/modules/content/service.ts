import "server-only"

import { db } from "@/server/db"

import type {
  ContentLocale,
  Course,
  CourseFrontmatter,
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

// Content is authored locale-by-locale. While some locales lag, we transparently
// fall back to the default locale so users on a UI locale without content still
// see the catalog instead of an empty page. The UI locale (translations) stays
// independent — only content reads switch.
const DEFAULT_CONTENT_LOCALE: ContentLocale = "es"

export async function resolveContentLocale(
  requestedLocale: ContentLocale,
): Promise<ContentLocale> {
  if (requestedLocale === DEFAULT_CONTENT_LOCALE) return requestedLocale
  const count = await db.contentPiece.count({
    where: { type: "track", locale: requestedLocale },
  })
  if (count > 0) return requestedLocale
  return DEFAULT_CONTENT_LOCALE
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

export async function getStep(slug: string, locale: ContentLocale): Promise<Step | null> {
  const row = await db.contentPiece.findFirst({
    where: { type: "step", locale, slug },
  })
  return row ? toStep(row) : null
}
