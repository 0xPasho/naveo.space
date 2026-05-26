import "server-only"

import { db } from "@/server/db"
import { getCached, hashRubricCall, putCached } from "@/server/cache"
import { trackMetaFor } from "@/modules/catalog/data"
import { getCourse, getTrack, getStep } from "@/modules/content/service"
import type {
  ContentLocale,
  ExerciseConversationGoal,
  ExercisePromptTask,
  ExerciseToolHandlerImplement,
  ExerciseToolSchemaAuthor,
  Step,
} from "@/modules/content/types"
import { TASK_MODEL } from "@/modules/llm/data"
import { callChat, callModel } from "@/modules/llm/service"
import { GEM_REWARD } from "@/modules/economy/data"
import {
  awardGems,
  awardGemsForStepCompletion,
  spendHeart,
} from "@/modules/economy/service"
import { BADGE, TRACK_SLUG_TO_BADGE } from "@/modules/gamification/data"
import {
  awardBadge,
  awardXp,
  recordActivity,
  xpForStep,
} from "@/modules/gamification/service"
import {
  getCourseProgress,
  getTrackProgress,
  recordAttemptForStep,
} from "@/modules/progress/service"
import { RUBRIC_VERSION } from "@/modules/rubric/data"
import { hashRubric } from "@/modules/rubric/lib"
import { runRubric } from "@/modules/rubric/service"
import type { CheckResult, Rubric, RubricResult } from "@/modules/rubric/types"
import { updateMastery } from "@/modules/srs/service"

import { isInfraError, validate } from "./lib"
import type {
  AttemptResult,
  ChatMessage,
  ConversationGoalPayload,
  ExercisePayload,
  PromptTaskOutputs,
  PromptTaskPayload,
  ToolHandlerImplementPayload,
  ToolSchemaAuthorPayload,
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

// Returns true when the Attempt JUST recorded by `recordAttempt` is the
// user's very first attempt anywhere in the track that owns the current
// step. Used to gate the once-per-track `track-start` heart charge.
//
// Implementation: resolve course → trackSlug, list all step ids in the
// track, count user's Attempt rows whose stepId is in that list. After
// recordAttempt the just-inserted row is included, so a count of 1
// means "this is the first attempt in the track".
const isFirstAttemptInTrack = async (args: RunArgs): Promise<boolean> => {
  const course = await db.contentPiece.findFirst({
    where: {
      type: "course",
      slug: args.step.courseSlug,
      locale: args.step.locale,
    },
    select: { parentSlug: true },
  })
  if (!course?.parentSlug) return false
  const trackSlug = course.parentSlug

  // Find every step in the track via course → step chain.
  const coursesInTrack = await db.contentPiece.findMany({
    where: {
      type: "course",
      parentSlug: trackSlug,
      locale: args.step.locale,
    },
    select: { slug: true },
  })
  const courseSlugs = coursesInTrack.map((c) => c.slug)
  if (courseSlugs.length === 0) return false

  const stepsInTrack = await db.contentPiece.findMany({
    where: {
      type: "step",
      parentSlug: { in: courseSlugs },
      locale: args.step.locale,
    },
    select: { id: true },
  })
  const stepIds = stepsInTrack.map((s) => s.id)
  if (stepIds.length === 0) return false

  const attemptCount = await db.attempt.count({
    where: {
      userId: args.userId,
      stepId: { in: stepIds },
    },
  })
  return attemptCount === 1
}

// ---------- Prompt-task pipeline ----------

const INPUT_PLACEHOLDER_RE = /\{\{\s*input\s*\}\}/

const fillTemplate = (template: string, input: string): string =>
  template.replace(/\{\{\s*input\s*\}\}/g, input)

const evaluatePromptTask = async (
  step: Step,
  exercise: ExercisePromptTask,
  payload: PromptTaskPayload,
): Promise<{ result: AttemptResult; outputs: PromptTaskOutputs }> => {
  // Pre-flight: if any test case has a non-empty input but the user's prompt
  // never references {{input}}, every case would receive the SAME prompt and
  // produce the same output. Fail fast with a specific reason — saves LLM
  // calls and tells the student exactly what's missing.
  const hasNonEmptyInputCase = exercise.testCases.some(
    (tc) => tc.input.trim().length > 0,
  )
  if (hasNonEmptyInputCase && !INPUT_PLACEHOLDER_RE.test(payload.promptText)) {
    return {
      result: {
        passed: false,
        checks: [
          {
            id: "uses-input-placeholder",
            passed: false,
            reason: "missing-input-placeholder",
          },
        ],
      },
      outputs: { cases: [] },
    }
  }

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

  // Run the student's prompt against each test case in parallel. allSettled
  // (not Promise.all) so a single upstream hiccup doesn't discard the cases
  // that did succeed — the rubric can still score them and the student gets
  // partial feedback. Failed cases become `output: ""` and contribute one
  // synthetic failing check below.
  const llmCalls = await Promise.allSettled(
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
  const anyLlmFailed = llmCalls.some((r) => r.status === "rejected")
  const allLlmFailed = llmCalls.every((r) => r.status === "rejected")
  if (allLlmFailed) {
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
  const llmCases = llmCalls.map((r, i) => {
    if (r.status === "fulfilled") return r.value
    return { input: exercise.testCases[i]!.input, output: "" }
  })

  // Run the rubric for each case in parallel; merge results worst-of per check.
  const perCase = await Promise.all(
    llmCases.map((c) =>
      runRubric({ rubric, output: c.output, context: c.input }),
    ),
  )

  const merged = mergeChecksWorstOf(rubric, perCase.map((r) => r.checks))
  // A case that lost its LLM output above can never pass — force passed:false
  // even if the rubric was empty (defensive; the rubric should always have
  // at least one check).
  const casePassedFlags = llmCases.map((c, i) =>
    c.output === "" && anyLlmFailed
      ? false
      : (perCase[i]?.passed ?? false),
  )
  const overallPassed = casePassedFlags.every(Boolean)
  const finalChecks = anyLlmFailed
    ? [
        ...merged,
        {
          id: "task-model-call",
          passed: false,
          reason: "task-model:error",
        } as CheckResult,
      ]
    : merged
  const result: RubricResult = { passed: overallPassed, checks: finalChecks }
  const outputs: PromptTaskOutputs = {
    cases: llmCases.map((c, i) => ({
      input: c.input,
      output: c.output,
      passed: casePassedFlags[i]!,
    })),
  }

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

// ---------- Text-directly evaluation (tool-schema-author, tool-handler-implement) ----------
//
// Both kinds follow the same pattern: the student writes text (schema JSON
// or handler code), and we evaluate that text directly against the rubric.
// No model call for substitution — the LLM-judge reads the text and the
// context (tool purpose, scenarios) to decide pass/fail per criterion.

const buildSchemaAuthorContext = (e: ExerciseToolSchemaAuthor): string => {
  const parts = [
    `Tool name: ${e.toolName}`,
    `Tool purpose:\n${e.toolPurpose}`,
  ]
  if (e.exampleInvocations && e.exampleInvocations.length > 0) {
    parts.push(`Example invocations:\n${e.exampleInvocations.join("\n")}`)
  }
  return parts.join("\n\n")
}

const buildHandlerImplementContext = (
  e: ExerciseToolHandlerImplement,
): string => {
  const parts = [
    `Tool name: ${e.toolName}`,
    `Tool schema (read-only — the student is writing a handler for this):\n${e.toolSchema}`,
  ]
  if (e.scenarios && e.scenarios.length > 0) {
    const lines = e.scenarios
      .map(
        (s, i) =>
          `Scenario ${i + 1}: ${s.description}\nExpected: ${s.expected}`,
      )
      .join("\n\n")
    parts.push(`Scenarios the handler must behave correctly on:\n${lines}`)
  }
  return parts.join("\n\n")
}

const evaluateToolSchemaAuthor = async (
  step: Step,
  exercise: ExerciseToolSchemaAuthor,
  payload: ToolSchemaAuthorPayload,
): Promise<{ result: AttemptResult }> => {
  const rubric: Rubric = {
    checks: exercise.rubric,
    passThreshold: exercise.passThreshold ?? { rule: "all-criteria" },
  }

  const cacheKey = hashRubricCall({
    userPrompt: payload.schemaText,
    exerciseId: step.id,
    rubricVersion: `${RUBRIC_VERSION}:${hashRubric(rubric)}`,
    testCases: [],
    targetModel: exercise.model ?? TASK_MODEL,
  })

  const cached = await getCached<RubricResult, never>(cacheKey)
  if (cached) {
    return {
      result: { passed: cached.results.passed, checks: cached.results.checks },
    }
  }

  const rubricResult = await runRubric({
    rubric,
    output: payload.schemaText,
    context: buildSchemaAuthorContext(exercise),
  })

  try {
    await putCached(cacheKey, rubricResult, null)
  } catch {
    // ignore — cache is optional
  }

  return {
    result: { passed: rubricResult.passed, checks: rubricResult.checks },
  }
}

const evaluateToolHandlerImplement = async (
  step: Step,
  exercise: ExerciseToolHandlerImplement,
  payload: ToolHandlerImplementPayload,
): Promise<{ result: AttemptResult }> => {
  const rubric: Rubric = {
    checks: exercise.rubric,
    passThreshold: exercise.passThreshold ?? { rule: "all-criteria" },
  }

  const cacheKey = hashRubricCall({
    userPrompt: payload.code,
    exerciseId: step.id,
    rubricVersion: `${RUBRIC_VERSION}:${hashRubric(rubric)}`,
    testCases: [],
    targetModel: exercise.model ?? TASK_MODEL,
  })

  const cached = await getCached<RubricResult, never>(cacheKey)
  if (cached) {
    return {
      result: { passed: cached.results.passed, checks: cached.results.checks },
    }
  }

  const rubricResult = await runRubric({
    rubric,
    output: payload.code,
    context: buildHandlerImplementContext(exercise),
  })

  try {
    await putCached(cacheKey, rubricResult, null)
  } catch {
    // ignore
  }

  return {
    result: { passed: rubricResult.passed, checks: rubricResult.checks },
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
  } else if (exercise.kind === "tool-schema-author") {
    if (payload.kind !== "tool-schema-author") {
      result = {
        passed: false,
        checks: [{ id: "kind-mismatch", passed: false, reason: "kind-mismatch" }],
      }
    } else {
      const r = await evaluateToolSchemaAuthor(step, exercise, payload)
      result = r.result
    }
  } else if (exercise.kind === "tool-handler-implement") {
    if (payload.kind !== "tool-handler-implement") {
      result = {
        passed: false,
        checks: [{ id: "kind-mismatch", passed: false, reason: "kind-mismatch" }],
      }
    } else {
      const r = await evaluateToolHandlerImplement(step, exercise, payload)
      result = r.result
    }
  } else {
    // Deterministic kinds — synchronous validate.
    const det = validate(exercise, payload)
    result = { passed: det.passed, checks: det.checks }
  }

  // Transient upstream failure (LLM provider down, judge timed out, etc.).
  // The student didn't fail — the system did. Return the result so the UI
  // can surface a "try again" message, but skip ALL side effects: no
  // attempt record, no hearts, no XP. The next attempt with identical
  // input still gets to retry without penalty.
  if (isInfraError(result)) {
    return result
  }

  const [attemptId, stepOutcome] = await Promise.all([
    recordAttempt(args, result),
    recordAttemptForStep({
      userId: args.userId,
      stepId: args.step.id,
      stepLocale: args.step.locale,
      passed: result.passed,
    }),
    // Streak bump. Idempotent same-day, so safe to call on every attempt.
    // Best-effort — a streak update should never block the response, but log
    // failures so a broken streak system doesn't silently rot.
    recordActivity(args.userId, "step-attempt").catch((err) => {
      console.error("[streak] runForUser → recordActivity failed", err)
    }),
  ])

  // SRS mastery update. Pass on a tracked step grows the interval; fail
  // resets it. Untracked + fail is a no-op (SRS only tracks decay of
  // knowledge the user has demonstrated once). Best-effort — never block.
  updateMastery({
    userId: args.userId,
    stepId: args.step.id,
    stepLocale: args.step.locale,
    passed: result.passed,
  }).catch((err) => {
    console.error("[srs] runForUser → updateMastery failed", err)
  })

  // ---- Hearts (vidas) ----
  // Spec (per user direction): hearts are a TRACK-level cost, not a step
  // cost. Only two spend triggers exist:
  //   - track-start: the user's very first Comprobar in this track. Fires
  //     once per user per track, ever. Browsing / passing / skipping steps
  //     does NOT charge — only the first time they actually submit.
  //   - exercise-fail: a Comprobar that didn't pass the rubric, on a step
  //     they haven't already cleared. Re-running a step you already passed
  //     and failing this time is free.
  // Passes and navigation never cost hearts.
  const alreadyCompleted = stepOutcome.progress.status === "completed"
  const isFirstInTrack = await isFirstAttemptInTrack(args).catch((err) => {
    console.error("[hearts] track-detection failed", err)
    return false
  })
  if (isFirstInTrack) {
    await spendHeart({ userId: args.userId, reason: "track-start" }).catch(
      (err) => {
        console.error("[hearts] spendHeart(track-start) failed", err)
      },
    )
  }
  if (!result.passed && !alreadyCompleted) {
    await spendHeart({ userId: args.userId, reason: "exercise-fail" }).catch(
      (err) => {
        console.error("[hearts] spendHeart(exercise-fail) failed", err)
      },
    )
  }

  // ---- XP ----
  // Granted only on first transition to `completed`. Repeat passes after the
  // step is already completed earn nothing. The first-try bonus (1.5x) is
  // applied inside `xpForStep`.
  if (stepOutcome.firstCompletion) {
    const amount = xpForStep(args.step, stepOutcome.firstTry)
    if (amount > 0) {
      await awardXp({
        userId: args.userId,
        amount,
        source: "step-completed",
      }).catch((err) => {
        console.error("[xp] awardXp(step-completed) failed", err)
      })
    }
  }

  // Gem award on first transition to completed. Idempotent via
  // `firstCompletion`, so re-checking an already-cleared step earns nothing.
  // Best-effort — economy errors shouldn't block returning the attempt.
  await awardGemsForStepCompletion({
    userId: args.userId,
    stepId: args.step.id,
    stepLocale: args.step.locale,
    firstCompletion: stepOutcome.firstCompletion,
    firstTry: stepOutcome.firstTry,
  }).catch((err) => {
    console.error("[economy] awardGemsForStepCompletion failed", err)
  })

  // Boundary awards: detect if this step's completion is the one that
  // cleared its course (or the entire track). Idempotent — only fires
  // when `firstCompletion` is true, so a re-pass after the course was
  // already done won't double-award.
  if (stepOutcome.firstCompletion) {
    // first-step badge: any first completion qualifies. Idempotent via
    // BadgeAward unique(userId, code).
    await awardBadge(args.userId, BADGE.firstStep)

    await awardBoundaryGems(args.userId, args.step).catch((err) => {
      console.error("[economy] awardBoundaryGems failed", err)
    })
  }

  return { ...result, attemptId }
}

// Course/track boundary gem awards. Reads the aggregate progress after
// `recordAttemptForStep` ran; if the course (or track) is now at 100%,
// fires the corresponding GEM_REWARD. Capstone-flagged tracks get an
// extra "capstone-cleared" bonus stacked on top of "track-cleared".
async function awardBoundaryGems(userId: string, step: Step): Promise<void> {
  const locale = step.locale

  const courseProgress = await getCourseProgress(
    userId,
    step.courseSlug,
    locale,
  )
  if (
    courseProgress.total === 0 ||
    courseProgress.completed < courseProgress.total
  ) {
    return
  }

  await awardGems({
    userId,
    amount: GEM_REWARD["course-cleared"],
    reason: "course-cleared",
    meta: { courseSlug: step.courseSlug, stepLocale: locale },
  })

  // Walk up to the track only if the course is in fact part of one (every
  // real course is; `getCourse` returns trackSlug). A missing course is
  // structural data corruption — bail rather than crash.
  const course = await getCourse(step.courseSlug, locale)
  if (!course) return

  const trackProgress = await getTrackProgress(userId, course.trackSlug, locale)
  if (
    trackProgress.total === 0 ||
    trackProgress.completed < trackProgress.total
  ) {
    return
  }

  await awardGems({
    userId,
    amount: GEM_REWARD["track-cleared"],
    reason: "track-cleared",
    meta: { trackSlug: course.trackSlug, stepLocale: locale },
  })

  // Capstone bonus — only when the track is flagged as ending in a boss
  // course (TRACK_DISPLAY_META.boss). Order arg is a no-op for tracks in
  // the explicit meta, only used as a fallback.
  const track = await getTrack(course.trackSlug, locale)
  const trackMeta = trackMetaFor(course.trackSlug, track?.order ?? 0)
  if (trackMeta.boss) {
    await awardGems({
      userId,
      amount: GEM_REWARD["capstone-cleared"],
      reason: "capstone-cleared",
      meta: { trackSlug: course.trackSlug, stepLocale: locale },
    })
  }

  // Track-completion badges. Each fire is idempotent (BadgeAward unique
  // on userId+code), best-effort (awardBadge swallows errors).
  await awardTrackCompletionBadges(userId, course.trackSlug, locale).catch(
    (err) => {
      console.error("[badges] awardTrackCompletionBadges failed", err)
    },
  )
}

// Fires the per-track badge, the first-track badge, and (when applicable)
// the all-systems-online badge. Called from awardBoundaryGems after a
// track is fully cleared.
async function awardTrackCompletionBadges(
  userId: string,
  trackSlug: string,
  locale: ContentLocale,
): Promise<void> {
  // Per-track badge (e.g. crew-coordinator for coordinacion-con-la-crew).
  // Tracks without a mapping are silently skipped.
  const trackBadge = TRACK_SLUG_TO_BADGE[trackSlug]
  if (trackBadge) await awardBadge(userId, trackBadge)

  // first-track-completed — fires the first time the user clears any track.
  await awardBadge(userId, BADGE.firstTrack)

  // all-systems-online — fires when every non-optional track is complete.
  // Optional tracks (pre-flight) do NOT gate this milestone, matching the
  // dashboard's "primary subsystems" framing.
  const tracks = await db.contentPiece.findMany({
    where: { type: "track", locale },
    select: { slug: true, frontMatter: true },
  })
  const primary = tracks.filter(
    (t) =>
      !(
        typeof t.frontMatter === "object" &&
        t.frontMatter !== null &&
        (t.frontMatter as { optional?: unknown }).optional === true
      ),
  )
  if (primary.length === 0) return
  const completions = await Promise.all(
    primary.map((t) => getTrackProgress(userId, t.slug, locale)),
  )
  const allCleared = completions.every(
    (p) => p.total > 0 && p.completed >= p.total,
  )
  if (allCleared) await awardBadge(userId, BADGE.allSystemsOnline)
}

export async function loadStep(input: {
  stepSlug: string
  courseSlug: string
  locale: string
}): Promise<Step | null> {
  const step = await getStep(
    input.stepSlug,
    input.locale as ContentLocale,
    input.courseSlug,
  )
  if (!step) return null
  if (step.courseSlug !== input.courseSlug) return null
  return step
}
