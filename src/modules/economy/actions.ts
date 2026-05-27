"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { currentUser } from "@/server/auth"
import { getOrCreateUser } from "@/modules/users/service"

import { SHOP_ITEMS } from "./data"
import type { ShopItemSlug } from "./data"
import { GEM_PACKS, getGemPack } from "./gem-packs"
import type { GemPackSlug } from "./gem-packs"
import { purchaseShopItem } from "./service"
import type { PurchaseResult } from "./service"

const SHOP_SLUGS = SHOP_ITEMS.map((i) => i.slug) as [
  ShopItemSlug,
  ...ShopItemSlug[],
]

const PurchaseInputSchema = z.object({
  slug: z.enum(SHOP_SLUGS),
})

export type PurchaseActionResult = PurchaseResult | { ok: false; error: "unauthorized" | "invalid_input" }

// Validate, route to purchaseShopItem, revalidate the shop + any view that
// surfaces wallet (HUD reads it server-side). Returns the same discriminated
// union the service produces — UI maps error codes to translated strings.
export async function purchaseShopItemAction(input: {
  slug: string
}): Promise<PurchaseActionResult> {
  const user = await currentUser()
  if (!user) return { ok: false, error: "unauthorized" }

  const parsed = PurchaseInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const result = await purchaseShopItem({
    userId: user.id,
    slug: parsed.data.slug,
  })

  if (result.ok) {
    revalidatePath("/shop")
    revalidatePath("/", "layout")
  }

  return result
}

// ---------------------------------------------------------------------------
// Gem packs — Stripe Checkout
//
// Real-money purchases. Power-ups above are paid in GEMS; gem packs are
// paid in USD via Stripe Checkout. This action mints a Checkout Session
// and returns its hosted-page URL — the client redirects the browser to
// it. Credit is granted by the Stripe webhook (separate route handler,
// not implemented yet); this action does NOT touch the wallet directly,
// so a network-interrupted Checkout that the user never completes can't
// leak gems.
//
// Until STRIPE_SECRET_KEY is set the action returns `stripe_not_configured`
// and the UI shows a "coming soon" toast. Setting the env in production
// flips this on without code changes; setting a Stripe webhook (and
// implementing the route handler) flips on actual gem crediting.
// ---------------------------------------------------------------------------

const GEM_PACK_SLUGS = GEM_PACKS.map((p) => p.slug) as [
  GemPackSlug,
  ...GemPackSlug[],
]

const GemCheckoutInputSchema = z.object({
  slug: z.enum(GEM_PACK_SLUGS),
})

export type CreateGemCheckoutResult =
  | { ok: true; url: string }
  | {
      ok: false
      error:
        | "unauthorized"
        | "invalid_input"
        | "stripe_not_configured"
        | "stripe_error"
    }

export async function createGemCheckoutAction(input: {
  slug: string
}): Promise<CreateGemCheckoutResult> {
  const clerk = await currentUser()
  if (!clerk) return { ok: false, error: "unauthorized" }

  const parsed = GemCheckoutInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) return { ok: false, error: "stripe_not_configured" }

  const user = await getOrCreateUser(clerk.id)
  const pack = getGemPack(parsed.data.slug)
  if (!pack) return { ok: false, error: "invalid_input" }

  // Origin for Stripe success/cancel URLs MUST come from an env var, not
  // from request headers. A poisoned `Host` header on a misconfigured proxy
  // would otherwise let an attacker craft a Checkout link whose redirect
  // points at their domain — a high-credibility phishing vector since the
  // user just paid. NEXT_PUBLIC_APP_URL is the canonical origin for the
  // deploy and must be set before Stripe checkout is enabled.
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? null
  if (!configuredUrl) {
    console.error(
      "[stripe] NEXT_PUBLIC_APP_URL not set; refusing to create Checkout",
    )
    return { ok: false, error: "stripe_not_configured" }
  }
  const origin = configuredUrl.replace(/\/+$/, "")

  // Stripe's Checkout Sessions API is form-encoded with bracket-notation
  // nested keys. Using `fetch` directly avoids adding the `stripe` SDK as
  // a dependency for what is, today, a single POST.
  const body = new URLSearchParams()
  body.set("mode", "payment")
  body.set(
    "success_url",
    `${origin}/shop?gems=success&session_id={CHECKOUT_SESSION_ID}`,
  )
  body.set("cancel_url", `${origin}/shop?gems=cancel`)
  body.set("client_reference_id", user.id)
  body.set("metadata[user_id]", user.id)
  body.set("metadata[gem_amount]", String(pack.gems))
  body.set("metadata[pack_slug]", pack.slug)
  body.set("line_items[0][price_data][currency]", "usd")
  body.set(
    "line_items[0][price_data][product_data][name]",
    `Naveo · ${pack.gems} gemas`,
  )
  body.set("line_items[0][price_data][unit_amount]", String(pack.priceCents))
  body.set("line_items[0][quantity]", "1")

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${stripeKey}:`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })
    if (!res.ok) {
      console.error("[stripe] createCheckoutSession failed", await res.text())
      return { ok: false, error: "stripe_error" }
    }
    const data = (await res.json()) as { url?: string | null }
    if (!data.url) return { ok: false, error: "stripe_error" }
    return { ok: true, url: data.url }
  } catch (err) {
    console.error("[stripe] createCheckoutSession threw", err)
    return { ok: false, error: "stripe_error" }
  }
}
