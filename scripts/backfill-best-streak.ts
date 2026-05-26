// Recompute Xp.bestStreak from the user's full activity history.
//
// Why this exists: the Xp row is created lazily by recordActivity. For users
// who already had Attempts/Progress before the gamification module landed,
// every pre-existing day was missed and bestStreak never reflected real
// historical performance. This script replays the streak rule (gap == 1
// continues, gap > 1 resets) over the union of Attempt.createdAt and
// Progress.completedAt and updates bestStreak in place.
//
// Idempotent. Never decreases dailyStreak — only patches bestStreak upward.
//
// Usage:  pnpm tsx scripts/backfill-best-streak.ts            (dry-run)
//         pnpm tsx scripts/backfill-best-streak.ts --apply    (writes)

import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const db = new PrismaClient({ adapter })

const APPLY = process.argv.includes("--apply")

const toUtcDay = (d: Date): string => d.toISOString().slice(0, 10)

const replay = (utcDays: string[]): { dailyStreak: number; bestStreak: number } => {
  if (utcDays.length === 0) return { dailyStreak: 0, bestStreak: 0 }
  const sorted = [...new Set(utcDays)].sort()
  let streak = 0
  let best = 0
  let prev: Date | null = null
  for (const day of sorted) {
    const d = new Date(day + "T00:00:00.000Z")
    if (prev === null) streak = 1
    else {
      const gap = Math.round((d.getTime() - prev.getTime()) / 86400000)
      streak = gap === 1 ? streak + 1 : 1
    }
    best = Math.max(best, streak)
    prev = d
  }
  return { dailyStreak: streak, bestStreak: best }
}

const main = async () => {
  const xpRows = await db.xp.findMany({
    select: { userId: true, dailyStreak: true, bestStreak: true },
  })
  console.log(`Found ${xpRows.length} Xp rows. Mode: ${APPLY ? "APPLY" : "dry-run"}\n`)

  for (const xp of xpRows) {
    const [attempts, completions] = await Promise.all([
      db.attempt.findMany({
        where: { userId: xp.userId },
        select: { createdAt: true },
      }),
      db.progress.findMany({
        where: { userId: xp.userId, completedAt: { not: null } },
        select: { completedAt: true },
      }),
    ])

    const days: string[] = []
    for (const a of attempts) days.push(toUtcDay(a.createdAt))
    for (const p of completions) {
      if (p.completedAt) days.push(toUtcDay(p.completedAt))
    }

    const replayed = replay(days)
    const nextBest = Math.max(xp.bestStreak, replayed.bestStreak)
    const drift = nextBest - xp.bestStreak

    console.log(
      `user=${xp.userId}  days=${new Set(days).size}  ` +
        `replayedBest=${replayed.bestStreak}  dbBest=${xp.bestStreak}  ` +
        `→ ${drift > 0 ? `BUMP +${drift}` : "no change"}`,
    )

    if (APPLY && drift > 0) {
      await db.xp.update({
        where: { userId: xp.userId },
        data: { bestStreak: nextBest },
      })
    }
  }

  console.log(`\nDone.${APPLY ? "" : " (dry-run — re-run with --apply to write)"}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
