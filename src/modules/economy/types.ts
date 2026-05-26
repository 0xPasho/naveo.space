// Snapshot of the user's spendable economy. Returned by `service.getWallet`;
// derived fields are computed at read time so the DB never holds stale data.
export type WalletSnapshot = {
  gems: number
  hearts: number
  heartsMax: number
  streakFreezes: number
  // Wall-clock ISO timestamp when the next heart will regen, or null when
  // hearts == heartsMax. Used by the UI to render a countdown + the
  // grow-in animation on the heart that's about to drop.
  nextHeartAt: string | null
}

// Identifier of the rule that produced a gem mutation. Stored on
// GemTransaction.reason so we can recalibrate from production data later
// without grep'ing free-form strings.
export type GemReason =
  | "step-first-try"
  | "step-completed-any"
  | "lesson-cleared"
  | "course-cleared"
  | "track-cleared"
  | "capstone-cleared"
  | "streak-7d"
  | "streak-30d"
  | "daily-quest"
  | "streak-freeze-bought"
  | "ask-crew"
  | "hearts-refill"
  | "hearts-pack"
  | "stripe-pack" // real-money gem pack purchased through Stripe Checkout

// Why a heart was spent. Persisted on HeartTransaction.reason.
export type HeartLossReason =
  | "track-start" // first Comprobar in a track (one-shot per user per track)
  | "exercise-fail" // a Comprobar that didn't pass the rubric
  | "hint-used" // a hint was revealed for the first time

// Why a heart was credited. Persisted on HeartTransaction.reason for +N rows.
export type HeartGainReason =
  | "regen" // time-based passive regen (computed inside getWallet)
  | "shop-refill" // one-shot heart-refill purchase
  | "shop-pack" // full-pack heart-pack purchase

// Why a streak shield was added or removed. Persisted on
// StreakFreezeTransaction.reason. `bought` paired with a +1 delta;
// `consumed-streak-save` paired with a negative delta written by
// gamification/service.recordActivity when shields bridged a missed-day gap.
export type StreakFreezeReason =
  | "bought"
  | "consumed-streak-save"
