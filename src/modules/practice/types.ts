import type { Exercise } from "@/modules/content/types"

// The four buckets the practice rail renders, mirroring the design's
// PRACTICE RAIL widget in the Bridge dashboard (Dashboard2).
export type PracticeRailKind = "drill" | "build" | "chat" | "tool"

// One step surfaced for review under a given kind. `failedAt` drives
// ordering inside the bucket; `attempts` and `lastFailedAt` are shown in
// the expanded /practice view as secondary signals.
export type PracticeItem = {
  kind: PracticeRailKind
  stepId: string
  stepSlug: string
  stepTitle: string
  courseSlug: string
  courseTitle: string
  trackSlug: string
  trackTitle: string
  lastFailedAt: Date
  attempts: number
  // XP the user will earn if they finally clear it (first-pass reward, no
  // first-try multiplier since they've already attempted).
  xpReward: number
  exerciseKind: Exercise["kind"]
}

// Maps each Exercise.kind in the content layer to its practice-rail bucket.
// Steps without an exercise (pure narrative / demo) are not surfaced —
// they have nothing to "review".
export const EXERCISE_KIND_TO_RAIL: Record<Exercise["kind"], PracticeRailKind> = {
  "prompt-anatomy": "drill",
  "prompt-AB": "drill",
  "prompt-tag-fill": "drill",
  "prompt-task": "build",
  "conversation-goal": "chat",
  "tool-description": "tool",
  "mcp-debug": "tool",
  "tool-schema-author": "tool",
  "tool-handler-implement": "tool",
  "step-order-dnd": "drill",
  "slot-fill-dnd": "drill",
  "wiring-dnd": "build",
}

export const PRACTICE_RAIL_ORDER: readonly PracticeRailKind[] = [
  "drill",
  "build",
  "chat",
  "tool",
]
