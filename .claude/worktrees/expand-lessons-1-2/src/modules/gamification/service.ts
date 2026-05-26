import "server-only"

import { db } from "@/server/db"
// db is the project's PrismaClient singleton; re-exported here just for the
// transaction parameter type below.

import { BADGE, XP_REWARD } from "./data"
import {
  computeStreakAfter,
  isAtRiskToday,
  toIsoDate,
  toUtcDay,
} from "./lib"
import type { ActivitySource, XpSnapshot } from "./types"

// Read the user's current gamification snapshot. Creates the row lazily if it
// doesn't exist (returns a zeroed snapshot). Computes derived fields
// (`atRiskToday`) at read time so the DB never has stale flags.
export async function getXpSnapshot(userId: string): Promise<XpSnapshot> {
  const row = await db.xp.findUnique({ where: { userId } })
  if (!row) {
    return {
      total: 0,
      dailyStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      atRiskToday: false,
    }
  }
  const today = new Date()
  return {
    total: row.total,
    dailyStreak: row.dailyStreak,
    bestStreak: row.bestStreak,
    lastActiveDate: row.lastActiveDate ? toIsoDate(row.lastActiveDate) : null,
    atRiskToday: isAtRiskToday(row.lastActiveDate, row.dailyStreak, today),
  }
}

// Idempotent — second call same day is a no-op. Wrapped in a tx so concurrent
// attempts can't double-bump the streak.
export async function recordActivity(
  userId: string,
  _source: ActivitySource,
): Promise<XpSnapshot> {
  const today = new Date()
  const todayUtc = toUtcDay(today)

  const row = await db.$transaction(async (tx) => {
    const existing = await tx.xp.findUnique({ where: { userId } })
    if (!existing) {
      return tx.xp.create({
        data: {
          userId,
          dailyStreak: 1,
          bestStreak: 1,
          lastActiveDate: todayUtc,
        },
      })
    }
    const nextStreak = computeStreakAfter({
      previousStreak: existing.dailyStreak,
      lastActiveDate: existing.lastActiveDate,
      today,
    })
    const nextBest = Math.max(existing.bestStreak, nextStreak)
    return tx.xp.update({
      where: { userId },
      data: {
        dailyStreak: nextStreak,
        bestStreak: nextBest,
        lastActiveDate: todayUtc,
      },
    })
  })

  // Streak-driven badge awards. Each call is idempotent via the unique
  // constraint on (userId, code).
  await maybeAwardStreakBadges(userId, row.dailyStreak)

  return {
    total: row.total,
    dailyStreak: row.dailyStreak,
    bestStreak: row.bestStreak,
    lastActiveDate: row.lastActiveDate ? toIsoDate(row.lastActiveDate) : null,
    atRiskToday: false, // we just acted today
  }
}

// Add XP and (optionally) bump the activity timestamp. Internally calls
// recordActivity so a single grant updates both counters atomically from the
// caller's perspective.
export async function awardXp(args: {
  userId: string
  amount: number
  source: ActivitySource
}): Promise<XpSnapshot> {
  const { userId, amount, source } = args
  if (amount < 0) {
    throw new Error("awardXp: negative amount not supported")
  }
  await recordActivity(userId, source)
  if (amount > 0) {
    await db.xp.update({
      where: { userId },
      data: { total: { increment: amount } },
    })
  }
  return getXpSnapshot(userId)
}

// Award XP for completing a step. First-completion bonus applied via the
// caller-provided `firstTime` flag (Progress.completedAt was previously null).
export async function rewardStepCompletion(args: {
  userId: string
  firstTime: boolean
}): Promise<XpSnapshot> {
  const amount = args.firstTime
    ? XP_REWARD.stepCompletedFirstTry
    : XP_REWARD.stepCompletedAny
  return awardXp({
    userId: args.userId,
    amount,
    source: "step-completed",
  })
}

// 7-day streak strip for the Bridge dashboard. Index 0 = Monday, 6 = Sunday
// (matches the design's `["M","T","W","T","F","S","S"]` labels). Each cell:
//   - "done"   if the user logged any Attempt that calendar day (UTC),
//   - "today"  for the cell matching today's date (overrides done),
//   - "future" for days later this week (no attempts yet).
export type StreakWeekDay = "done" | "today" | "future"

export async function getStreakWeek(
  userId: string,
): Promise<{ days: StreakWeekDay[]; todayIdx: number }> {
  const today = new Date()
  const todayUtc = toUtcDay(today)
  // Monday-as-start: getUTCDay() is 0..6 with Sunday=0. Shift so Mon=0.
  const dow = (todayUtc.getUTCDay() + 6) % 7
  const weekStart = new Date(todayUtc)
  weekStart.setUTCDate(weekStart.getUTCDate() - dow)
  const weekEndExclusive = new Date(weekStart)
  weekEndExclusive.setUTCDate(weekEndExclusive.getUTCDate() + 7)

  const attempts = await db.attempt.findMany({
    where: {
      userId,
      createdAt: { gte: weekStart, lt: weekEndExclusive },
    },
    select: { createdAt: true },
  })

  const activeDays = new Set<number>()
  for (const a of attempts) {
    const day = toUtcDay(a.createdAt)
    const diff = Math.round(
      (day.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diff >= 0 && diff < 7) activeDays.add(diff)
  }

  const days: StreakWeekDay[] = Array.from({ length: 7 }, (_, i) => {
    if (i === dow) return "today"
    if (i > dow) return "future"
    return activeDays.has(i) ? "done" : "future"
  })

  return { days, todayIdx: dow }
}

const STREAK_BADGES: ReadonlyArray<{ days: number; code: string }> = [
  { days: 7, code: BADGE.sevenDayStreak },
  { days: 30, code: BADGE.thirtyDayStreak },
]

async function maybeAwardStreakBadges(
  userId: string,
  streak: number,
): Promise<void> {
  for (const { days, code } of STREAK_BADGES) {
    if (streak < days) continue
    await db.badgeAward
      .create({ data: { userId, code } })
      .catch(() => {
        // unique violation — already awarded, ignore
      })
  }
}
