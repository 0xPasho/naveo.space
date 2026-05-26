import type { ExerciseKind } from "@/modules/content/data"

export type { ExerciseKind }

// ---------- Per-kind payload (what the runner sends to the server) ----------

export type AnatomyPayload = {
  kind: "prompt-anatomy"
  // partId -> labelId chosen by the student. Both ids come from the exercise
  // definition's `parts[].id` and `parts[].label` (lowercased). Unassigned
  // parts may be missing from the map.
  assignments: Record<string, string>
}

export type ABPayload = {
  kind: "prompt-AB"
  choice: "A" | "B"
}

export type TagFillPayload = {
  kind: "prompt-tag-fill"
  filled: string
}

export type PromptTaskPayload = {
  kind: "prompt-task"
  // The student's prompt template. Server substitutes `{{input}}` for each
  // test case's input before sending to the model.
  promptText: string
}

// Single chat turn. `assistant` is the persona, `user` is the student.
export type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

export type ConversationGoalPayload = {
  kind: "conversation-goal"
  // Full transcript at submit time. Includes the persona's opener (if any)
  // and every alternating user / assistant turn.
  transcript: ChatMessage[]
}

// ---------- Phase 3 visual-polish payloads ----------

export type PromptAssemblePayload = {
  kind: "prompt-assemble"
  // Ordered list of token ids matching the user's chosen sequence.
  order: string[]
}

export type ToolDescriptionPayload = {
  kind: "tool-description"
  // The user's edited description text.
  description: string
}

export type MCPDebugPayload = {
  kind: "mcp-debug"
  // Selected candidate id.
  pick: string
}

export type ExercisePayload =
  | AnatomyPayload
  | ABPayload
  | TagFillPayload
  | PromptTaskPayload
  | ConversationGoalPayload
  | PromptAssemblePayload
  | ToolDescriptionPayload
  | MCPDebugPayload

// Per-test-case model output for prompt-task attempts. Stored on
// Attempt.outputs and surfaced in the runner UI for inspection.
export type PromptTaskOutputs = {
  cases: { input: string; output: string }[]
}

// ---------- Result of a single check (one criterion) ----------

export type CheckResult = {
  id: string
  passed: boolean
  // Short reason for failure (or success — optional). Translated server-side
  // when applicable; for Phase 1 deterministic checks these are short English
  // tags consumed by the UI for keyed translation.
  reason?: string
}

// ---------- Overall attempt result ----------

export type AttemptResult = {
  passed: boolean
  checks: CheckResult[]
  attemptId?: string
  // Optional model outputs (e.g. for prompt-task). Surfaced to the runner
  // UI so the student can inspect what the model produced per test case.
  outputs?: PromptTaskOutputs
}

// ---------- Server action input/output (transport) ----------

export type RunExerciseInput = {
  trackSlug: string
  courseSlug: string
  stepSlug: string
  locale: string
  payload: ExercisePayload
}

export type RunExerciseResult =
  | { ok: true; result: AttemptResult }
  | { ok: false; error: "unauthorized" | "not_found" | "rate_limited" | "invalid_input" }
