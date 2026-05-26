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

  // Claim the event id. PK collision = another worker / earlier delivery
  // already processed it; bail without crediting again.
  try {
    await db.stripeWebhookEvent.create({
      data: { id: args.eventId, type: args.eventType },
    })
  } catch {
    return { ok: true, alreadyProcessed: true }
  }

  const wallet = await awardGems({
    userId: args.userId,
    amount: args.gems,
    reason: "stripe-pack",
    meta: args.meta,
  })
  return { ok: true, alreadyProcessed: false, wallet }
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

  const result = await db.$transaction(async (tx) => {
    const w = await tx.wallet.findUnique({ where: { userId: args.userId } })
    if (!w) return { ok: false as const, error: "unknown_item" as const }
    if (w.gems < cost) return { ok: false as const, error: "insufficient_gems" as const }

    let updateData: Record<string, unknown> = {}
    let heartsDelta = 0
    let heartsLedgerReason: HeartGainReason | null = null
    let freezesDelta = 0
    if (args.slug === "streak-freeze") {
      updateData = { streakFreezes: { increment: 1 } }
      freezesDelta = 1
    } else if (args.slug === "heart-refill") {
      if (w.hearts >= w.heartsMax) {
        return { ok: false as const, error: "already_full" as const }
      }
      heartsDelta = 1
      heartsLedgerReason = "shop-refill"
      const nextHearts = w.hearts + 1
      updateData = {
        hearts: nextHearts,
        // If this refill tops us up, stop the regen countdown.
        ...(nextHearts >= w.heartsMax ? { nextHeartAt: null } : {}),
      }
    } else if (args.slug === "heart-pack") {
      if (w.hearts >= w.heartsMax) {
        return { ok: false as const, error: "already_full" as const }
      }
      heartsDelta = w.heartsMax - w.hearts
      heartsLedgerReason = "shop-pack"
      updateData = { hearts: w.heartsMax, nextHeartAt: null }
    }

    await tx.wallet.update({
      where: { userId: args.userId },
      data: { ...updateData, gems: { decrement: cost } },
    })
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
    return { ok: true as const }
  })

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
  const decResult = await db.wallet.updateMany({
    where: { userId: args.userId, hearts: { gt: 0 } },
    data: { hearts: { decrement: 1 } },
  })
  if (decResult.count === 0) return 0

  // Read post-decrement state; arm `nextHeartAt` if this spend dropped us
  // below heartsMax and no countdown was running yet.
  const w = await db.wallet.findUnique({ where: { userId: args.userId } })
  if (w && w.hearts < w.heartsMax && w.nextHeartAt === null) {
    await db.wallet.update({
      where: { userId: args.userId },
      data: { nextHeartAt: new Date(now.getTime() + HEART_REGEN_INTERVAL_MS) },
    })
  }

  await db.heartTransaction.create({
    data: { userId: args.userId, delta: -1, reason: args.reason },
  })

  return w?.hearts ?? 0
}

// Convenience: does the user have at least one heart? Used by the 0-hearts
// guard on exercise steps.
export async function hasHearts(userId: string): Promise<boolean> {
  const wallet = await getWallet(userId)
  return wallet.hearts > 0
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
