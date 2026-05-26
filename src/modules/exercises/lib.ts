import { z } from "zod"
import { XMLValidator } from "fast-xml-parser"

import type {
  ExerciseAB,
  ExerciseAnatomy,
  ExerciseMCPDebug,
  ExerciseSlotFillDnd,
  ExerciseStepOrderDnd,
  ExerciseTagFill,
  ExerciseToolDescription,
  ExerciseWiringDnd,
} from "@/modules/content/types"

import type {
  ABPayload,
  AnatomyPayload,
  AttemptResult,
  ExercisePayload,
  MCPDebugPayload,
  SlotFillDndPayload,
  StepOrderDndPayload,
  TagFillPayload,
  ToolDescriptionPayload,
  WiringDndPayload,
} from "./types"

// ---------- Payload schemas ----------

export const AnatomyPayloadSchema = z.object({
  kind: z.literal("prompt-anatomy"),
  assignments: z.record(z.string(), z.string()),
})

export const ABPayloadSchema = z.object({
  kind: z.literal("prompt-AB"),
  choice: z.enum(["A", "B"]).nullable(),
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
export const ToolDescriptionPayloadSchema = z.object({
  kind: z.literal("tool-description"),
  description: z.string().min(1).max(4000),
})

export const MCPDebugPayloadSchema = z.object({
  kind: z.literal("mcp-debug"),
  pick: z.string().min(1),
})

export const ToolSchemaAuthorPayloadSchema = z.object({
  kind: z.literal("tool-schema-author"),
  schemaText: z.string().min(1).max(8000),
})

export const ToolHandlerImplementPayloadSchema = z.object({
  kind: z.literal("tool-handler-implement"),
  code: z.string().min(1).max(8000),
})

// Phase B.1 drag-and-drop payloads.
export const StepOrderDndPayloadSchema = z.object({
  kind: z.literal("step-order-dnd"),
  order: z.array(z.string().min(1)).min(1).max(40),
})

export const SlotFillDndPayloadSchema = z.object({
  kind: z.literal("slot-fill-dnd"),
  placements: z.record(z.string().min(1), z.string().min(1)),
})

export const WiringDndPayloadSchema = z.object({
  kind: z.literal("wiring-dnd"),
  connections: z
    .array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
      }),
    )
    .max(80),
})

export const ExercisePayloadSchema = z.discriminatedUnion("kind", [
  AnatomyPayloadSchema,
  ABPayloadSchema,
  TagFillPayloadSchema,
  PromptTaskPayloadSchema,
  ConversationGoalPayloadSchema,
  ToolDescriptionPayloadSchema,
  MCPDebugPayloadSchema,
  ToolSchemaAuthorPayloadSchema,
  ToolHandlerImplementPayloadSchema,
  StepOrderDndPayloadSchema,
  SlotFillDndPayloadSchema,
  WiringDndPayloadSchema,
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
  if (payload.choice === null) {
    return {
      passed: false,
      checks: [
        { id: "choice-correct", passed: false, reason: "no-choice" },
      ],
    }
  }
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

// Matches either an opened+closed tag (`<x>...</x>` or `<x attr="v">...</x>`)
// or a self-closing tag (`<x/>` / `<x attr="v"/>`). Both are valid XML so we
// accept either form — what matters is that the named tag is *present*.
const tagPattern = (tag: string) =>
  new RegExp(
    `<${tag}(?:\\s[^>]*)?(?:\\/>|>[\\s\\S]*?<\\/${tag}>)`,
    "i",
  )

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
  | ExerciseToolDescription
  | ExerciseMCPDebug
  | ExerciseStepOrderDnd
  | ExerciseSlotFillDnd
  | ExerciseWiringDnd

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
    case "tool-description":
      return validateToolDescription(
        exercise,
        payload as ToolDescriptionPayload,
      )
    case "mcp-debug":
      return validateMCPDebug(exercise, payload as MCPDebugPayload)
    case "step-order-dnd":
      return validateStepOrderDnd(exercise, payload as StepOrderDndPayload)
    case "slot-fill-dnd":
      return validateSlotFillDnd(exercise, payload as SlotFillDndPayload)
    case "wiring-dnd":
      return validateWiringDnd(exercise, payload as WiringDndPayload)
  }
}

// ---------- Phase 3 stub validators ----------
// These are intentionally permissive until each exercise's rubric is authored.
// They check structural validity (right shape / non-empty / known ids) rather
// than correctness, so the runner UI can be exercised end-to-end.

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

// ---------- Phase B.1 drag-and-drop validators ----------

const validateStepOrderDnd = (
  exercise: ExerciseStepOrderDnd,
  payload: StepOrderDndPayload,
): AttemptResult => {
  const expected = exercise.steps.map((s) => s.id)
  const allUsed =
    payload.order.length === expected.length &&
    expected.every((id) => payload.order.includes(id))
  const correctOrder =
    payload.order.length === expected.length &&
    payload.order.every((id, i) => id === expected[i])
  return {
    passed: correctOrder,
    checks: [
      {
        id: "all-steps-used",
        passed: allUsed,
        reason: allUsed ? undefined : "missing-steps",
      },
      {
        id: "correct-order",
        passed: correctOrder,
        reason: correctOrder ? undefined : "wrong-order",
      },
    ],
  }
}

const validateSlotFillDnd = (
  exercise: ExerciseSlotFillDnd,
  payload: SlotFillDndPayload,
): AttemptResult => {
  const expectedBySlot = new Map<string, Set<string>>()
  for (const slot of exercise.slots) expectedBySlot.set(slot.id, new Set())
  for (const piece of exercise.pieces) {
    expectedBySlot.get(piece.correctSlot)?.add(piece.id)
  }

  const actualBySlot = new Map<string, Set<string>>()
  for (const slot of exercise.slots) actualBySlot.set(slot.id, new Set())
  for (const [pieceId, slotId] of Object.entries(payload.placements)) {
    actualBySlot.get(slotId)?.add(pieceId)
  }

  const empty: string[] = []
  const wrong: string[] = []
  for (const slot of exercise.slots) {
    const expected = expectedBySlot.get(slot.id) ?? new Set<string>()
    const actual = actualBySlot.get(slot.id) ?? new Set<string>()
    if (actual.size === 0 && expected.size > 0) empty.push(slot.id)
    const matches =
      expected.size === actual.size &&
      [...expected].every((id) => actual.has(id))
    if (!matches) wrong.push(slot.id)
  }

  const allFilled = empty.length === 0
  const allCorrect = wrong.length === 0 && allFilled
  return {
    passed: allCorrect,
    checks: [
      {
        id: "all-slots-filled",
        passed: allFilled,
        reason: allFilled ? undefined : `empty:${empty.join(",")}`,
      },
      {
        id: "correct-placements",
        passed: allCorrect,
        reason: allCorrect ? undefined : `wrong:${wrong.join(",")}`,
      },
    ],
  }
}

// Reason prefixes for failure modes that are NOT the student's fault:
// upstream LLM provider errors, judge model errors, etc. When every failing
// check carries one of these reasons we treat the whole attempt as a
// transient infra failure — no recordAttempt, no hearts spent, no XP/gems.
const INFRA_FAIL_PREFIXES = ["task-model:", "judge:api-error", "judge:rate-limited", "judge:unknown-error", "judge:invalid-shape"]

const isInfraReason = (reason: string | undefined): boolean => {
  if (!reason) return false
  return INFRA_FAIL_PREFIXES.some((p) => reason.startsWith(p))
}

// True when the result failed AND every failing check is an infra failure.
// A mix of "real" failures + infra failures is NOT treated as infra (the
// student still has work to do; we don't want to silently shield them).
export const isInfraError = (result: AttemptResult): boolean => {
  if (result.passed) return false
  const failing = result.checks.filter((c) => !c.passed)
  if (failing.length === 0) return false
  return failing.every((c) => isInfraReason(c.reason))
}

const edgeKey = (e: { from: string; to: string }) => `${e.from}→${e.to}`

const validateWiringDnd = (
  exercise: ExerciseWiringDnd,
  payload: WiringDndPayload,
): AttemptResult => {
  const expected = new Set(exercise.correctConnections.map(edgeKey))
  const actual = new Set(payload.connections.map(edgeKey))
  const missing = [...expected].filter((k) => !actual.has(k))
  const extra = [...actual].filter((k) => !expected.has(k))
  const passed = missing.length === 0 && extra.length === 0
  return {
    passed,
    checks: [
      {
        id: "no-missing-edges",
        passed: missing.length === 0,
        reason: missing.length === 0 ? undefined : `missing:${missing.join(",")}`,
      },
      {
        id: "no-extra-edges",
        passed: extra.length === 0,
        reason: extra.length === 0 ? undefined : `extra:${extra.join(",")}`,
      },
    ],
  }
}
