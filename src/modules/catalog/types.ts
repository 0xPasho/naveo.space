import type { ContentLocale } from "@/modules/content/types"

// Visual rank shown on the poster ribbon. Maps roughly to track order /
// difficulty — purely cosmetic until we have a real curriculum graph.
export type CatalogRank =
  | "FIRST OFFICER"
  | "QUARTERMASTER"
  | "CHIEF ENGINEER"
  | "CAPTAIN"
  | "RECRUIT"
  | "MISSION OPERATOR"
  | "RED TEAM"

export type CatalogCrewMember = {
  name: string
  mascot: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
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
  mascot: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
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

// Flat-list node for the CoursePath component: one entry per STEP across
// every course in a track. Renders as a node in the Duolingo-style winding
// path on the course-detail page.
export type CoursePathNode = {
  courseSlug: string
  stepSlug: string
  stepTitle: string
  // Step status derived from Progress + currentStepIdx logic.
  status: SyllabusStatus
  // Last step of the last course in the track. Visualized as a magenta
  // capstone node.
  isBoss: boolean
}

export type CourseDetailSummary = {
  stepsDone: number
  stepsTotal: number
  pct: number
  xpBanked: number
  xpTotal: number
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
  mascot: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
  rank: CatalogRank
  color: string
  summary: CourseDetailSummary
  // True when the track ends in a capstone course (TRACK_DISPLAY_META.boss).
  // Drives whether path-aside shows the capstone preview + boss legend, and
  // whether the path's last node renders as a magenta boss disc.
  hasCapstone: boolean
  capstoneTitle: string
  signingOfficer: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
  syllabus: SyllabusItem[]
  continueAt: CourseDetailContinue | null
}
