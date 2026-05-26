export type XpSnapshot = {
  total: number
  dailyStreak: number
  bestStreak: number
  // UTC ISO date (YYYY-MM-DD) of the last day with streak-eligible activity,
  // or null for users who haven't earned anything yet.
  lastActiveDate: string | null
  // True when the streak is positive AND the user's shield inventory
  // wouldn't bridge an additional missed day. A user with shields in stock
  // is NOT at risk — the shield will absorb the hit automatically.
  atRiskToday: boolean
  // Count of unspent streak shields the user owns. Mirrored from
  // Wallet.streakFreezes so the streak pill can surface "you have N
  // shields" without a second wallet read.
  freezesAvailable: number
  // Set when a streak-save consume happened in the last few minutes (see
  // STREAK_SAVE_BANNER_WINDOW_MS). The HUD renders a one-shot banner from
  // this; client dedupes by `id` via sessionStorage so it shows once.
  recentFreezeSave: {
    id: string
    count: number
    at: string
  } | null
}

// What "activity" was logged. Tracked for future analytics; doesn't change
// the streak rule (any of these bumps the streak the same way).
export type ActivitySource =
  | "step-attempt"
  | "step-completed"
  | "course-cleared"
  | "daily-quest"
