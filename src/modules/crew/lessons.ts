import "server-only"

import { db } from "@/server/db"
import type { ContentLocale } from "@/modules/content/types"

import { isCrewSlug } from "./types"
import type { CrewSlug } from "./types"

export type CrewLessonRef = {
  id: string
  title: string
  courseTitle: string
  trackTitle: string
  href: string
  estimatedMinutes: number
}

export type CrewLessonMap = Record<CrewSlug, CrewLessonRef[]>

const CREW_SLUGS: readonly CrewSlug[] = [
  "vega",
  "echo",
  "atlas",
  "forge",
  "orbit",
  "hex",
]

const emptyCrewLessonMap = (): CrewLessonMap => ({
  vega: [],
  echo: [],
  atlas: [],
  forge: [],
  orbit: [],
  hex: [],
})

const collectCrewSlugs = (frontMatter: unknown): CrewSlug[] => {
  if (
    typeof frontMatter !== "object" ||
    frontMatter === null ||
    Array.isArray(frontMatter)
  ) {
    return []
  }

  const fm = frontMatter as {
    characters?: unknown
    exercise?: { kind?: unknown; personaSlug?: unknown }
    demo?: { props?: { presenter?: unknown } }
  }
  const slugs = new Set<CrewSlug>()

  if (Array.isArray(fm.characters)) {
    for (const slug of fm.characters) {
      if (typeof slug === "string" && isCrewSlug(slug)) slugs.add(slug)
    }
  }

  if (
    fm.exercise?.kind === "conversation-goal" &&
    typeof fm.exercise.personaSlug === "string" &&
    isCrewSlug(fm.exercise.personaSlug)
  ) {
    slugs.add(fm.exercise.personaSlug)
  }

  const presenter = fm.demo?.props?.presenter
  if (typeof presenter === "string" && isCrewSlug(presenter)) {
    slugs.add(presenter)
  }

  return [...slugs]
}

export async function listCrewLessonsBySlug(
  locale: ContentLocale,
): Promise<CrewLessonMap> {
  const rows = await db.contentPiece.findMany({
    where: { locale, type: { in: ["track", "course", "step"] } },
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      parentSlug: true,
      order: true,
      frontMatter: true,
    },
    orderBy: [{ type: "asc" }, { order: "asc" }],
  })

  const tracks = new Map(
    rows
      .filter((row) => row.type === "track")
      .map((row) => [row.slug, { title: row.title, order: row.order ?? 0 }]),
  )
  const courses = new Map(
    rows
      .filter((row) => row.type === "course")
      .map((row) => [
        row.slug,
        {
          title: row.title,
          trackSlug: row.parentSlug ?? "",
          order: row.order ?? 0,
        },
      ]),
  )

  const lessonMap = emptyCrewLessonMap()
  const sortMetaById = new Map<
    string,
    { trackOrder: number; courseOrder: number; stepOrder: number }
  >()

  for (const row of rows) {
    if (row.type !== "step") continue

    const courseSlug = row.parentSlug ?? ""
    const course = courses.get(courseSlug)
    if (!course) continue

    const track = tracks.get(course.trackSlug)
    if (!track) continue

    const crewSlugs = collectCrewSlugs(row.frontMatter)
    if (crewSlugs.length === 0) continue

    const estimatedMinutes =
      typeof (row.frontMatter as { estimatedMinutes?: unknown })
        .estimatedMinutes === "number"
        ? (row.frontMatter as { estimatedMinutes: number }).estimatedMinutes
        : 0

    const ref: CrewLessonRef = {
      id: row.id,
      title: row.title,
      courseTitle: course.title,
      trackTitle: track.title,
      href: `/tracks/${course.trackSlug}/${courseSlug}/${row.slug}`,
      estimatedMinutes,
    }
    sortMetaById.set(row.id, {
      trackOrder: track.order,
      courseOrder: course.order,
      stepOrder: row.order ?? 0,
    })

    for (const slug of crewSlugs) {
      lessonMap[slug].push(ref)
    }
  }

  for (const slug of CREW_SLUGS) {
    lessonMap[slug].sort((a, b) => {
      const aMeta = sortMetaById.get(a.id)
      const bMeta = sortMetaById.get(b.id)
      return (
        (aMeta?.trackOrder ?? 0) - (bMeta?.trackOrder ?? 0) ||
        (aMeta?.courseOrder ?? 0) - (bMeta?.courseOrder ?? 0) ||
        (aMeta?.stepOrder ?? 0) - (bMeta?.stepOrder ?? 0) ||
        a.title.localeCompare(b.title, locale)
      )
    })
  }

  return lessonMap
}
