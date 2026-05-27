import "server-only"

import { db } from "@/server/db"

import {
  GEM_COST,
  GEM_REWARD,
  HEART_REGEN_INTERVAL_MS,
  HEARTS_MAX_DEFAULT,
  SHOP_ITEMS,
} from "./data"
import type { ShopItemSlug } from "./data"
import { advanceNextHeartAt, computeRegenTicks, toUtcDay } from "./lib"
import type {
  GemReason,
  HeartGainReason,
  HeartLossReason,
  StreakFreezeReason,
  WalletSnapshot,
} from "./types"

// Read the user's wallet. Creates the row lazily on first read; on every
// read, runs the time-based heart regen: counts how many full
// HEART_REGEN_INTERVAL_MS windows have elapsed since `nextHeartAt`, credits
// that many hearts (capped at heartsMax), and advances `nextHeartAt`
// accordingly. The regen happens inside a tx so two concurrent reads can't
// double-credit. Each credited tick is logged to HeartTransaction.
export async function getWallet(userId: string): Promise<WalletSnapshot> {
  const today = new Date()

  let regenTicks = 0
  const row = await db.$transaction(async (tx) => {
    const existing = await tx.wallet.findUnique({ where: { userId } })
    if (!existing) {
      return tx.wallet.create({
        data: {
          userId,
          gems: 0,
          hearts: HEARTS_MAX_DEFAULT,
          heartsMax: HEARTS_MAX_DEFAULT,
          nextHeartAt: null,
          streakFreezes: 0,
        },
      })
    }
    const ticks = computeRegenTicks({
      hearts: existing.hearts,
      heartsMax: existing.heartsMax,
      nextHeartAt: existing.nextHeartAt,
      now: today,
      intervalMs: HEART_REGEN_INTERVAL_MS,
    })
    if (ticks === 0) return existing
    regenTicks = ticks
    const nextHearts = Math.min(existing.heartsMax, existing.hearts + ticks)
    const nextTimestamp = advanceNextHeartAt({
      hearts: nextHearts,
      heartsMax: existing.heartsMax,
      nextHeartAt: existing.nextHeartAt!,
      ticksApplied: ticks,
      intervalMs: HEART_REGEN_INTERVAL_MS,
    })
    return tx.wallet.update({
      where: { userId },
      data: { hearts: nextHearts, nextHeartAt: nextTimestamp },
    })
  })

  if (regenTicks > 0) {
    await db.heartTransaction.create({
      data: { userId, delta: regenTicks, reason: "regen" satisfies HeartGainReason },
    })
  }

  return {
    gems: row.gems,
    hearts: row.hearts,
    heartsMax: row.heartsMax,
    streakFreezes: row.streakFreezes,
    nextHeartAt: row.nextHeartAt ? row.nextHeartAt.toISOString() : null,
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

// ---------- Stripe-credited gems ----------
//
// Called by the Stripe webhook after `checkout.session.completed`. Wraps
// `awardGems` with idempotency: the Stripe event id is inserted into
// `StripeWebhookEvent` first, and a duplicate-PK violation is treated as
// "already processed, do nothing". Returning `{ alreadyProcessed: true }`
// lets the webhook still ack 200 OK so Stripe stops retrying.
export type StripeCreditResult =
  | { ok: true; alreadyProcessed: false; wallet: WalletSnapshot }
  | { ok: true; alreadyProcessed: true }
  | { ok: false; error: "no_user" }

export async function creditGemsFromStripe(args: {
  // Stripe event id (`evt_…`). Idempotency key — the same event delivered
  // twice (a retry on a 5xx, a webhook resend) becomes a no-op.
  eventId: string
  eventType: string
  userId: string
  gems: number
  // Stripe session id, pack slug, payment_intent id, etc. Stored on the
  // GemTransaction.meta so we can trace a credit back to the Stripe row.
  meta: Record<string, unknown>
}): Promise<StripeCreditResult> {
  const userExists = await db.user.findUnique({
    where: { id: args.userId },
    select: { id: true },
  })
  if (!userExists) return { ok: false, error: "no_user" }

  // Ensure the wallet row + daily refill ran before the atomic credit. This
  // is the only outside-tx write; getWallet itself is idempotent.
  await getWallet(args.userId)

  // Atomic claim-and-credit: the StripeWebhookEvent insert, the wallet
  // increment, and the GemTransaction ledger all live in one transaction so
  // either every effect lands or none of them do. Previous design wrote the
  // event row first and credited gems separately, which meant a crash
  // between the two left the event marked processed with zero gems — paid,
  // unfulfilled. The Stripe event id has @id (PK), so a duplicate insert
  // raises P2002 which we narrow on and treat as "already processed".
  try {
    await db.$transaction([
      db.stripeWebhookEvent.create({
        data: { id: args.eventId, type: args.eventType },
      }),
      db.wallet.update({
        where: { userId: args.userId },
        data: { gems: { increment: args.gems } },
      }),
      db.gemTransaction.create({
        data: {
          userId: args.userId,
          delta: args.gems,
          reason: "stripe-pack",
          meta: args.meta as never,
        },
      }),
    ])
  } catch (err) {
    if (isPrismaUniqueViolation(err)) {
      // Duplicate delivery — earlier worker already credited. Safe ack.
      return { ok: true, alreadyProcessed: true }
    }
    throw err
  }

  return { ok: true, alreadyProcessed: false, wallet: await getWallet(args.userId) }
}

// Narrow guard for Prisma's known unique-constraint violation. We avoid
// importing the full Prisma namespace just for the error class.
function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: unknown }).code === "P2002"
  )
}

// ---------- Stripe refunds ----------
//
// Called by the Stripe webhook on `charge.refunded` / `charge.dispute.created`.
// We decrement the user's gem balance by the refunded amount, capped at zero
// so a user who already spent gems can't go negative. The reversal is keyed
// by the Stripe event id (same StripeWebhookEvent table) so a retried
// refund webhook is a no-op. The GemTransaction.meta carries the original
// payment_intent / charge id for traceability.
export type StripeRefundResult =
  | { ok: true; alreadyProcessed: false; wallet: WalletSnapshot }
  | { ok: true; alreadyProcessed: true }
  | { ok: false; error: "no_user" | "no_credit" }

export async function refundGemsFromStripe(args: {
  eventId: string
  eventType: string
  userId: string
  // How many gems to claw back. Webhook caller derives this from the original
  // checkout session metadata (the pack the user bought) — not from a Stripe
  // amount, since the gem-to-USD ratio isn't 1:1.
  gems: number
  meta: Record<string, unknown>
}): Promise<StripeRefundResult> {
  const userExists = await db.user.findUnique({
    where: { id: args.userId },
    select: { id: true },
  })
  if (!userExists) return { ok: false, error: "no_user" }

  await getWallet(args.userId)

  try {
    const reversed = await db.$transaction(async (tx) => {
      await tx.stripeWebhookEvent.create({
        data: { id: args.eventId, type: args.eventType },
      })
      // Snapshot the current balance so the clawback can't go negative even
      // if the user already spent most of the refunded gems.
      const w = await tx.wallet.findUnique({
        where: { userId: args.userId },
        select: { gems: true },
      })
      if (!w) return 0
      const clawback = Math.min(w.gems, args.gems)
      if (clawback === 0) return 0
      await tx.wallet.update({
        where: { userId: args.userId },
        data: { gems: { decrement: clawback } },
      })
      await tx.gemTransaction.create({
        data: {
          userId: args.userId,
          delta: -clawback,
          reason: "stripe-refund",
          meta: { ...args.meta, requestedClawback: args.gems } as never,
        },
      })
      return clawback
    })

    if (reversed === 0) return { ok: false, error: "no_credit" }
    return {
      ok: true,
      alreadyProcessed: false,
      wallet: await getWallet(args.userId),
    }
  } catch (err) {
    if (isPrismaUniqueViolation(err)) {
      return { ok: true, alreadyProcessed: true }
    }
    throw err
  }
}

// ---------- Shop purchase ----------
//
// Atomic purchase of a power-up. Inside one transaction we:
//   1. Ensure wallet row exists + ran the daily heart refill.
//   2. Re-read with row-level state to validate balance + applicability.
//   3. Apply side effect (++streakFreezes / hearts++ / hearts=max).
//   4. Deduct gems and log GemTransaction.
// Returns a discriminated union the action can render directly.

export type PurchaseResult =
  | { ok: true; wallet: WalletSnapshot }
  | { ok: false; error: "unknown_item" | "insufficient_gems" | "already_full" }

export async function purchaseShopItem(args: {
  userId: string
  slug: ShopItemSlug
}): Promise<PurchaseResult> {
  const item = SHOP_ITEMS.find((i) => i.slug === args.slug)
  if (!item) return { ok: false, error: "unknown_item" }

  const cost = GEM_COST[item.costReason]
  const reason: GemReason = item.costReason

  // Make sure wallet exists + daily refill is current before the tx runs.
  await getWallet(args.userId)

  // Race-safe purchase under default READ COMMITTED. We do the side-effect
  // FIRST with a conditional updateMany so its predicate can never race past
  // a co-purchase (two concurrent heart-refills can't both increment past
  // heartsMax, etc). Then we charge gems with another conditional
  // updateMany; if THAT fails we throw to roll back the side-effect via the
  // surrounding $transaction. Returning a non-throw "ok: false" only happens
  // on `unknown_item` / `insufficient_gems` / `already_full` BEFORE any write.
  type PurchaseTxResult =
    | { ok: true; heartsDelta: number; heartsLedgerReason: HeartGainReason | null; freezesDelta: number }
    | { ok: false; error: "insufficient_gems" | "already_full" }

  // Custom signal to roll back the tx when gem-charge loses the race AFTER
  // we've already applied the side-effect. Caught at the call site.
  class InsufficientGemsAfterEffect extends Error {}

  let result: PurchaseTxResult
  try {
    result = await db.$transaction(async (tx): Promise<PurchaseTxResult> => {
      let heartsDelta = 0
      let heartsLedgerReason: HeartGainReason | null = null
      let freezesDelta = 0

      if (args.slug === "streak-freeze") {
        // No precondition. Increment is atomic on its own.
        await tx.wallet.update({
          where: { userId: args.userId },
          data: { streakFreezes: { increment: 1 } },
        })
        freezesDelta = 1
      } else if (args.slug === "heart-refill") {
        // hearts MUST be strictly less than heartsMax. Field reference keeps
        // the predicate atomic against concurrent refills + regen ticks.
        const added = await tx.wallet.updateMany({
          where: {
            userId: args.userId,
            hearts: { lt: db.wallet.fields.heartsMax },
          },
          data: { hearts: { increment: 1 } },
        })
        if (added.count === 0) {
          return { ok: false, error: "already_full" }
        }
        // If this top-up filled us, stop the regen countdown.
        await tx.wallet.updateMany({
          where: {
            userId: args.userId,
            hearts: { equals: db.wallet.fields.heartsMax },
          },
          data: { nextHeartAt: null },
        })
        heartsDelta = 1
        heartsLedgerReason = "shop-refill"
      } else if (args.slug === "heart-pack") {
        // Snapshot the delta we'll log, then push to max. The predicate keeps
        // it idempotent if another writer raced us to full.
        const current = await tx.wallet.findUnique({
          where: { userId: args.userId },
          select: { hearts: true, heartsMax: true },
        })
        if (!current || current.hearts >= current.heartsMax) {
          return { ok: false, error: "already_full" }
        }
        const filled = await tx.wallet.updateMany({
          where: {
            userId: args.userId,
            hearts: { lt: db.wallet.fields.heartsMax },
          },
          data: { hearts: current.heartsMax, nextHeartAt: null },
        })
        if (filled.count === 0) {
          return { ok: false, error: "already_full" }
        }
        heartsDelta = current.heartsMax - current.hearts
        heartsLedgerReason = "shop-pack"
      }

      // Charge gems atomically. If gems dropped below cost in flight (rare
      // — another tx spent them concurrently), throw to roll back the side
      // effect we just applied.
      const charged = await tx.wallet.updateMany({
        where: { userId: args.userId, gems: { gte: cost } },
        data: { gems: { decrement: cost } },
      })
      if (charged.count === 0) {
        throw new InsufficientGemsAfterEffect()
      }

      await tx.gemTransaction.create({
        data: {
          userId: args.userId,
          delta: -cost,
          reason,
          meta: { item: args.slug } as never,
        },
      })
      if (heartsDelta > 0 && heartsLedgerReason) {
        await tx.heartTransaction.create({
          data: { userId: args.userId, delta: heartsDelta, reason: heartsLedgerReason },
        })
      }
      if (freezesDelta > 0) {
        await tx.streakFreezeTransaction.create({
          data: {
            userId: args.userId,
            delta: freezesDelta,
            reason: "bought" satisfies StreakFreezeReason,
          },
        })
      }
      return { ok: true, heartsDelta, heartsLedgerReason, freezesDelta }
    })
  } catch (err) {
    if (err instanceof InsufficientGemsAfterEffect) {
      return { ok: false, error: "insufficient_gems" }
    }
    throw err
  }

  if (!result.ok) return result
  const wallet = await getWallet(args.userId)
  return { ok: true, wallet }
}

// ---------- Purchase tracking ----------
//
// The shop UI surfaces two slices of GemTransaction history:
//
//   - todayPurchaseCounts: per-slug counts for "today (UTC)" — used to render
//     the "Comprado hoy ×N" badge on each item card.
//   - getRecentPurchases: last N negative-delta transactions, with slug
//     extracted from meta.item, to render a short history footer.
//
// Both queries scan GemTransaction.userId+createdAt (covered by the
// composite index defined on the model). Cheap reads.

export type ShopHistoryEntry = {
  id: string
  slug: ShopItemSlug | null
  cost: number
  createdAt: Date
}

export async function getTodayPurchaseCounts(
  userId: string,
): Promise<Record<ShopItemSlug, number>> {
  const counts: Record<string, number> = {}
  for (const item of SHOP_ITEMS) counts[item.slug] = 0

  const startOfDay = toUtcDay(new Date())
  const rows = await db.gemTransaction.findMany({
    where: {
      userId,
      delta: { lt: 0 },
      createdAt: { gte: startOfDay },
    },
    select: { meta: true },
  })

  for (const row of rows) {
    const meta = row.meta as { item?: string } | null
    const slug = meta?.item
    if (slug && slug in counts) counts[slug] += 1
  }

  return counts as Record<ShopItemSlug, number>
}

export async function getRecentPurchases(
  userId: string,
  limit = 5,
): Promise<ShopHistoryEntry[]> {
  const rows = await db.gemTransaction.findMany({
    where: { userId, delta: { lt: 0 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, delta: true, meta: true, createdAt: true },
  })

  const validSlugs = new Set(SHOP_ITEMS.map((i) => i.slug as string))
  return rows.map((r) => {
    const meta = r.meta as { item?: string } | null
    const slug = meta?.item && validSlugs.has(meta.item) ? (meta.item as ShopItemSlug) : null
    return {
      id: r.id,
      slug,
      cost: -r.delta,
      createdAt: r.createdAt,
    }
  })
}

// Spend 1 heart atomically. Race-safe: uses a conditional updateMany so two
// concurrent requests with hearts=1 can't both succeed (Postgres serializes
// the update, the second one matches 0 rows and we bail). When the wallet
// drops below heartsMax for the first time, kick off the regen countdown
// by setting `nextHeartAt`. Logs a HeartTransaction on every successful
// spend; no-op when the user is already at 0.
export async function spendHeart(args: {
  userId: string
  reason: HeartLossReason
}): Promise<number> {
  // Run regen-on-read first so we don't refuse a spend that the regen
  // tick should have made available.
  await getWallet(args.userId)

  const now = new Date()
  const nextAt = new Date(now.getTime() + HEART_REGEN_INTERVAL_MS)

  // Single transaction: decrement hearts and arm `nextHeartAt` together so
  // two concurrent spends can't race past the arming step. The arming
  // updateMany is a no-op when nextHeartAt is already set (regen already
  // ticking) or when this spend bottomed out at heartsMax (impossible post
  // decrement, but the predicate keeps it correct if heartsMax shifts).
  const [decResult] = await db.$transaction([
    db.wallet.updateMany({
      where: { userId: args.userId, hearts: { gt: 0 } },
      data: { hearts: { decrement: 1 } },
    }),
    db.wallet.updateMany({
      where: {
        userId: args.userId,
        nextHeartAt: null,
        hearts: { lt: db.wallet.fields.heartsMax },
      },
      data: { nextHeartAt: nextAt },
    }),
  ])
  if (decResult.count === 0) return 0

  await db.heartTransaction.create({
    data: { userId: args.userId, delta: -1, reason: args.reason },
  })

  const w = await db.wallet.findUnique({
    where: { userId: args.userId },
    select: { hearts: true },
  })
  return w?.hearts ?? 0
}

// Convenience: does the user have at least one heart? Used by the 0-hearts
// guard on exercise steps.
export async function hasHearts(userId: string): Promise<boolean> {
  const wallet = await getWallet(userId)
  return wallet.hearts > 0
}

// Spend `amount` gems atomically. Race-safe via conditional updateMany so two
// concurrent requests can't both succeed when the wallet is too low. Returns
// the new gem count on success, or null when the wallet didn't have enough
// (caller must surface this to the user — the deduct never happened). Logs a
// GemTransaction on success only. Mirrors spendHeart.
export async function spendGems(args: {
  userId: string
  amount: number
  reason: GemReason
  meta?: Record<string, unknown>
}): Promise<number | null> {
  const { userId, amount, reason, meta } = args
  if (amount <= 0) throw new Error("spendGems: amount must be positive")

  // Run daily refill on read first so a stale wallet doesn't refuse a spend
  // it could otherwise afford.
  await getWallet(userId)

  const decResult = await db.wallet.updateMany({
    where: { userId, gems: { gte: amount } },
    data: { gems: { decrement: amount } },
  })
  if (decResult.count === 0) return null

  const w = await db.wallet.findUnique({
    where: { userId },
    select: { gems: true },
  })
  await db.gemTransaction.create({
    data: {
      userId,
      delta: -amount,
      reason,
      meta: meta ? (meta as never) : undefined,
    },
  })
  return w?.gems ?? 0
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
