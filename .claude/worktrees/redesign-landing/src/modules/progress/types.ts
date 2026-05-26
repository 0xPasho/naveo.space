export type ProgressStatus = "not_started" | "in_progress" | "completed"

export type StepProgress = {
  stepId: string
  stepLocale: string
  status: ProgressStatus
  attempts: number
  hintsUsed: number
  completedAt: Date | null
}

// Return value of `recordAttemptForStep`. `firstCompletion` flips true on the
// attempt that transitions a step from not-completed to completed (driving
// gem awards and lesson-cleared detection). `firstTry` is true when the step
// went 0 → completed in a single attempt.
export type StepAttemptOutcome = {
  progress: StepProgress
  firstCompletion: boolean
  firstTry: boolean
}

export type CourseProgress = {
  courseSlug: string
  total: number
  completed: number
}

export type TrackProgress = {
  trackSlug: string
  total: number
  completed: number
}

// One entry per completed step. Joined with content metadata so the UI can
// render a breadcrumbed row without additional queries.
export type JournalEntry = {
  stepId: string
  stepSlug: string
  stepTitle: string
  trackSlug: string
  courseSlug: string
  courseTitle: string
  completedAt: Date
}

// Course-completion badge. A course is "earned" once every step under it has
// status=completed. Order is the source content order.
export type CourseBadge = {
  trackSlug: string
  courseSlug: string
  courseTitle: string
  earnedAt: Date
  // The latest step's completedAt is used as the badge's earned date.
}
