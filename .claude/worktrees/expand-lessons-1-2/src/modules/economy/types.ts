// Snapshot of the user's spendable economy. Returned by `service.getWallet`;
// derived fields are computed at read time so the DB never holds stale data.
export type WalletSnapshot = {
  gems: number
  hearts: number
  heartsMax: number
  streakFreezes: number
  // UTC ISO date (YYYY-MM-DD) of the last daily heart refill, or null for
  // wallets that haven't been refreshed yet.
  heartsResetAt: string | null
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
  | "streak-7d"
  | "streak-30d"
  | "daily-quest"
  | "streak-freeze-bought"
  | "capstone-paid"
  | "ask-crew"
  | "hearts-refill"
