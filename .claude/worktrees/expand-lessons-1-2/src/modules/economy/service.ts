import "server-only"

import { db } from "@/server/db"

import { GEM_REWARD, HEARTS_MAX_DEFAULT } from "./data"
import { needsDailyHeartRefill, toIsoDate, toUtcDay } from "./lib"
import type { GemReason, WalletSnapshot } from "./types"

// Read the user's wallet. Creates the row lazily on first read and refills
// hearts to `heartsMax` on the first read of each UTC day. Both side effects
// run inside the same transaction so concurrent reads from two tabs can't
// race the refill into running twice.
export async function getWallet(userId: string): Promise<WalletSnapshot> {
  const today = new Date()
  const todayUtc = toUtcDay(today)

  const row = await db.$transaction(async (tx) => {
    const existing = await tx.wallet.findUnique({ where: { userId } })
    if (!existing) {
      return tx.wallet.create({
        data: {
          userId,
          gems: 0,
          hearts: HEARTS_MAX_DEFAULT,
          heartsMax: HEARTS_MAX_DEFAULT,
          heartsResetAt: todayUtc,
          streakFreezes: 0,
        },
      })
    }
    if (!needsDailyHeartRefill(existing.heartsResetAt, today)) {
      return existing
    }
    return tx.wallet.update({
      where: { userId },
      data: {
        hearts: existing.heartsMax,
        heartsResetAt: todayUtc,
      },
    })
  })

  return {
    gems: row.gems,
    hearts: row.hearts,
    heartsMax: row.heartsMax,
    streakFreezes: row.streakFreezes,
    heartsResetAt: row.heartsResetAt ? toIsoDate(row.heartsResetAt) : null,
  }
}

// Apply a gem delta and write the matching GemTransaction in one tx. Callers
// pre-validate amount sign (positive for earn, negative for spend). Returns
// the new wallet snapshot so the UI can reflect it without a second read.
export async function awardGems(args: {
  userId: string
  amount: number
  reason: GemReason
  meta?: Record<string, unknown>
}): Promise<WalletSnapshot> {
  const { userId, amount, reason, meta } = args
  if (amount === 0) return getWallet(userId)
  // Ensure wallet exists + daily refill ran before we touch gems.
  await getWallet(userId)

  await db.$transaction([
    db.wallet.update({
      where: { userId },
      data: { gems: { increment: amount } },
    }),
    db.gemTransaction.create({
      data: {
        userId,
        delta: amount,
        reason,
        meta: meta ? (meta as never) : undefined,
      },
    }),
  ])

  return getWallet(userId)
}

// Award gems for a step transition. Callers (the exercises pipeline)
// compute `firstCompletion` (was not-completed before this attempt, is
// completed now) and `firstTry` (this attempt's `Progress.attempts` is 1)
// from the upserted Progress row. We only award on `firstCompletion` —
// repeated checks on an already-completed step earn nothing. The split
// between first-try and any-completion rewards keeps the incentive on
// reading carefully before slamming Check.
export async function awardGemsForStepCompletion(args: {
  userId: string
  stepId: string
  stepLocale: string
  firstCompletion: boolean
  firstTry: boolean
}): Promise<WalletSnapshot | null> {
  if (!args.firstCompletion) return null
  const amount = args.firstTry
    ? GEM_REWARD["step-first-try"]
    : GEM_REWARD["step-completed-any"]
  const reason: GemReason = args.firstTry ? "step-first-try" : "step-completed-any"
  return awardGems({
    userId: args.userId,
    amount,
    reason,
    meta: { stepId: args.stepId, stepLocale: args.stepLocale },
  })
}
