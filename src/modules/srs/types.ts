import type { Exercise } from "@/modules/content/types"

// One review item surfaced to the user on the /practice page (and, later,
// the dashboard rail). Shape intentionally parallels `PracticeItem` from
// the practice module so the renderer can share row markup, but the
// metadata is review-specific (nextReviewAt, intervalDays, streak) rather
// than failure-specific (attempts, lastFailedAt).
export type ReviewItem = {
  stepId: string
  stepSlug: string
  stepTitle: string
  courseSlug: string
  courseTitle: string
  trackSlug: string
  trackTitle: string
  // When this step became (or will become) due. Items already past due
  // sort before upcoming ones in the queue.
  nextReviewAt: Date
  // Current spacing interval at the time of fetch. Renders as e.g.
  // "every 8 days" to signal cadence to the user.
  intervalDays: number
  // Consecutive successful reviews. Shown as a small badge.
  streak: number
  // XP the user earns on a passing review. Same base as the original
  // step's first-pass reward minus the first-try bonus.
  xpReward: number
  exerciseKind: Exercise["kind"]
}

// Input to `updateMastery`. Called once per Attempt for steps that carry
// an exercise. The function reads the prior MasteryRecord (if any) to
// decide between create / update / no-op — the caller doesn't need to
// supply pre-state.
export type UpdateMasteryInput = {
  userId: string
  stepId: string
  stepLocale: string
  passed: boolean
}

// Pure state used by `computeNextReview`. The lib layer never touches
// the DB — this is what gets read in, transformed, and written back.
export type MasteryState = {
  intervalDays: number
  ease: number
  nextReviewAt: Date
  lastReviewedAt: Date
  lapses: number
  streak: number
}
