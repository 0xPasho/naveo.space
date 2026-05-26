import "server-only"

import { db } from "@/server/db"
import { getCached, hashRubricCall, putCached } from "@/server/cache"
import { getStep } from "@/modules/content/service"
import type {
  ContentLocale,
  ExerciseConversationGoal,
  ExercisePromptTask,
  Step,
} from "@/modules/content/types"
import { TASK_MODEL } from "@/modules/llm/data"
import { callChat, callModel } from "@/modules/llm/service"
import { recordActivity } from "@/modules/gamification/service"
import { recordAttemptForStep } from "@/modules/progress/service"
import { RUBRIC_VERSION } from "@/modules/rubric/data"
import { hashRubric } from "@/modules/rubric/lib"
import { runRubric } from "@/modules/rubric/service"
import type { CheckResult, Rubric, RubricResult } from "@/modules/rubric/types"

import { validate } from "./lib"
import type {
  AttemptResult,
  ChatMessage,
  ConversationGoalPayload,
  ExercisePayload,
  PromptTaskOutputs,
  PromptTaskPayload,
} from "./types"

type RunArgs = {
  userId: string
  step: Step
  payload: ExercisePayload
}

const recordAttempt = async (
  args: RunArgs,
  result: AttemptResult,
): Promise<string> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputsJson = (result.outputs ?? null) as any
  const row = await db.attempt.create({
    data: {
      userId: args.userId,
      stepId: args.step.id,
      stepLocale: args.step.locale,
      payload: args.payload as never,
      outputs: outputsJson,
      results: result.checks as never,
      passed: result.passed,
    },
    select: { id: true },
  })
  return row.id
}

// ---------- Prompt-task pipeline ----------

const fillTemplate = (template: string, input: string): string =>
  template.replace(/\{\{\s*input\s*\}\}/g, input)

const evaluatePromptTask = async (
  step: Step,
  exercise: ExercisePromptTask,
  payload: PromptTaskPayload,
): Promise<{ result: AttemptResult; outputs: PromptTaskOutputs }> => {
  const targetModel = exercise.model ?? TASK_MODEL
  const rubric: Rubric = {
    checks: exercise.rubric,
    passThreshold: exercise.passThreshold ?? { rule: "all-criteria-all-cases" },
  }

  // Cache lookup — hit means a previous identical attempt already ran the
  // task model + rubric. Saves ~3+ LLM calls per repeated submission.
  const cacheKey = hashRubricCall({
    userPrompt: payload.promptText,
    exerciseId: step.id,
    rubricVersion: `${RUBRIC_VERSION}:${hashRubric(rubric)}`,
    testCases: exercise.testCases,
    targetModel,
  })

  const cached = await getCached<RubricResult, PromptTaskOutputs>(cacheKey)
  if (cached) {
    return {
      result: {
        passed: cached.results.passed,
        checks: cached.results.checks,
        outputs: cached.outputs,
      },
      outputs: cached.outputs,
    }
  }

  // Run the student's prompt against each test case in parallel.
  let cases: PromptTaskOutputs["cases"]
  try {
    cases = await Promise.all(
      exercise.testCases.map(async (tc) => {
        const filled = fillTemplate(payload.promptText, tc.input)
        const llm = await callModel({
          model: targetModel,
          system: "",
          userPrompt: filled,
          maxTokens: 1024,
        })
        return { input: tc.input, output: llm.text }
      }),
    )
  } catch {
    // Provider error during task model call. Surface as a generic failed
    // result rather than crashing the request.
    return {
      result: {
        passed: false,
        checks: [
          { id: "task-model-call", passed: false, reason: "task-model:error" },
        ],
      },
      outputs: { cases: [] },
    }
  }

  // Run the rubric for each case in parallel; merge results worst-of per check.
  const perCase = await Promise.all(
    cases.map((c) =>
      runRubric({ rubric, output: c.output, context: c.input }),
    ),
  )

  const merged = mergeChecksWorstOf(rubric, perCase.map((r) => r.checks))
  const overallPassed = perCase.every((r) => r.passed)
  const result: RubricResult = { passed: overallPassed, checks: merged }
  const outputs: PromptTaskOutputs = { cases }

  // Best-effort cache write — never block the response on a write failure.
  try {
    await putCached(cacheKey, result, outputs)
  } catch {
    // ignore — cache is an optimization
  }

  return {
    result: {
      passed: result.passed,
      checks: result.checks,
      outputs,
    },
    outputs,
  }
}

// Merge per-case rubric results into one list (one entry per check id).
// Failure beats success: a check that fails on ANY case is reported failed.
// Preserves the original rubric order so the UI shows checks in author order.
const mergeChecksWorstOf = (
  rubric: Rubric,
  perCase: CheckResult[][],
): CheckResult[] => {
  const out: CheckResult[] = []
  for (const check of rubric.checks) {
    let acc: CheckResult | null = null
    for (const list of perCase) {
      const r = list.find((x) => x.id === check.id)
      if (!r) continue
      if (!acc) {
        acc = r
        continue
      }
      if (acc.passed && !r.passed) acc = r
    }
    if (acc) out.push(acc)
  }
  return out
}

// ---------- Conversation-goal pipeline ----------

const renderTranscript = (
  transcript: ChatMessage[],
  personaName: string,
): string =>
  transcript
    .map((m) => `${m.role === "user" ? "Alumno" : personaName}: ${m.content}`)
    .join("\n\n")

const evaluateConversation = async (
  step: Step,
  exercise: ExerciseConversationGoal,
  payload: ConversationGoalPayload,
): Promise<{ result: AttemptResult }> => {
  const personaName = exercise.personaName ?? "Persona"
  const transcriptText = renderTranscript(payload.transcript, personaName)

  const rubric: Rubric = {
    checks: exercise.rubric,
    passThreshold: exercise.passThreshold ?? { rule: "all-criteria" },
  }

  // Provide the goal as context so the judge knows what success looks like.
  const context = `Goal:\n${exercise.goal}`

  const rubricResult = await runRubric({
    rubric,
    output: transcriptText,
    context,
  })

  return {
    result: {
      passed: rubricResult.passed,
      checks: rubricResult.checks,
    },
  }
}

// Per-turn chat. Public API used by the runner UI to extend a conversation
// without committing to a final evaluation. Does not persist anything; the
// transcript lives in the client until Comprobar.
export async function chatTurn(args: {
  step: Step
  transcript: ChatMessage[]
}): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const exercise = args.step.frontMatter.exercise
  if (!exercise || exercise.kind !== "conversation-goal") {
    return { ok: false, error: "step-kind-mismatch" }
  }
  if (args.transcript.length === 0) {
    return { ok: false, error: "empty-transcript" }
  }
  // Enforce maxTurns server-side too (client should already gate this).
  const userTurns = args.transcript.filter((m) => m.role === "user").length
  if (userTurns > exercise.maxTurns) {
    return { ok: false, error: "max-turns-exceeded" }
  }

  try {
    const reply = await callChat({
      model: exercise.model ?? TASK_MODEL,
      system: exercise.personaSystemPrompt,
      messages: args.transcript,
      maxTokens: 512,
    })
    return { ok: true, reply: reply.text }
  } catch {
    return { ok: false, error: "model-call-failed" }
  }
}

// ---------- Public API ----------

export async function runForUser(args: RunArgs): Promise<AttemptResult> {
  const { step, payload } = args
  const exercise = step.frontMatter.exercise

  if (!exercise) {
    return {
      passed: false,
      checks: [{ id: "no-exercise", passed: false, reason: "no-exercise" }],
    }
  }

  let result: AttemptResult
  if (exercise.kind === "prompt-task") {
    if (payload.kind !== "prompt-task") {
      result = {
        passed: false,
        checks: [{ id: "kind-mismatch", passed: false, reason: "kind-mismatch" }],
      }
    } else {
      const r = await evaluatePromptTask(step, exercise, payload)
      result = r.result
    }
  } else if (exercise.kind === "conversation-goal") {
    if (payload.kind !== "conversation-goal") {
      result = {
        passed: false,
        checks: [{ id: "kind-mismatch", passed: false, reason: "kind-mismatch" }],
      }
    } else {
      const r = await evaluateConversation(step, exercise, payload)
      result = r.result
    }
  } else {
    // Deterministic kinds — synchronous validate.
    const det = validate(exercise, payload)
    result = { passed: det.passed, checks: det.checks }
  }

  const [attemptId] = await Promise.all([
    recordAttempt(args, result),
    recordAttemptForStep({
      userId: args.userId,
      stepId: args.step.id,
      stepLocale: args.step.locale,
      passed: result.passed,
    }),
    // Streak bump. Idempotent same-day, so safe to call on every attempt.
    // Best-effort — a streak update should never block the response.
    recordActivity(args.userId, "step-attempt").catch(() => {}),
  ])

  return { ...result, attemptId }
}

export async function loadStep(input: {
  stepSlug: string
  courseSlug: string
  locale: string
}): Promise<Step | null> {
  const step = await getStep(input.stepSlug, input.locale as ContentLocale)
  if (!step) return null
  if (step.courseSlug !== input.courseSlug) return null
  return step
}
