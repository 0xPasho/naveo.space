// SM-2 inspired spacing constants. Tuned to match the curriculum cadence
// (most steps clear in 1-2 attempts; we want the first re-review to feel
// soon but not nagging, and the long tail to stretch to ~6 months for
// fully mastered material).

// Interval used on the very first pass and after any fail-reset.
export const INITIAL_INTERVAL_DAYS = 1

// Default ease factor for a fresh record. Same as classic SM-2.
export const INITIAL_EASE = 2.5

// Hard bounds on ease. Below 1.3 the interval barely grows; above 3.0
// the jumps get absurd and one missed review wipes too much progress.
export const EASE_MIN = 1.3
export const EASE_MAX = 3.0

// Per-event ease deltas. Passing on or after due nudges ease up;
// failing knocks it down harder than a pass repairs it.
export const EASE_PASS_DELTA = 0.1
export const EASE_FAIL_DELTA = -0.2

// Cap on intervalDays. A step at the cap effectively gets reviewed twice
// a year — enough to confirm retention without polluting the queue.
export const MAX_INTERVAL_DAYS = 180
