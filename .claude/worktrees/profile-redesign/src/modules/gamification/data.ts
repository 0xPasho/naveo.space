// XP grants per source. Kept small and round so a single value change here
// re-balances the economy without touching call sites.
export const XP_REWARD = {
  stepAttempt: 0, // raw attempts give nothing — incentive is on completion
  stepCompletedFirstTry: 12,
  stepCompletedAny: 8,
} as const

// Badge codes — match BadgeAward.code in the schema.
export const BADGE = {
  firstStep: "first-step",
  sevenDayStreak: "7-day-streak",
  thirtyDayStreak: "30-day-streak",
  firstTrack: "first-track-completed",
} as const

// Streak rule: a day-of-activity has to be within this many days of the
// previous one to count as "continuing" the streak. 1 = next calendar day.
export const STREAK_MAX_GAP_DAYS = 1
