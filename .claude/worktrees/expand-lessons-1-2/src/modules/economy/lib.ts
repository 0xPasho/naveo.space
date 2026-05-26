// Truncate a Date to its UTC day boundary. Mirrors gamification/lib.toUtcDay
// — duplicated rather than imported to keep the economy module's `lib.ts`
// self-contained per the project's module rules (pure helpers only).
export const toUtcDay = (d: Date): Date => {
  const out = new Date(d)
  out.setUTCHours(0, 0, 0, 0)
  return out
}

export const toIsoDate = (d: Date): string => d.toISOString().slice(0, 10)

// True when the wallet's last heart refill happened on a UTC day strictly
// before `today`. Null `heartsResetAt` (freshly created wallet) also counts
// as needing a refill so the user starts the day at heartsMax.
export const needsDailyHeartRefill = (
  heartsResetAt: Date | null,
  today: Date,
): boolean => {
  if (heartsResetAt === null) return true
  return toUtcDay(heartsResetAt).getTime() < toUtcDay(today).getTime()
}
