import { z } from "zod"
import { XMLValidator } from "fast-xml-parser"

import type {
  ExerciseAB,
  ExerciseAnatomy,
  ExerciseMCPDebug,
  ExercisePromptAssemble,
  ExerciseTagFill,
  ExerciseToolDescription,
} from "@/modules/content/types"

import type {
  ABPayload,
  AnatomyPayload,
  AttemptResult,
  ExercisePayload,
  MCPDebugPayload,
  PromptAssemblePayload,
  TagFillPayload,
  ToolDescriptionPayload,
} from "./types"

// ---------- Payload schemas ----------

export const AnatomyPayloadSchema = z.object({
  kind: z.literal("prompt-anatomy"),
  assignments: z.record(z.string(), z.string()),
})

export const ABPayloadSchema = z.object({
  kind: z.literal("prompt-AB"),
  choice: z.enum(["A", "B"]),
})

export const TagFillPayloadSchema = z.object({
  kind: z.literal("prompt-tag-fill"),
  filled: z.string().min(1),
})

export const PromptTaskPayloadSchema = z.object({
  kind: z.literal("prompt-task"),
  promptText: z.string().min(1).max(8000),
})

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
})

export const ConversationGoalPayloadSchema = z.object({
  kind: z.literal("conversation-goal"),
  transcript: z.array(ChatMessageSchema).min(1).max(40),
})

// Phase 3 visual-polish payloads — server-side validation is stubbed in
// `service.ts` until the rubric is authored.
export const PromptAssemblePayloadSchema = z.object({
  kind: z.literal("prompt-assemble"),
  order: z.array(z.string().min(1)).min(1).max(40),
})

export const ToolDescriptionPayloadSchema = z.object({
  kind: z.literal("tool-description"),
  description: z.string().min(1).max(4000),
})

export const MCPDebugPayloadSchema = z.object({
  kind: z.literal("mcp-debug"),
  pick: z.string().min(1),
})

export const ExercisePayloadSchema = z.discriminatedUnion("kind", [
  AnatomyPayloadSchema,
  ABPayloadSchema,
  TagFillPayloadSchema,
  PromptTaskPayloadSchema,
  ConversationGoalPayloadSchema,
  PromptAssemblePayloadSchema,
  ToolDescriptionPayloadSchema,
  MCPDebugPayloadSchema,
])

// ---------- Helpers ----------

const toLabelId = (label: string) => label.toLowerCase().trim()

// ---------- Validators (deterministic, no LLM) ----------

export const validateAnatomy = (
  exercise: ExerciseAnatomy,
  payload: AnatomyPayload,
): AttemptResult => {
  const wrong: string[] = []
  for (const part of exercise.parts) {
    const chosen = payload.assignments[part.id]
    if (!chosen || toLabelId(chosen) !== toLabelId(part.label)) {
      wrong.push(part.id)
    }
  }
  const passed = wrong.length === 0
  return {
    passed,
    checks: [
      {
        id: "labels-correct",
        passed,
        reason: passed ? undefined : `wrong:${wrong.join(",")}`,
      },
    ],
  }
}

export const validateAB = (
  exercise: ExerciseAB,
  payload: ABPayload,
): AttemptResult => {
  const passed = payload.choice === exercise.correct
  return {
    passed,
    checks: [
      {
        id: "choice-correct",
        passed,
        reason: passed ? undefined : "wrong-choice",
      },
    ],
  }
}

const tagPattern = (tag: string) =>
  new RegExp(`<${tag}(\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>`, "i")

export const validateTagFill = (
  exercise: ExerciseTagFill,
  payload: TagFillPayload,
): AttemptResult => {
  // Wrap to make the snippet a single-rooted document for the validator.
  const wrapped = `<root>${payload.filled}</root>`
  const wellFormed = XMLValidator.validate(wrapped, { allowBooleanAttributes: true })
  const xmlOk = wellFormed === true

  const missingTags = exercise.requiredTags.filter(
    (t) => !tagPattern(t).test(payload.filled),
  )
  const tagsOk = missingTags.length === 0

  return {
    passed: xmlOk && tagsOk,
    checks: [
      {
        id: "xml-well-formed",
        passed: xmlOk,
        reason: xmlOk ? undefined : "xml-malformed",
      },
      {
        id: "required-tags",
        passed: tagsOk,
        reason: tagsOk ? undefined : `missing:${missingTags.join(",")}`,
      },
    ],
  }
}

// ---------- Dispatch ----------

// Deterministic-validation exercises (synchronous, no LLM). LLM-evaluated
// kinds (prompt-task, conversation-goal) take a different path in service.ts.
export type ExerciseDefinition =
  | ExerciseAnatomy
  | ExerciseAB
  | ExerciseTagFill
  | ExercisePromptAssemble
  | ExerciseToolDescription
  | ExerciseMCPDebug

export const validate = (
  exercise: ExerciseDefinition,
  payload: ExercisePayload,
): AttemptResult => {
  if (exercise.kind !== payload.kind) {
    return {
      passed: false,
      checks: [{ id: "kind-mismatch", passed: false, reason: "kind-mismatch" }],
    }
  }
  switch (exercise.kind) {
    case "prompt-anatomy":
      return validateAnatomy(exercise, payload as AnatomyPayload)
    case "prompt-AB":
      return validateAB(exercise, payload as ABPayload)
    case "prompt-tag-fill":
      return validateTagFill(exercise, payload as TagFillPayload)
    case "prompt-assemble":
      return validatePromptAssemble(
        exercise,
        payload as PromptAssemblePayload,
      )
    case "tool-description":
      return validateToolDescription(
        exercise,
        payload as ToolDescriptionPayload,
      )
    case "mcp-debug":
      return validateMCPDebug(exercise, payload as MCPDebugPayload)
  }
}

// ---------- Phase 3 stub validators ----------
// These are intentionally permissive until each exercise's rubric is authored.
// They check structural validity (right shape / non-empty / known ids) rather
// than correctness, so the runner UI can be exercised end-to-end.

const validatePromptAssemble = (
  exercise: ExercisePromptAssemble,
  payload: PromptAssemblePayload,
): AttemptResult => {
  const expected = exercise.tokens.map((t) => t.id)
  const allTokensUsed =
    payload.order.length === expected.length &&
    expected.every((id) => payload.order.includes(id))
  const correctOrder =
    payload.order.length === expected.length &&
    payload.order.every((id, i) => id === expected[i])
  return {
    passed: correctOrder,
    checks: [
      {
        id: "all-tokens-used",
        passed: allTokensUsed,
        reason: allTokensUsed ? undefined : "missing-tokens",
      },
      {
        id: "correct-order",
        passed: correctOrder,
        reason: correctOrder ? undefined : "wrong-order",
      },
    ],
  }
}

const validateToolDescription = (
  exercise: ExerciseToolDescription,
  payload: ToolDescriptionPayload,
): AttemptResult => {
  const desc = payload.description.toLowerCase()
  const checks = exercise.requiredPhrases.map((phrase) => {
    const passed = desc.includes(phrase.toLowerCase())
    return {
      id: `phrase:${phrase}`,
      passed,
      reason: passed ? undefined : "missing-phrase",
    }
  })
  return {
    passed: checks.every((c) => c.passed),
    checks,
  }
}

const validateMCPDebug = (
  exercise: ExerciseMCPDebug,
  payload: MCPDebugPayload,
): AttemptResult => {
  const passed = payload.pick === exercise.correct
  return {
    passed,
    checks: [
      {
        id: "correct-cause",
        passed,
        reason: passed ? undefined : "wrong-cause",
      },
    ],
  }
}
