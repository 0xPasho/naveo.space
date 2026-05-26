import { STREAK_MAX_GAP_DAYS } from "./data"

// Truncate a Date to its UTC day boundary (time set to 00:00:00.000).
// Comparing two truncated dates lets us count whole days between them.
export const toUtcDay = (d: Date): Date => {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  return out
}

// Days between two UTC-truncated dates. Returns 0 for same day, 1 for
// consecutive days, etc. Always non-negative when `b >= a`.
export const daysBetween = (a: Date, b: Date): number => {
  const ms = toUtcDay(b).getTime() - toUtcDay(a).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

// Format a date as YYYY-MM-DD in UTC. Suitable for transport (no timezone).
export const toIsoDate = (d: Date): string =>
  d.toISOString().slice(0, 10)

// Decide what the streak becomes after activity on `today`, given the
// previous state. Pure — covers every branch.
//
//   First activity ever      → 1
//   Same day as last active  → unchanged (idempotent)
//   Next day                 → prev + 1
//   Gap > 1 day              → 1 (reset, today counts as day 1)
export const computeStreakAfter = (args: {
  previousStreak: number
  lastActiveDate: Date | null
  today: Date
}): number => {
  const { previousStreak, lastActiveDate, today } = args
  if (lastActiveDate === null) return 1
  const gap = daysBetween(lastActiveDate, today)
  if (gap === 0) return Math.max(previousStreak, 1)
  if (gap <= STREAK_MAX_GAP_DAYS) return previousStreak + 1
  return 1
}

// Streak update that accounts for purchased Streak Shields. Each shield in
// `freezesAvailable` covers one missed day. If the user has enough shields
// to bridge the gap, the streak continues and the consumed shields are
// reported back so the caller can decrement them atomically. Otherwise the
// streak resets like the freeze-less branch above.
export type StreakUpdate = {
  streak: number
  freezesConsumed: number
}

export const computeStreakUpdate = (args: {
  previousStreak: number
  lastActiveDate: Date | null
  today: Date
  freezesAvailable: number
}): StreakUpdate => {
  const { previousStreak, lastActiveDate, today, freezesAvailable } = args
  if (lastActiveDate === null) return { streak: 1, freezesConsumed: 0 }
  const gap = daysBetween(lastActiveDate, today)
  if (gap === 0) {
    return { streak: Math.max(previousStreak, 1), freezesConsumed: 0 }
  }
  if (gap <= STREAK_MAX_GAP_DAYS) {
    return { streak: previousStreak + 1, freezesConsumed: 0 }
  }
  // Gap too large for a normal continuation. A shield covers each day past
  // STREAK_MAX_GAP_DAYS. Need exactly `(gap - STREAK_MAX_GAP_DAYS)` shields
  // to save the streak.
  const needed = gap - STREAK_MAX_GAP_DAYS
  if (freezesAvailable >= needed && previousStreak > 0) {
    return { streak: previousStreak + 1, freezesConsumed: needed }
  }
  return { streak: 1, freezesConsumed: 0 }
}

// True if the user has a live streak, hasn't acted yet today, AND their
// shield inventory wouldn't cover an additional missed day. Shields buy the
// user a buffer: if they don't act today, tomorrow's gap is `gap + 1`, which
// requires `gap` shields to bridge (since one day within
// STREAK_MAX_GAP_DAYS is free). So they're "at risk" iff
// `freezesAvailable < gap`. Pass `freezesAvailable = 0` to get the old
// shield-blind behaviour.
export const isAtRiskToday = (
  lastActiveDate: Date | null,
  streak: number,
  today: Date,
  freezesAvailable: number,
): boolean => {
  if (streak <= 0) return false
  if (lastActiveDate === null) return false
  const gap = daysBetween(lastActiveDate, today)
  if (gap < 1) return false
  return freezesAvailable < gap
}
