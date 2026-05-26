"use client"

import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"

import { Link, useRouter } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import type { Exercise, StepDemo } from "@/modules/content/types"
import { runExercise } from "@/modules/exercises/actions"
import { ConversationGoalRunner } from "@/modules/exercises/runners/conversation-goal"
import { MCPDebugRunner } from "@/modules/exercises/runners/mcp-debug"
import { PromptABRunner } from "@/modules/exercises/runners/prompt-AB"
import { PromptAnatomyRunner } from "@/modules/exercises/runners/prompt-anatomy"
import { PromptAssembleRunner } from "@/modules/exercises/runners/prompt-assemble"
import { PromptTagFillRunner } from "@/modules/exercises/runners/prompt-tag-fill"
import { PromptTaskRunner } from "@/modules/exercises/runners/prompt-task"
import { ToolDescriptionRunner } from "@/modules/exercises/runners/tool-description"
import { markStepViewed } from "@/modules/progress/actions"

import { DemoMount } from "./demo-mount"
import { HintsPanel } from "./hints-panel"
import { XPPill } from "./xp-pill"
import type {
  AttemptResult,
  ExercisePayload,
  RunExerciseResult,
} from "@/modules/exercises/types"

type StepRef = {
  trackSlug: string
  courseSlug: string
  stepSlug: string
}

type Props = {
  exercise: Exercise | null
  demo: StepDemo | null
  stepRef: StepRef
  locale: string
  prevHref: string | null
  nextHref: string | null
  // True when the user has previously passed this step (or completed a
  // narrative step). Seeds visual "done" state on first paint.
  initialPassed: boolean
  // Optional progressive hints from the step frontmatter. Rendered below the
  // runner; revealed one by one. Only used when the step has an exercise.
  hints?: string[]
  // Position dots for the footer's left side — small completion pills.
  positionInCourse: number
  totalInCourse: number
  completedInCourse: number
  reading: React.ReactNode
}

const initialPayloadFor = (exercise: Exercise): ExercisePayload => {
  switch (exercise.kind) {
    case "prompt-anatomy":
      return PromptAnatomyRunner.empty()
    case "prompt-AB":
      return PromptABRunner.empty()
    case "prompt-tag-fill":
      return PromptTagFillRunner.empty()
    case "prompt-task":
      return PromptTaskRunner.empty(exercise.starter)
    case "conversation-goal":
      return ConversationGoalRunner.empty(exercise)
    case "prompt-assemble":
      return PromptAssembleRunner.empty(exercise)
    case "tool-description":
      return ToolDescriptionRunner.empty(exercise)
    case "mcp-debug":
      return MCPDebugRunner.empty()
  }
}

const isComplete = (exercise: Exercise, payload: ExercisePayload): boolean => {
  if (exercise.kind !== payload.kind) return false
  switch (exercise.kind) {
    case "prompt-anatomy":
      return PromptAnatomyRunner.isComplete(exercise, payload as never)
    case "prompt-AB":
      return PromptABRunner.isComplete(exercise, payload as never)
    case "prompt-tag-fill":
      return PromptTagFillRunner.isComplete(exercise, payload as never)
    case "prompt-task":
      return PromptTaskRunner.isComplete(exercise, payload as never)
    case "conversation-goal":
      return ConversationGoalRunner.isComplete(exercise, payload as never)
    case "prompt-assemble":
      return PromptAssembleRunner.isComplete(exercise, payload as never)
    case "tool-description":
      return ToolDescriptionRunner.isComplete(exercise, payload as never)
    case "mcp-debug":
      return MCPDebugRunner.isComplete(exercise, payload as never)
  }
}

const errorMessage = (
  err: Exclude<RunExerciseResult, { ok: true }>["error"],
  t: (k: string) => string,
): string => {
  switch (err) {
    case "unauthorized":
      return t("errors.unauthorized")
    case "rate_limited":
      return t("errors.rateLimited")
    case "not_found":
      return t("errors.notFound")
    case "invalid_input":
      return t("errors.invalidInput")
  }
}

export function StepShell({
  exercise,
  demo,
  stepRef,
  locale,
  prevHref,
  nextHref,
  initialPassed,
  hints,
  positionInCourse,
  totalInCourse,
  completedInCourse,
  reading,
}: Props) {
  const t = useTranslations("lessons")
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [payload, setPayload] = useState<ExercisePayload | null>(() =>
    exercise ? initialPayloadFor(exercise) : null,
  )
  // When the user has already completed this step, surface a synthetic "all
  // passed" result so the runner UI starts in its done state. The real
  // checks aren't materialized — only the `passed` flag matters here, since
  // the user can re-run anytime and get the actual checklist back.
  const [result, setResult] = useState<AttemptResult | null>(
    exercise && initialPassed ? { passed: true, checks: [] } : null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Bumps on every fresh attempt result. Used as a `key` on the animated
  // wrapper so the CSS keyframe re-fires (CSS animations only restart when
  // the element is re-mounted or the animation property changes).
  const [attemptCount, setAttemptCount] = useState(0)
  // XP pill: bumps the first time the user earns XP for THIS step in the
  // current session (a fresh pass, or first advance on a narrative step).
  // Pre-completed steps don't re-grant XP, mirroring how Progress is idempotent.
  const [xpGainKey, setXpGainKey] = useState(0)
  const hasGainedXPRef = useRef(initialPassed)
  const nextLinkRef = useRef<HTMLAnchorElement | null>(null)

  const triggerXPGain = () => {
    if (hasGainedXPRef.current) return
    hasGainedXPRef.current = true
    setXpGainKey((k) => k + 1)
  }

  const ready =
    exercise !== null && payload !== null && isComplete(exercise, payload)
  const passed = result?.passed === true
  const failed = result !== null && result.passed === false
  const hasRightPane = exercise !== null || demo !== null

  const onCheck = async () => {
    if (!exercise || !payload || !ready || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await runExercise({ ...stepRef, locale, payload })
      if (res.ok) {
        setResult(res.result)
        setAttemptCount((c) => c + 1)
        if (res.result.passed) triggerXPGain()
      } else {
        setError(errorMessage(res.error, t))
      }
    } catch {
      setError(t("errors.network"))
    } finally {
      setSubmitting(false)
    }
  }

  // After a passing attempt, move keyboard focus to the NEXT button so
  // Enter / Space advances. Skip on the initial-passed case (page load).
  useEffect(() => {
    if (attemptCount > 0 && passed && nextLinkRef.current) {
      nextLinkRef.current.focus()
    }
  }, [attemptCount, passed])

  // Reset state when exercise identity changes (navigating to another step).
  // Effect-free: derive a key from stepRef for the runner subtree.
  const subtreeKey = `${stepRef.trackSlug}/${stepRef.courseSlug}/${stepRef.stepSlug}`

  // For narrative / demo steps (no exercise), advancing IS the completion
  // signal. Fire markStepViewed before navigating; ignore failures (auth,
  // network) since the user clicked NEXT — navigation should not block.
  const onAdvance = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!nextHref || exercise) return
    e.preventDefault()
    triggerXPGain()
    startTransition(async () => {
      try {
        await markStepViewed({ ...stepRef, locale: locale as "es" | "en" })
      } catch {
        // ignore — navigation continues regardless
      }
      router.push(nextHref)
    })
  }

  return (
    <>
      {hasRightPane ? (
        <div className="lp-body">
          <main className="lp-pane read">{reading}</main>
          <aside className="lp-pane exer">
            <div key={subtreeKey} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {exercise && payload ? (
                <>
                  <div
                    key={attemptCount}
                    className={cn(
                      attemptCount > 0 && passed && "animate-attempt-pass",
                      attemptCount > 0 && failed && "animate-attempt-shake",
                    )}
                  >
                    <Runner
                      exercise={exercise}
                      value={payload}
                      onChange={setPayload}
                      result={result}
                      submitting={submitting}
                      stepRef={stepRef}
                      locale={locale}
                    />
                  </div>
                  {error ? (
                    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  ) : null}
                  {hints && hints.length > 0 ? <HintsPanel hints={hints} /> : null}
                </>
              ) : null}

              {demo ? <DemoMount demo={demo} /> : null}
            </div>
          </aside>
        </div>
      ) : (
        <main className="lp-pane read">{reading}</main>
      )}

      <footer className="lp-foot">
        <div className="left">
          {prevHref ? (
            <Link href={prevHref} className="nav-btn">
              ← {t("footer.back")}
            </Link>
          ) : null}
        </div>

        <Dots
          position={positionInCourse}
          total={totalInCourse}
          completed={completedInCourse}
        />

        <div className="right">
          {xpGainKey > 0 ? <XPPill key={xpGainKey} /> : null}
          {exercise ? (
            <button
              type="button"
              className={cn(
                "check-cta",
                passed && "passed",
                failed && "failed",
              )}
              onClick={onCheck}
              disabled={!ready || submitting}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" style={{ display: "inline-block", verticalAlign: -3, marginRight: 6 }} />
              ) : null}
              {passed ? t("footer.checkAgain") : t("footer.checkAnswer")}
            </button>
          ) : null}
          {nextHref ? (
            <Link
              ref={nextLinkRef}
              href={nextHref}
              onClick={onAdvance}
              className="nav-btn next"
            >
              {t("footer.next")} →
            </Link>
          ) : null}
        </div>
      </footer>
    </>
  )
}

// Position-in-course dots, ported from the design's `.lp-foot .dots`. Each
// dot represents one step in the course; completed dots are green, the
// current dot is cyan + scaled, the rest are dim.
function Dots({
  position,
  total,
  completed,
}: {
  position: number
  total: number
  completed: number
}) {
  if (total === 0) return null
  return (
    <div className="dots" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < completed
        const isNow = i + 1 === position
        return (
          <span
            key={i}
            className={cn("d", isDone && "done", isNow && "now")}
          />
        )
      })}
    </div>
  )
}

// Polymorphic dispatch based on exercise kind. Kept inline so each runner
// keeps strict typing of its `value`/`onChange`.
function Runner(props: {
  exercise: Exercise
  value: ExercisePayload
  onChange: (next: ExercisePayload) => void
  result: AttemptResult | null
  submitting: boolean
  stepRef: StepRef
  locale: string
}) {
  const { exercise, value, onChange, result, submitting } = props
  switch (exercise.kind) {
    case "prompt-anatomy":
      if (value.kind !== "prompt-anatomy") return null
      return (
        <PromptAnatomyRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "prompt-AB":
      if (value.kind !== "prompt-AB") return null
      return (
        <PromptABRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "prompt-tag-fill":
      if (value.kind !== "prompt-tag-fill") return null
      return (
        <PromptTagFillRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "prompt-task":
      if (value.kind !== "prompt-task") return null
      return (
        <PromptTaskRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
          submitting={submitting}
        />
      )
    case "conversation-goal":
      if (value.kind !== "conversation-goal") return null
      return (
        <ConversationGoalRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
          submitting={submitting}
          stepRef={props.stepRef}
          locale={props.locale}
        />
      )
    case "prompt-assemble":
      if (value.kind !== "prompt-assemble") return null
      return (
        <PromptAssembleRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "tool-description":
      if (value.kind !== "tool-description") return null
      return (
        <ToolDescriptionRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "mcp-debug":
      if (value.kind !== "mcp-debug") return null
      return (
        <MCPDebugRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
  }
}
