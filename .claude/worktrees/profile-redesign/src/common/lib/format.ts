// Compact "time ago" formatter — no external dep.
// Returns the largest non-zero unit; falls back to a date when > 30d.
export const timeAgo = (date: Date, locale = "es"): string => {
  const now = Date.now()
  const diff = now - date.getTime()
  if (diff < 0) return relative(locale).format(0, "second")

  const sec = Math.floor(diff / 1000)
  if (sec < 60) return relative(locale).format(-sec, "second")

  const min = Math.floor(sec / 60)
  if (min < 60) return relative(locale).format(-min, "minute")

  const hr = Math.floor(min / 60)
  if (hr < 24) return relative(locale).format(-hr, "hour")

  const day = Math.floor(hr / 24)
  if (day < 30) return relative(locale).format(-day, "day")

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date)
}

const cache = new Map<string, Intl.RelativeTimeFormat>()
const relative = (locale: string): Intl.RelativeTimeFormat => {
  let r = cache.get(locale)
  if (!r) {
    r = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
    cache.set(locale, r)
  }
  return r
}
