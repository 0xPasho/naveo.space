import type { ExerciseKind } from "@/modules/content/data"

// Daily quests are intentionally cheap: deterministic kinds only. No LLM
// calls, no rubric judges, no hearts charge. Adding kinds here just means
// the validator path supports them in modules/exercises/lib.ts:validate.
export const DAILY_QUEST_SUPPORTED_KINDS: ReadonlySet<ExerciseKind> = new Set([
  "prompt-anatomy",
  "prompt-AB",
  "prompt-tag-fill",
  "tool-description",
  "mcp-debug",
  "step-order-dnd",
  "slot-fill-dnd",
  "wiring-dnd",
])

// Flat XP reward for completing a daily quest. Daily quests don't grant XP
// for failed attempts, only for the first PASS of the assigned day. Picked
// to sit between a single deterministic step (10) and a chunky exercise
// (20+) so the daily feels meaningful without overshadowing the lesson path.
export const DAILY_QUEST_XP_PASS = 15
