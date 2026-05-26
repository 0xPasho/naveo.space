import type { Track } from "@/modules/content/types"
import type { TrackProgress } from "@/modules/progress/types"

import { trackMetaFor } from "./data"
import type { CatalogCourse } from "./types"

export function toCatalogCourse(args: {
  track: Track
  progress: TrackProgress
  xpEarned: number
}): CatalogCourse {
  const { track, progress, xpEarned } = args
  const meta = trackMetaFor(track.slug, track.order)
  const total = progress.total
  const done = progress.completed
  const pct = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100))
  const complete = total > 0 && done === total
  return {
    slug: track.slug,
    unit: track.order,
    title: track.title,
    blurb: track.frontMatter.description,
    duration: meta.duration,
    mascot: meta.mascot,
    rank: meta.rank,
    color: meta.color,
    complete,
    pct,
    lessonsDone: done,
    lessons: total,
    xp: xpEarned,
    boss: meta.boss,
    locked: false,
    tags: meta.tags,
    crew: meta.crew,
  }
}
