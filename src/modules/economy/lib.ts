// Truncate a Date to its UTC day boundary. Mirrors gamification/lib.toUtcDay
// — duplicated rather than imported to keep the economy module's `lib.ts`
// self-contained per the project's module rules (pure helpers only).
export const toUtcDay = (d: Date): Date => {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  return out
}

export const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10)

// Compute how many hearts have regenerated since `nextHeartAt` (inclusive).
// Pure math; the caller (getWallet) applies the result and advances the
// timestamp. Returns 0 when:
//   - hearts is already at heartsMax (no regen pending)
//   - nextHeartAt is null (no regen scheduled)
//   - now < nextHeartAt (next tick still in the future)
// Capped at (heartsMax - hearts) so we never overshoot the cap when a user
// has been away for hours.
export const computeRegenTicks = (args: {
  hearts: number
  heartsMax: number
  nextHeartAt: Date | null
  now: Date
  intervalMs: number
}): number => {
  const { hearts, heartsMax, nextHeartAt, now, intervalMs } = args
  if (hearts >= heartsMax) return 0
  if (nextHeartAt === null) return 0
  const diff = now.getTime() - nextHeartAt.getTime()
  if (diff < 0) return 0
  // First tick fires when now >= nextHeartAt (diff >= 0), subsequent ticks
  // each `intervalMs` after that.
  const elapsed = 1 + Math.floor(diff / intervalMs)
  return Math.min(elapsed, heartsMax - hearts)
}

// Given the post-regen hearts state, return the new `nextHeartAt`. Null when
// hearts == heartsMax (regen done); otherwise the previous tick advanced by
// `ticksApplied × intervalMs` so future calls keep ticking on cadence.
export const advanceNextHeartAt = (args: {
  hearts: number
  heartsMax: number
  nextHeartAt: Date
  ticksApplied: number
  intervalMs: number
}): Date | null => {
  const { hearts, heartsMax, nextHeartAt, ticksApplied, intervalMs } = args
  if (hearts >= heartsMax) return null
  return new Date(nextHeartAt.getTime() + ticksApplied * intervalMs)
}
