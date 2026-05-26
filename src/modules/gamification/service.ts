import "server-only"

import { db } from "@/server/db"
// db is the project's PrismaClient singleton; re-exported here just for the
// transaction parameter type below.

import type { Step } from "@/modules/content/types"

import {
  BADGE,
  XP_BY_EXERCISE_KIND,
  XP_DEFAULT_PER_EXERCISE,
  XP_FIRST_TRY_MULTIPLIER,
  XP_REWARD,
} from "./data"
import {
  computeStreakUpdate,
  isAtRiskToday,
  toIsoDate,
  toUtcDay,
} from "./lib"
import type { ActivitySource, XpSnapshot } from "./types"

// How long after a streak save we keep surfacing the "shield saved you"
// banner to the user. Two minutes is long enough that a render after the
// step-completion action still picks it up, short enough that re-opening
// the app a while later doesn't replay the banner. Session-storage dedupe
// in the client component is the second line of defence.
const STREAK_SAVE_BANNER_WINDOW_MS = 2 * 60 * 1000

// Read the user's current gamification snapshot. Creates the row lazily if it
// doesn't exist (returns a zeroed snapshot). Computes derived fields
// (`atRiskToday`, `recentFreezeSave`) at read time so the DB never holds
// stale flags. Reads `Wallet.streakFreezes` so at-risk accounts for the
// user's shield inventory (a stocked-up user isn't pinged until shields run
// out).
export async function getXpSnapshot(userId: string): Promise<XpSnapshot> {
  const row = await db.xp.findUnique({ where: { userId } })
  if (!row) {
    return {
      total: 0,
      dailyStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,
      atRiskToday: false,
      freezesAvailable: 0,
      recentFreezeSave: null,
    }
  }
  const today = new Date()
  const wallet = await db.wallet.findUnique({
    where: { userId },
    select: { streakFreezes: true },
  })
  const freezesAvailable = wallet?.streakFreezes ?? 0

  // Most recent consume — used to render the one-shot "shield saved you"
  // banner. We only surface it when it happened within
  // STREAK_SAVE_BANNER_WINDOW_MS so re-renders after the window stay quiet.
  const lastConsume = await db.streakFreezeTransaction.findFirst({
    where: { userId, reason: "consumed-streak-save" },
    orderBy: { createdAt: "desc" },
    select: { id: true, delta: true, createdAt: true },
  })
  const recentFreezeSave =
    lastConsume &&
    today.getTime() - lastConsume.createdAt.getTime() < STREAK_SAVE_BANNER_WINDOW_MS
      ? {
          id: lastConsume.id,
          count: -lastConsume.delta,
          at: lastConsume.createdAt.toISOString(),
        }
      : null

  return {
    total: row.total,
    dailyStreak: row.dailyStreak,
    bestStreak: row.bestStreak,
    lastActiveDate: row.lastActiveDate ? toIsoDate(row.lastActiveDate) : null,
    atRiskToday: isAtRiskToday(
      row.lastActiveDate,
      row.dailyStreak,
      today,
      freezesAvailable,
    ),
    freezesAvailable,
    recentFreezeSave,
  }
}

// Transaction client type inferred from db.$transaction's callback. Used so
// applyStreakUpdate below can run inside any caller-supplied tx.
type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0]

// Runs the streak math inside an existing transaction. Returns the updated
// Xp row. Caller is responsible for opening the tx and (optionally) layering
// additional writes (e.g. XP increment) on top. Pulled out of recordActivity
// so awardXp can fold the XP increment into the same atomic write.
async function applyStreakUpdate(
  tx: Tx,
  userId: string,
  today: Date,
  xpIncrement: number,
) {
  const todayUtc = toUtcDay(today)
  const existing = await tx.xp.findUnique({ where: { userId } })
  if (!existing) {
    return tx.xp.create({
      data: {
        userId,
        dailyStreak: 1,
        bestStreak: 1,
        lastActiveDate: todayUtc,
        total: xpIncrement,
      },
    })
  }
  // Read the wallet for streakFreezes inside the tx. If the wallet row
  // doesn't exist yet (e.g. ghost user from a stale session), we treat
  // shields as 0 — the wallet will be created lazily on next getWallet.
  const wallet = await tx.wallet.findUnique({ where: { userId } })
  const freezesAvailable = wallet?.streakFreezes ?? 0

  const update = computeStreakUpdate({
    previousStreak: existing.dailyStreak,
    lastActiveDate: existing.lastActiveDate,
    today,
    freezesAvailable,
  })
  const nextBest = Math.max(existing.bestStreak, update.streak)

  // Consume the shields that bridged the gap, in the same tx. Also append
  // a StreakFreezeTransaction so the consumption is auditable + the HUD
  // can surface the "your shield saved your streak" banner on next render.
  if (update.freezesConsumed > 0 && wallet) {
    await tx.wallet.update({
      where: { userId },
      data: {
        streakFreezes: { decrement: update.freezesConsumed },
      },
    })
    await tx.streakFreezeTransaction.create({
      data: {
        userId,
        delta: -update.freezesConsumed,
        reason: "consumed-streak-save",
        meta: {
          previousStreak: existing.dailyStreak,
          savedStreak: update.streak,
        } as never,
      },
    })
  }

  return tx.xp.update({
    where: { userId },
    data: {
      dailyStreak: update.streak,
      bestStreak: nextBest,
      lastActiveDate: todayUtc,
      ...(xpIncrement > 0 ? { total: { increment: xpIncrement } } : {}),
    },
  })
}

// Idempotent — second call same day is a no-op. Wrapped in a tx so concurrent
// attempts can't double-bump the streak. Reads the user's Wallet inside the
// same transaction so purchased Streak Shields can be consumed atomically
// when a missed-day gap would otherwise reset the streak.
export async function recordActivity(
  userId: string,
  source: ActivitySource,
): Promise<XpSnapshot> {
  void source

  const today = new Date()
  const row = await db.$transaction((tx) =>
    applyStreakUpdate(tx, userId, today, 0),
  )

  // Streak-driven badge awards. Each call is idempotent via the unique
  // constraint on (userId, code).
  await maybeAwardStreakBadges(userId, row.dailyStreak)

  // Re-read for fresh derived fields (freezesAvailable post-decrement +
  // recentFreezeSave that the tx above just wrote). The two extra reads
  // happen only inside recordActivity, not on every getXpSnapshot.
  return getXpSnapshot(userId)
}

// Add XP and bump the activity timestamp in a SINGLE transaction so we can't
// end up in a state where the streak ticked but the XP grant silently dropped
// (or vice versa). Caller still needs to await; the badge awards happen
// after the tx commits because they're idempotent and don't need atomicity.
export async function awardXp(args: {
  userId: string
  amount: number
  source: ActivitySource
}): Promise<XpSnapshot> {
  const { userId, amount } = args
  if (amount < 0) {
    throw new Error("awardXp: negative amount not supported")
  }
  const today = new Date()
  const row = await db.$transaction((tx) =>
    applyStreakUpdate(tx, userId, today, amount),
  )
  await maybeAwardStreakBadges(userId, row.dailyStreak)
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

// Frontmatter shape that drives XP calc. Kept minimal so callers that only
// have the raw ContentPiece.frontMatter (JSON column) can compute XP without
// loading the full Step.
type XpFrontmatter = {
  exercise?: { kind?: string }
  xp?: number
}

// Same rules as xpForStep, but operates on the raw frontmatter object. Used
// by analytics that batch-load ContentPiece.frontMatter from the DB.
export function xpForFrontmatter(fm: XpFrontmatter, firstTry: boolean): number {
  if (!fm.exercise) return 0
  const declared = fm.xp
  const base =
    declared ??
    (fm.exercise.kind ? XP_BY_EXERCISE_KIND[fm.exercise.kind] : undefined) ??
    XP_DEFAULT_PER_EXERCISE
  if (!firstTry) return base
  return Math.floor(base * XP_FIRST_TRY_MULTIPLIER)
}

// Compute the XP value of a passing attempt for this step.
//
// Rules (locked in by user spec):
//   1. Narrative / demo steps return 0. Only steps with `exercise` grant XP.
//   2. If `step.frontMatter.xp` is defined, it overrides the kind default.
//   3. Else, look up the kind default in XP_BY_EXERCISE_KIND, fall back to
//      XP_DEFAULT_PER_EXERCISE if the kind isn't listed.
//   4. First-try (firstTry === true) multiplies by XP_FIRST_TRY_MULTIPLIER
//      and rounds down — first-time learners get the bonus, replay-passers
//      get the base value.
//
// The caller is responsible for the idempotency check (only call this on
// firstCompletion). This function is pure math — it doesn't read or write DB.
export function xpForStep(step: Step, firstTry: boolean): number {
  return xpForFrontmatter(step.frontMatter, firstTry)
}

// Sum the real XP a user has earned from their completed Progress rows in a
// time window. Reads Progress.completedAt and joins to ContentPiece for the
// frontmatter (kind / xp override). Same approximation caveats as
// xpFromCompletedSteps — replay-failures undercount the first-try bonus.
export async function getRealXpInWindow(args: {
  userId: string
  locale: string
  start: Date
  endExclusive: Date
}): Promise<number> {
  const map = await getRealXpByUserInWindow({
    locale: args.locale,
    start: args.start,
    endExclusive: args.endExclusive,
    userIds: [args.userId],
  })
  return map.get(args.userId) ?? 0
}

// Batch variant for leaderboard / dashboards. Returns a map of userId → real
// XP earned in the window. Restrict the user set with `userIds` (omit to
// include every user with a completion in the window). When `locale` is
// omitted, sums XP across all locales — leaderboards do this so a learner
// who works in both `es` and `en` is ranked on their total weekly effort,
// matching the global Xp.total semantics. Per-locale callers (catalog,
// dashboard) keep passing the locale to scope to a single content variant.
export async function getRealXpByUserInWindow(args: {
  locale?: string
  start: Date
  endExclusive: Date
  userIds?: string[]
}): Promise<Map<string, number>> {
  const { locale, start, endExclusive, userIds } = args
  const completed = await db.progress.findMany({
    where: {
      status: "completed",
      completedAt: { gte: start, lt: endExclusive },
      ...(locale ? { stepLocale: locale } : {}),
      ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
    },
    select: { userId: true, stepId: true, stepLocale: true, firstTry: true },
  })
  if (completed.length === 0) return new Map()

  // Join on (stepId, stepLocale) because the same stepId exists in multiple
  // locales and frontMatter can diverge (xp override, exercise.kind) per
  // locale.
  const pairs = [
    ...new Map(
      completed.map((c) => [`${c.stepId}::${c.stepLocale}`, c]),
    ).values(),
  ].map((c) => ({ id: c.stepId, locale: c.stepLocale }))
  const pieces = await db.contentPiece.findMany({
    where: { OR: pairs },
    select: { id: true, locale: true, frontMatter: true },
  })
  const fmByIdLocale = new Map<string, XpFrontmatter>(
    pieces.map((p) => [`${p.id}::${p.locale}`, p.frontMatter as XpFrontmatter]),
  )

  const out = new Map<string, number>()
  for (const c of completed) {
    const fm = fmByIdLocale.get(`${c.stepId}::${c.stepLocale}`)
    if (!fm) continue
    const earned = xpForFrontmatter(fm, c.firstTry)
    if (earned === 0) continue
    out.set(c.userId, (out.get(c.userId) ?? 0) + earned)
  }
  return out
}

// Sum the XP the user *actually earned* across a list of steps. Used by the
// cleared / dashboard / profile screens to show real (not virtual) totals.
//
// `firstTry` per entry is the persisted `Progress.firstTry` flag, frozen at
// the moment of first completion. So even if the user later re-runs a passed
// step (failing or passing again), the 1.5x bonus they originally earned
// stays in this sum and matches Xp.total.
export function xpFromCompletedSteps(
  steps: Array<{
    step: Step
    completed: boolean
    // Real first-try flag, persisted on Progress at the moment of first
    // completion. Stays true even if attempts climbs later — so the
    // cleared/debrief screen keeps the 1.5x bonus the user actually earned.
    firstTry: boolean
  }>,
): number {
  let total = 0
  for (const entry of steps) {
    if (!entry.completed) continue
    total += xpForStep(entry.step, entry.firstTry)
  }
  return total
}

// Per-day XP buckets for chart rendering. Returns an array of length `days`
// (oldest first). The first bucket is the UTC day containing `firstDayStart`
// (defaults to `today - (days - 1)` so the last bucket is today). Each bucket
// sums real XP earned that day via xpForFrontmatter (same formula awardXp
// applies). One Progress query regardless of bucket count.
export async function getRealXpPerDay(args: {
  userId: string
  locale: string
  days: number
  firstDayStart?: Date
}): Promise<number[]> {
  const { userId, locale, days } = args
  if (days <= 0) return []

  const todayStart = toUtcDay(new Date())
  const firstDayStart = args.firstDayStart ?? (() => {
    const d = new Date(todayStart)
    d.setUTCDate(d.getUTCDate() - (days - 1))
    return d
  })()
  const endExclusive = new Date(firstDayStart)
  endExclusive.setUTCDate(endExclusive.getUTCDate() + days)

  const completed = await db.progress.findMany({
    where: {
      userId,
      stepLocale: locale,
      status: "completed",
      completedAt: { gte: firstDayStart, lt: endExclusive },
    },
    select: { stepId: true, firstTry: true, completedAt: true },
  })

  const buckets = Array.from({ length: days }, () => 0)
  if (completed.length === 0) return buckets

  const stepIds = [...new Set(completed.map((c) => c.stepId))]
  const pieces = await db.contentPiece.findMany({
    where: { OR: stepIds.map((id) => ({ id, locale })) },
    select: { id: true, frontMatter: true },
  })
  const fmById = new Map<string, XpFrontmatter>(
    pieces.map((p) => [p.id, p.frontMatter as XpFrontmatter]),
  )

  for (const c of completed) {
    if (!c.completedAt) continue
    const fm = fmById.get(c.stepId)
    if (!fm) continue
    const earned = xpForFrontmatter(fm, c.firstTry)
    if (earned === 0) continue
    const day = toUtcDay(c.completedAt)
    const idx = Math.round(
      (day.getTime() - firstDayStart.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (idx >= 0 && idx < days) buckets[idx]! += earned
  }
  return buckets
}

// 7-day streak strip for the Bridge dashboard. Index 0 = Monday, 6 = Sunday
// (matches the design's `["M","T","W","T","F","S","S"]` labels). Each cell:
//   - "done"   if the user logged any Attempt OR completed any narrative
//              step that calendar day (UTC),
//   - "today"  for the cell matching today's date (overrides done),
//   - "future" for days later this week (no activity yet).
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

  // Pull both signals: exercise attempts AND narrative completions
  // (Progress.completedAt). Either one means the user showed up that day.
  const [attempts, completions] = await Promise.all([
    db.attempt.findMany({
      where: {
        userId,
        createdAt: { gte: weekStart, lt: weekEndExclusive },
      },
      select: { createdAt: true },
    }),
    db.progress.findMany({
      where: {
        userId,
        completedAt: { gte: weekStart, lt: weekEndExclusive },
      },
      select: { completedAt: true },
    }),
  ])

  const activeDays = new Set<number>()
  const addDay = (d: Date) => {
    const day = toUtcDay(d)
    const diff = Math.round(
      (day.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diff >= 0 && diff < 7) activeDays.add(diff)
  }
  for (const a of attempts) addDay(a.createdAt)
  for (const p of completions) {
    if (p.completedAt) addDay(p.completedAt)
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

// Idempotent badge insert. Returns true if the badge was newly awarded
// (insert succeeded), false if the user already had it. Never throws —
// the caller treats badge awarding as best-effort.
export async function awardBadge(
  userId: string,
  code: string,
): Promise<boolean> {
  try {
    await db.badgeAward.create({ data: { userId, code } })
    return true
  } catch {
    // Unique violation OR other DB error — either way, badge isn't newly
    // awarded. Treat as no-op.
    return false
  }
}

export async function hasBadge(
  userId: string,
  code: string,
): Promise<boolean> {
  const row = await db.badgeAward.findUnique({
    where: { userId_code: { userId, code } },
    select: { id: true },
  })
  return row !== null
}
