import type { User as DbUser } from "@/generated/prisma/client"

export type AppUser = DbUser

export type UserStats = {
  totalSteps: number
  completedSteps: number
  totalAttempts: number
  memberSince: Date | null
  xp: number
}

export type NextStepRef = {
  trackSlug: string
  trackTitle: string
  courseSlug: string
  courseTitle: string
  stepSlug: string
  stepTitle: string
  isInProgress: boolean
}

// What the "resume" CTA on the dashboard should point at. A normal user has
// a track step in flight (`kind: "step"`). A user who has cleared everything
// but still has a daily quest pending falls into `kind: "daily-quest"` so
// the CTA stays meaningful instead of dead-ending. `null` only when there
// genuinely is nothing — no incomplete tracks, no daily pool.
export type NextAction =
  | { kind: "step"; step: NextStepRef }
  | { kind: "daily-quest"; questTitle: string }

export type ActivityEntry = {
  attemptId: string
  passed: boolean
  createdAt: Date
  stepSlug: string
  stepTitle: string
  // Best-effort breadcrumb. Empty string when the related ContentPiece can't
  // be found (e.g. attempt logged against a step that was later removed).
  trackSlug: string
  courseSlug: string
  courseTitle: string
  // Real XP this attempt would have granted (xpForFrontmatter, with the
  // first-try bonus inferred from the matching Progress.attempts). 0 for
  // failed attempts, narrative steps, or attempts whose step no longer
  // exists in content.
  xp: number
}

export type WeeklyXp = {
  weekStart: Date
  xp: number
}

// Streak calendar cell state.
//   "done"        — past day with at least one attempt
//   "miss"        — past day with zero attempts
//   "future"      — days after today (not rendered active in the 8-week view)
//   "today"       — current day, no attempts yet (just the highlight outline)
//   "today-done"  — current day with at least one attempt (outline + fill)
export type CalendarDay =
  | "done"
  | "miss"
  | "today"
  | "today-done"
  | "future"

export type TrackMastery = {
  trackSlug: string
  trackTitle: string
  completed: number
  total: number
  pct: number
}
