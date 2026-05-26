// Initial daily LLM-judge eval budget. Refilled to this value once per UTC
// day on the user's first wallet read. Sized so a focused study session
// (~5-8 LLM-graded checks) doesn't run out, while still bounding cost.
export const HEARTS_MAX_DEFAULT = 5

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
  "streak-7d": 10,
  "streak-30d": 50,
  "daily-quest": 5,
} as const

// Gem costs for spendable items. NOTE: deliberately excludes anything that
// would let a user skip learning (no `skip-step`, no `auto-solve`, no
// `buy-answer`, no `unlimited-hints`). Hints are part of the step itself
// and free; the rubric is the product. If a future PR adds anything that
// trades gems for skipping evaluation, push back.
export const GEM_COST = {
  "streak-freeze-bought": 15,
  "capstone-paid": 30,
  "ask-crew": 5,
} as const

// Per-heart refill price. Multiply by hearts being refilled.
export const HEART_REFILL_GEM_COST = 1
