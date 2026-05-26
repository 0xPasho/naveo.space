// Source of truth for the gamification stats shown in the global Hud, the
// lesson player header, the sidebar daily card, the debrief screen, and the
// course-detail summary. XP is now live everywhere (derived from completed
// steps × XP_PER_STEP via `getUserStats`); `xp` here is kept only as a fallback
// for screens that haven't been migrated. `streak`, `gems`, `hearts`, and
// `heartsMax` remain placeholders until their backends land — identical
// everywhere on purpose, so the UI feels coherent.

export const PLAYER_STATS_PLACEHOLDER = {
  xp: 1240,
  streak: 12,
  gems: 38,
  hearts: 4,
  heartsMax: 5,
} as const

// Reward economy (catalog / debrief). Multiplied by stepsCleared etc.
export const XP_PER_STEP = 60
export const XP_DELTA_PER_WEEK = 220
export const GEMS_PER_COURSE = 2
