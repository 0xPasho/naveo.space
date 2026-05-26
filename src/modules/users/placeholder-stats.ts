// Fallback stats shown when the real gamification data isn't available
// (anonymous viewers, marketing pages). All real screens read live data
// from the gamification / economy services. `XP_PER_STEP` and
// `XP_DELTA_PER_WEEK` used to live here as the placeholder XP economy —
// removed once XP migrated to the real ledger (Xp.total + xpForFrontmatter).

export const PLAYER_STATS_PLACEHOLDER = {
  xp: 1240,
  streak: 12,
  gems: 38,
  hearts: 4,
  heartsMax: 5,
} as const

export const GEMS_PER_COURSE = 2
