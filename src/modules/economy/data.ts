// Max simultaneously-held hearts. Hearts regenerate one at a time
// (see HEART_REGEN_INTERVAL_MS) — they do NOT refill all at once on a
// calendar boundary. Sized so a focused study session doesn't run out
// while still bounding cost.
export const HEARTS_MAX_DEFAULT = 5

// How long one heart takes to regenerate, in milliseconds. Full empty → max
// takes HEARTS_MAX_DEFAULT × this interval (currently 10 hours from 0 to 5).
// 2 hours per heart makes the budget meaningful without being punitive on
// the next-day return.
export const HEART_REGEN_INTERVAL_MS = 2 * 60 * 60 * 1000

// Gem rewards per source. Tuning happens after we have a week of
// GemTransaction data — until then these are deliberate guesses calibrated
// so completing a track end-to-end first-try lands around 110-130 gems
// (a Track 1 capstone at 30 should feel earnable, not grindy).
export const GEM_REWARD = {
  "step-first-try": 3,
  "step-completed-any": 1,
  "lesson-cleared": 2,
  "course-cleared": 10,
  "track-cleared": 50,
  // Capstone bonus stacks on top of "track-cleared" when the final course
  // of the track is flagged `boss: true` in TRACK_DISPLAY_META.
  "capstone-cleared": 25,
  "streak-7d": 10,
  "streak-30d": 50,
  "daily-quest": 5,
} as const

// Gem costs for spendable items. NOTE: deliberately excludes anything that
// would let a user skip learning (no `skip-step`, no `auto-solve`, no
// `buy-answer`, no `unlimited-hints`, no `capstone-paid`). Hints are part
// of the step itself and free; the rubric is the product. If a future PR
// adds anything that trades gems for skipping evaluation, push back.
export const GEM_COST = {
  "streak-freeze-bought": 15,
  "ask-crew": 5,
  "hearts-refill": 10,
  "hearts-pack": 25,
} as const

// Per-heart refill price. Multiply by hearts being refilled.
export const HEART_REFILL_GEM_COST = 1

// Shop item catalog (power-ups only). Order here is display order. The
// `slug` is the public identifier the purchase action accepts. Anything
// that would let a user skip evaluation is intentionally absent — see the
// GEM_COST comment above.
export const SHOP_ITEMS = [
  {
    slug: "streak-freeze",
    kind: "power-up",
    costReason: "streak-freeze-bought",
  },
  {
    slug: "heart-refill",
    kind: "power-up",
    costReason: "hearts-refill",
  },
  {
    slug: "heart-pack",
    kind: "power-up",
    costReason: "hearts-pack",
  },
] as const

export type ShopItemSlug = (typeof SHOP_ITEMS)[number]["slug"]
