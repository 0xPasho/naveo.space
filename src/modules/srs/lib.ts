import {
  EASE_FAIL_DELTA,
  EASE_MAX,
  EASE_MIN,
  EASE_PASS_DELTA,
  INITIAL_EASE,
  INITIAL_INTERVAL_DAYS,
  MAX_INTERVAL_DAYS,
} from "./data"
import type { MasteryState } from "./types"

const MS_PER_DAY = 86_400_000

const clampEase = (ease: number) =>
  Math.max(EASE_MIN, Math.min(EASE_MAX, ease))

const addDays = (from: Date, days: number) =>
  new Date(from.getTime() + days * MS_PER_DAY)

// State emitted for the user's very first successful review of a step.
// No prior record existed; we seed the SM-2 cycle from defaults.
export const initialMastery = (now: Date): MasteryState => ({
  intervalDays: INITIAL_INTERVAL_DAYS,
  ease: INITIAL_EASE,
  nextReviewAt: addDays(now, INITIAL_INTERVAL_DAYS),
  lastReviewedAt: now,
  lapses: 0,
  streak: 1,
})

// Compute the next mastery state given the previous one + the outcome of
// the most recent attempt. Pure — no DB, no side effects, deterministic
// given the inputs.
//
// Rules:
//   - Pass when the card was due (nextReviewAt <= now): grow the interval
//     by ease, nudge ease up, bump streak.
//   - Pass when the card was not yet due ("early review"): refresh the
//     lastReviewedAt but DON'T re-roll the interval. Otherwise grinding
//     practice would paradoxically push reviews further away.
//   - Fail: reset interval to 1 day, knock ease down, reset streak,
//     increment lapses, schedule for tomorrow.
export const computeNextReview = (
  prev: MasteryState,
  passed: boolean,
  now: Date,
): MasteryState => {
  if (!passed) {
    return {
      intervalDays: INITIAL_INTERVAL_DAYS,
      ease: clampEase(prev.ease + EASE_FAIL_DELTA),
      nextReviewAt: addDays(now, INITIAL_INTERVAL_DAYS),
      lastReviewedAt: now,
      lapses: prev.lapses + 1,
      streak: 0,
    }
  }

  const isEarly = now.getTime() < prev.nextReviewAt.getTime()
  if (isEarly) {
    return { ...prev, lastReviewedAt: now }
  }

  const nextEase = clampEase(prev.ease + EASE_PASS_DELTA)
  const nextInterval = Math.min(
    MAX_INTERVAL_DAYS,
    Math.max(INITIAL_INTERVAL_DAYS, Math.round(prev.intervalDays * prev.ease)),
  )
  return {
    intervalDays: nextInterval,
    ease: nextEase,
    nextReviewAt: addDays(now, nextInterval),
    lastReviewedAt: now,
    lapses: prev.lapses,
    streak: prev.streak + 1,
  }
}
