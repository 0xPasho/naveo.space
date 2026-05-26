export type XpSnapshot = {
  total: number
  dailyStreak: number
  bestStreak: number
  // UTC ISO date (YYYY-MM-DD) of the last day with streak-eligible activity,
  // or null for users who haven't earned anything yet.
  lastActiveDate: string | null
  // True when the streak is positive AND `lastActiveDate` is before today
  // (UTC). Surfaces to the Hud as an "act today or lose your streak" cue.
  atRiskToday: boolean
}

// What "activity" was logged. Tracked for future analytics; doesn't change
// the streak rule (any of these bumps the streak the same way).
export type ActivitySource =
  | "step-attempt"
  | "step-completed"
  | "course-cleared"
