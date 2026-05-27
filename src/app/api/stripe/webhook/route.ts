import "server-only"

import crypto from "node:crypto"

import type { NextRequest } from "next/server"

import {
  creditGemsFromStripe,
  refundGemsFromStripe,
} from "@/modules/economy/service"
import { GEM_PACKS } from "@/modules/economy/gem-packs"
import { db } from "@/server/db"

// Server-side catalog lookup. Stripe metadata is trusted only for ids
// (pack_slug, user_id) — the gem amount itself must come from our own
// catalog so a tampered or hand-crafted Checkout Session can't credit
// arbitrary gems even with a valid signature.
const gemsForPackSlug = (slug: string | null | undefined): number | null => {
  if (!slug) return null
  const pack = GEM_PACKS.find((p) => p.slug === slug)
  return pack ? pack.gems : null
}

// Force Node.js runtime — the webhook needs `crypto.timingSafeEqual` and
// `Buffer`, neither of which are exposed by Edge.
export const runtime = "nodejs"
// Webhook payloads are not user-personalized; opting out of any
// route-segment caching keeps Stripe retries from hitting cached
// responses on accident.
export const dynamic = "force-dynamic"

// Stripe's recommended tolerance is 5 minutes. Anything older is treated
// as a replay attempt and rejected. Don't lower to 0 (disables freshness
// checks entirely per Stripe docs).
const TOLERANCE_SECONDS = 300

// Parse the `Stripe-Signature` header. Format is documented at
// https://docs.stripe.com/webhooks/signatures:
//   t=<unix_timestamp>,v1=<hex>,v0=<hex>
// `v1` is the only scheme we accept; `v0` is a test-mode legacy scheme and
// Stripe's own SDK ignores it.
function parseStripeSignature(header: string): {
  timestamp: number
  v1Signatures: string[]
} | null {
  const parts = header.split(",")
  let timestamp: number | null = null
  const v1Signatures: string[] = []
  for (const part of parts) {
    const [key, value] = part.split("=")
    if (!key || !value) continue
    if (key === "t") {
      const parsed = Number.parseInt(value, 10)
      if (!Number.isNaN(parsed)) timestamp = parsed
    } else if (key === "v1") {
      v1Signatures.push(value)
    }
  }
  if (timestamp === null || v1Signatures.length === 0) return null
  return { timestamp, v1Signatures }
}

// HMAC-SHA256 of `${timestamp}.${rawBody}` with the webhook secret,
// constant-time compared against every `v1` signature in the header.
// During key rotation Stripe sends one v1 per active secret, so we accept
// the first match against THIS endpoint's secret.
function verifySignature(args: {
  rawBody: string
  header: string
  secret: string
  toleranceSeconds: number
}): boolean {
  const parsed = parseStripeSignature(args.header)
  if (!parsed) return false

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parsed.timestamp) > args.toleranceSeconds) return false

  const signedPayload = `${parsed.timestamp}.${args.rawBody}`
  const expected = crypto
    .createHmac("sha256", args.secret)
    .update(signedPayload, "utf8")
    .digest("hex")
  const expectedBuf = Buffer.from(expected, "utf8")

  for (const candidate of parsed.v1Signatures) {
    const candidateBuf = Buffer.from(candidate, "utf8")
    if (candidateBuf.length !== expectedBuf.length) continue
    if (crypto.timingSafeEqual(candidateBuf, expectedBuf)) return true
  }
  return false
}

// Stripe event envelope — only the fields we care about. Stripe sends
// many more; ignoring them is fine because we never re-emit the payload.
type StripeEvent = {
  id: string
  type: string
  data: { object: StripeCheckoutSession | StripeCharge | StripeDispute }
}

type StripeCheckoutSession = {
  id: string
  payment_status?: "paid" | "unpaid" | "no_payment_required"
  client_reference_id?: string | null
  payment_intent?: string | null
  metadata?: {
    user_id?: string
    gem_amount?: string
    pack_slug?: string
  } | null
}

type StripeCharge = {
  id: string
  payment_intent?: string | null
  amount?: number
  amount_refunded?: number
  refunded?: boolean
}

type StripeDispute = {
  id: string
  charge?: string | null
  payment_intent?: string | null
  amount?: number
}

// Process a single Checkout Session that Stripe has confirmed as paid.
// Stripe docs (Fulfill Checkout):
//   "Only fulfill when payment_status is NOT 'unpaid'"
// Returns 200 OK on success OR on already-processed; only verification
// failures return 4xx so Stripe stops retrying obvious tampering.
async function fulfillCheckout(event: StripeEvent): Promise<void> {
  const session = event.data.object as StripeCheckoutSession
  if (session.payment_status === "unpaid") {
    // ACH / bank transfers arrive `unpaid` on
    // checkout.session.completed; the async_payment_succeeded event will
    // fire later with payment_status="paid". Skip this delivery cleanly.
    return
  }

  const userId =
    session.metadata?.user_id ?? session.client_reference_id ?? null
  const packSlug = session.metadata?.pack_slug ?? null
  // Prefer the server-side catalog. Fall back to metadata.gem_amount only
  // when pack_slug is missing (legacy sessions), and clamp to a sane upper
  // bound so a tampered metadata can't ever credit more than the largest
  // real pack.
  const catalogGems = gemsForPackSlug(packSlug)
  const metaGemsRaw = session.metadata?.gem_amount
  const metaGems = metaGemsRaw ? Number.parseInt(metaGemsRaw, 10) : NaN
  const maxKnownGems = GEM_PACKS.reduce((m, p) => Math.max(m, p.gems), 0)
  const gems =
    catalogGems !== null
      ? catalogGems
      : Number.isFinite(metaGems) && metaGems > 0 && metaGems <= maxKnownGems
        ? metaGems
        : NaN
  if (!userId || !Number.isFinite(gems) || gems <= 0) {
    // Malformed session — likely created by something other than our
    // own checkout action. Log and bail without crediting.
    console.error("[stripe] webhook: missing user_id / pack_slug", {
      eventId: event.id,
      sessionId: session.id,
      packSlug,
      metaGems: metaGemsRaw,
    })
    return
  }
  if (catalogGems !== null && Number.isFinite(metaGems) && metaGems !== catalogGems) {
    // Metadata disagreed with the catalog — log loudly so we notice
    // tampering attempts, then trust the catalog.
    console.error("[stripe] webhook: gem_amount mismatch — using catalog", {
      eventId: event.id,
      sessionId: session.id,
      packSlug,
      catalogGems,
      metaGems,
    })
  }

  const result = await creditGemsFromStripe({
    eventId: event.id,
    eventType: event.type,
    userId,
    gems,
    meta: {
      stripeSessionId: session.id,
      stripePaymentIntent: session.payment_intent ?? null,
      packSlug: session.metadata?.pack_slug ?? null,
    },
  })

  if (!result.ok) {
    console.error("[stripe] webhook: creditGemsFromStripe failed", {
      eventId: event.id,
      sessionId: session.id,
      error: result.error,
    })
  }
}

// Look up the original gem credit that matches a refunded/disputed charge so
// we know whose wallet to claw back and by how much. We persisted
// `stripePaymentIntent` on GemTransaction.meta at credit time; refunds and
// disputes both reference the same payment_intent.
async function findOriginalCredit(
  paymentIntent: string,
): Promise<{ userId: string; gems: number; packSlug: string | null } | null> {
  // GemTransaction.meta is Json. We can't index it directly without a GIN
  // index, but the volume of stripe-pack credits is bounded and the userId
  // filter narrows the scan — still cheap on the index over (userId,
  // createdAt). For now we accept a full scan filtered by reason; if this
  // ever becomes a bottleneck, add a dedicated StripePurchase mapping.
  const rows = await db.gemTransaction.findMany({
    where: { reason: "stripe-pack" },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { userId: true, delta: true, meta: true },
  })
  for (const row of rows) {
    const meta = row.meta as { stripePaymentIntent?: string | null; packSlug?: string | null } | null
    if (meta?.stripePaymentIntent === paymentIntent) {
      return { userId: row.userId, gems: row.delta, packSlug: meta.packSlug ?? null }
    }
  }
  return null
}

// Process a refund or chargeback. Stripe emits `charge.refunded` on partial
// or full refunds, and `charge.dispute.funds_withdrawn` when a dispute pulls
// funds. We claw back the gems by the same amount we originally credited.
// Partial refunds: today we claw back the FULL pack; if/when partial gem
// refunds matter, prorate by amount_refunded / amount.
async function fulfillReversal(event: StripeEvent): Promise<void> {
  let paymentIntent: string | null = null
  if (event.type === "charge.refunded") {
    const charge = event.data.object as StripeCharge
    paymentIntent = charge.payment_intent ?? null
  } else if (
    event.type === "charge.dispute.created" ||
    event.type === "charge.dispute.funds_withdrawn"
  ) {
    const dispute = event.data.object as StripeDispute
    paymentIntent = dispute.payment_intent ?? null
  }
  if (!paymentIntent) {
    console.error("[stripe] webhook: reversal without payment_intent", {
      eventId: event.id,
      type: event.type,
    })
    return
  }

  const original = await findOriginalCredit(paymentIntent)
  if (!original) {
    console.error("[stripe] webhook: reversal for unknown payment_intent", {
      eventId: event.id,
      paymentIntent,
    })
    return
  }

  const result = await refundGemsFromStripe({
    eventId: event.id,
    eventType: event.type,
    userId: original.userId,
    gems: original.gems,
    meta: {
      stripePaymentIntent: paymentIntent,
      packSlug: original.packSlug,
      reversalType: event.type,
    },
  })

  if (!result.ok) {
    console.error("[stripe] webhook: refundGemsFromStripe failed", {
      eventId: event.id,
      paymentIntent,
      error: result.error,
    })
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    // Misconfigured deploys should fail loudly so the env hole is obvious
    // in Stripe's dashboard delivery view (5xx → red in the UI).
    console.error("[stripe] webhook: STRIPE_WEBHOOK_SECRET not set")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return new Response("Missing Stripe-Signature", { status: 400 })
  }

  // Critical: read the body as the raw byte stream. Any JSON parsing or
  // re-encoding will invalidate the HMAC, since whitespace and key order
  // matter for the signed payload.
  const rawBody = await req.text()

  const ok = verifySignature({
    rawBody,
    header: signature,
    secret,
    toleranceSeconds: TOLERANCE_SECONDS,
  })
  if (!ok) {
    return new Response("Invalid signature", { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(rawBody) as StripeEvent
  } catch {
    return new Response("Malformed JSON", { status: 400 })
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await fulfillCheckout(event)
    } else if (
      event.type === "charge.refunded" ||
      event.type === "charge.dispute.created" ||
      event.type === "charge.dispute.funds_withdrawn"
    ) {
      await fulfillReversal(event)
    }
  } catch (err) {
    // A 5xx response triggers Stripe's retry policy. We bubble the
    // failure so a transient DB error gets retried, but stay tight on
    // the response body so Stripe's UI shows a readable failure.
    console.error("[stripe] webhook: handler threw", { type: event.type, err })
    return new Response("Fulfillment failed", { status: 500 })
  }

  return new Response(null, { status: 200 })
}
