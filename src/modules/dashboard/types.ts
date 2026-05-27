import type { ContentLocale } from "@/modules/content/types"
import type { StreakWeekDay } from "@/modules/gamification/service"
import type { NextStepRef } from "@/modules/users/types"

export type DashboardMascotSlug =
  | "vega"
  | "atlas"
  | "echo"
  | "forge"
  | "orbit"
  | "hex"

/* Naveo "Bridge" track tone for each crew member. Drives chips, glow dots,
   and avatar frames in bridge-dashboard.tsx. */
export type CrewTone =
  | "prompting"
  | "mcp"
  | "skills"
  | "agents"
  | "tooling"
  | "evals"

export type DashboardCrewMember = {
  slug: DashboardMascotSlug
  name: string
  // i18n key under bridge.crew.roles.*
  roleKey: DashboardMascotSlug
  /** Legacy color string. Still consumed by the old CrewCard variant on
      the catalog-heavy dashboard/page.tsx. To be deleted once that page
      migrates to Naveo Bridge. */
  color: string
  /** Naveo Bridge track tone. Used by bridge-dashboard.tsx. */
  tone: CrewTone
  locked: boolean
}

export type DashboardStats = {
  xpToday: number
  // Today's XP minus yesterday's.
  xpDelta: number
  // Real XP earned in the current ISO week (Mon → today UTC).
  xpThisWeek: number
  // Current week's total minus the previous week's (full Mon→Sun).
  xpWeekDelta: number
  streakDays: number
  bestStreak: number
}

export type DashboardContinue = {
  next: NextStepRef
  unitNumber: number
  stepNumber: number
  totalSteps: number
  pct: number
}

// Next capstone the user is working toward — read by the Dashboard C
// "Capstone" three-up card. Null when every track flagged as `boss` is
// already cleared, or when the curriculum has no capstones at all.
export type DashboardCapstone = {
  trackSlug: string
  trackTitle: string
  // i18n key under `tracks.detail.capstones.*`. Same shape as
  // CourseDetail.capstoneTitle.
  capstoneTitleKey: string
  signingOfficer: "vega" | "atlas" | "echo" | "forge" | "orbit" | "hex"
  // Steps remaining until the capstone is reached (capstone step included).
  // Zero means the next step IS the capstone.
  stepsAway: number
}

export type DashboardWeek = {
  // Per-day XP buckets for Mon..Sun of the current ISO week (UTC).
  xpByDay: number[]
  // Per-day streak state for the same week. Index 0 = Monday, 6 = Sunday.
  streak: StreakWeekDay[]
  // Index (0..6) of "today" inside the week.
  todayIdx: number
}

export type Dashboard = {
  locale: ContentLocale
  greetingName: string
  // ISO time-of-day window the greeting line should pick from.
  timeOfDay: "morning" | "afternoon" | "evening"
  shipTime: string
  // null for fresh users with no progress, or for fully-completed catalogs.
  continueAt: DashboardContinue | null
  // null when no capstones remain or the user is anon.
  capstone: DashboardCapstone | null
  crew: DashboardCrewMember[]
  stats: DashboardStats
  // 7-day XP + streak rollup for the current Mon..Sun week. All-zero for anon.
  week: DashboardWeek
  // Lead character of the active step (the one the Continue CTA points to).
  // Drives the mascot avatar at the top of the bridge. Defaults to "vega"
  // when no step is in progress or the active step has no character signal.
  mascotSlug: DashboardMascotSlug
}
