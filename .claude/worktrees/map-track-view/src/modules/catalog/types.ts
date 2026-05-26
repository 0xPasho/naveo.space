import type { ContentLocale } from "@/modules/content/types"

// Visual rank shown on the poster ribbon. Maps roughly to track order /
// difficulty — purely cosmetic until we have a real curriculum graph.
export type CatalogRank =
  | "FIRST OFFICER"
  | "QUARTERMASTER"
  | "CHIEF ENGINEER"
  | "CAPTAIN"
  | "RECRUIT"

export type CatalogCrewMember = {
  name: string
  mascot: "vega" | "atlas" | "echo" | "forge"
  color: string
}

// View-model the catalog page renders. One per track row.
export type CatalogCourse = {
  slug: string
  unit: number
  title: string
  blurb: string
  duration: string
  // Poster
  mascot: "vega" | "atlas" | "echo" | "forge"
  rank: CatalogRank
  color: string
  complete: boolean
  // Progress (steps across all courses in the track)
  pct: number
  lessonsDone: number
  lessons: number
  xp: number
  // Flags
  boss: boolean
  locked: boolean
  unlocks?: string
  // Footer
  tags: string[]
  crew: CatalogCrewMember[]
}

export type CatalogChip = {
  id: string
  labelKey: string // i18n key under tracks.list.chips
  icon?: string
  count?: number
}

export type CatalogSummary = {
  // "12 / 88"
  progressDone: number
  progressTotal: number
  progressPct: number
  xpBanked: number
  xpDelta: number
  capstonesDone: number
  capstonesTotal: number
}

export type Catalog = {
  locale: ContentLocale
  courses: CatalogCourse[]
  chips: CatalogChip[]
  summary: CatalogSummary
}

// ---------- Course detail (syllabus) ----------
//
// In our content model: Track > Course > Step. The design's "course detail"
// page lists each Course in a Track as a syllabus row — same vocabulary as
// CryptoZombies' lessons-within-a-course pattern.

export type SyllabusKind =
  | "read"
  | "drill"
  | "build"
  | "verify"
  | "chat"
  | "boss"

export type SyllabusStatus = "done" | "current" | "active" | "locked"

export type SyllabusItem = {
  courseSlug: string
  index: number
  title: string
  desc: string
  pct: number
  stepsDone: number
  stepsTotal: number
  xp: number
  kind: SyllabusKind
  status: SyllabusStatus
  isBoss: boolean
}

export type CourseDetailSummary = {
  stepsDone: number
  stepsTotal: number
  pct: number
  xpBanked: number
  xpTotal: number
  hearts: number
  heartsMax: number
}

export type CourseDetailContinue = {
  trackSlug: string
  courseSlug: string
  stepSlug: string
  stepNumber: number
  stepTitle: string
}

export type CourseDetail = {
  trackSlug: string
  unit: number
  title: string
  blurb: string
  duration: string
  tags: string[]
  mascot: "vega" | "atlas" | "echo" | "forge"
  rank: CatalogRank
  color: string
  summary: CourseDetailSummary
  capstoneTitle: string
  signingOfficer: "vega" | "atlas" | "echo" | "forge"
  syllabus: SyllabusItem[]
  continueAt: CourseDetailContinue | null
}

// ---------- Course map (Duolingo-style step zigzag) ----------
//
// One CourseMapNode per step inside a course. Status drives the visual:
// "done" lit + stars, "current" pulsing + actionable, "available" tappable
// but not the next-up, "locked" greyed. The last step in a course is flagged
// `isBoss` so the map renders the capstone glyph.

export type CourseMapNodeStatus = "done" | "current" | "available" | "locked"

export type CourseMapNode = {
  stepSlug: string
  index: number
  title: string
  status: CourseMapNodeStatus
  isBoss: boolean
  // 0..3 — only set when status is "done". Until the rubric pipeline emits
  // per-step grades, every completed step shows 3 stars.
  stars?: number
}

export type CourseMap = {
  trackSlug: string
  trackTitle: string
  courseSlug: string
  courseTitle: string
  unit: number
  blurb: string
  mascot: "vega" | "atlas" | "echo" | "forge"
  color: string
  totalSteps: number
  doneSteps: number
  pct: number
  // First not-completed step. Used to power the "Resume" CTA above the map.
  // Null when the course is fully cleared.
  resumeAt: { stepSlug: string; stepNumber: number; stepTitle: string } | null
  nodes: CourseMapNode[]
}
