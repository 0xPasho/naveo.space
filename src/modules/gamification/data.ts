// XP grants per source. Kept small and round so a single value change here
// re-balances the economy without touching call sites.
export const XP_REWARD = {
  stepAttempt: 0, // raw attempts give nothing — incentive is on completion
  stepCompletedFirstTry: 12,
  stepCompletedAny: 8,
} as const

// First-try multiplier — passing on the very first attempt earns this multiple
// of the step's base XP. 1.0 = no bonus.
export const XP_FIRST_TRY_MULTIPLIER = 1.5

// Per-ExerciseKind default XP when a step's frontmatter doesn't declare its
// own `xp:`. Capstones are tagged manually in MDX (they're worth 50+ via the
// frontmatter override).
//
// Narrative / demo steps are NOT in this map — they always grant 0 XP. The
// runtime checks `step.frontMatter.exercise` first; if absent, XP = 0
// regardless.
export const XP_BY_EXERCISE_KIND: Record<string, number> = {
  "prompt-anatomy": 8,
  "prompt-AB": 8,
  "prompt-tag-fill": 10,
  "prompt-task": 12,
  "conversation-goal": 15,
  "tool-description": 12,
  "mcp-debug": 8,
  "tool-schema-author": 14,
  "tool-handler-implement": 16,
  "step-order-dnd": 10,
  "slot-fill-dnd": 10,
  "wiring-dnd": 14,
}

// Default fallback if a new exercise kind shows up without an entry above.
export const XP_DEFAULT_PER_EXERCISE = 10

// Badge codes — match BadgeAward.code in the schema.
// Per-track badges (preFlightGraduate … shipDefender) are awarded when the
// user finishes every step of the corresponding track. allSystemsOnline
// fires when all five primary tracks (T1-T5) are complete; the optional
// pre-flight track is not required.
export const BADGE = {
  firstStep: "first-step",
  sevenDayStreak: "7-day-streak",
  thirtyDayStreak: "30-day-streak",
  firstTrack: "first-track-completed",
  preFlightGraduate: "pre-flight-graduate",
  promptAnatomist: "prompt-anatomist",
  crewCoordinator: "crew-coordinator",
  toolForger: "tool-forger",
  flowArchitect: "flow-architect",
  shipDefender: "ship-defender",
  allSystemsOnline: "all-systems-online",
} as const

// Maps a track slug to the badge a user earns by completing it. Used by the
// ship-progress UI to show which subsystem each track lights up.
export const TRACK_SLUG_TO_BADGE: Record<string, string> = {
  "pre-flight": BADGE.preFlightGraduate,
  "anatomia-del-prompt": BADGE.promptAnatomist,
  "coordinacion-con-la-crew": BADGE.crewCoordinator,
  "tools-y-mcps": BADGE.toolForger,
  "flujos-complejos": BADGE.flowArchitect,
  "seguridad-de-sistemas-ia": BADGE.shipDefender,
}

// Streak rule: a day-of-activity has to be within this many days of the
// previous one to count as "continuing" the streak. 1 = next calendar day.
export const STREAK_MAX_GAP_DAYS = 1
