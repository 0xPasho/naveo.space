// Gem packs sold for real money (USD) via Stripe Checkout. The shop's
// power-up items are paid in gems (in-game currency); these packs are how
// you ACQUIRE gems. Prices in cents because Stripe's Checkout API takes
// `unit_amount` as the smallest currency unit.
//
// Order here is display order (small → large). The large pack gets a
// better gems-per-dollar ratio so there's a real reason to buy the bigger
// box, mirroring the Duolingo-style "best value" framing without being
// predatory.
export const GEM_PACKS = [
  {
    slug: "small",
    gems: 100,
    priceCents: 199, // $1.99
  },
  {
    slug: "medium",
    gems: 500,
    priceCents: 799, // $7.99 — labelled "best value" in the UI
    badge: "popular" as const,
  },
  {
    slug: "large",
    gems: 1500,
    priceCents: 1999, // $19.99 — labelled "best deal" in the UI
    badge: "best" as const,
  },
] as const

export type GemPackSlug = (typeof GEM_PACKS)[number]["slug"]

export const getGemPack = (slug: GemPackSlug) =>
  GEM_PACKS.find((p) => p.slug === slug) ?? null

// Cheap formatter for USD prices. Stripe stores cents; the UI shows the
// dollar amount with two decimals. Kept locale-agnostic on purpose —
// pricing stays in USD even on the Spanish locale (it's what Stripe will
// charge regardless of UI language).
export const formatUsd = (cents: number): string =>
  `$${(cents / 100).toFixed(2)}`
