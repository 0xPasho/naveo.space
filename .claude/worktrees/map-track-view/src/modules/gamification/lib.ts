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

// True if the user has a live streak but hasn't acted yet today.
export const isAtRiskToday = (
  lastActiveDate: Date | null,
  streak: number,
  today: Date,
): boolean => {
  if (streak <= 0) return false
  if (lastActiveDate === null) return false
  return daysBetween(lastActiveDate, today) >= 1
}
