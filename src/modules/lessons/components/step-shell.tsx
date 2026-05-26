"use client"

import { SignInButton } from "@clerk/nextjs"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useTransition } from "react"

import { Button, Callout, Chip } from "@/common/components/ui"
import { Link, useRouter } from "@/common/i18n/navigation"
import { cn } from "@/common/lib/utils"
import type { Exercise, StepDemo } from "@/modules/content/types"
import { runExercise } from "@/modules/exercises/actions"
import { ConversationGoalRunner } from "@/modules/exercises/runners/conversation-goal"
import { MCPDebugRunner } from "@/modules/exercises/runners/mcp-debug"
import { PromptABRunner } from "@/modules/exercises/runners/prompt-AB"
import { PromptAnatomyRunner } from "@/modules/exercises/runners/prompt-anatomy"
import { PromptTagFillRunner } from "@/modules/exercises/runners/prompt-tag-fill"
import { PromptTaskRunner } from "@/modules/exercises/runners/prompt-task"
import { SlotFillDndRunner } from "@/modules/exercises/runners/slot-fill-dnd"
import { StepOrderDndRunner } from "@/modules/exercises/runners/step-order-dnd"
import { ToolDescriptionRunner } from "@/modules/exercises/runners/tool-description"
import { ToolHandlerImplementRunner } from "@/modules/exercises/runners/tool-handler-implement"
import { ToolSchemaAuthorRunner } from "@/modules/exercises/runners/tool-schema-author"
import { WiringDndRunner } from "@/modules/exercises/runners/wiring-dnd"
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
  // Hearts wallet is empty. When true AND step has an exercise AND not
  // already passed → Comprobar is disabled and the runner shows a "0 vidas"
  // banner pointing to /workbench. Already-passed exercises stay re-runnable.
  outOfHearts?: boolean
  // Anon users can interact with the runner but Comprobar wraps in
  // SignInButton (modal) instead of calling the server action — the action
  // would just bounce with "unauthorized" and leave the button looking broken.
  isSignedIn: boolean
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
    case "tool-description":
      return ToolDescriptionRunner.empty(exercise)
    case "mcp-debug":
      return MCPDebugRunner.empty()
    case "tool-schema-author":
      return ToolSchemaAuthorRunner.empty(exercise)
    case "tool-handler-implement":
      return ToolHandlerImplementRunner.empty(exercise)
    case "step-order-dnd":
      return StepOrderDndRunner.empty(exercise)
    case "slot-fill-dnd":
      return SlotFillDndRunner.empty()
    case "wiring-dnd":
      return WiringDndRunner.empty()
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
    case "tool-description":
      return ToolDescriptionRunner.isComplete(exercise, payload as never)
    case "mcp-debug":
      return MCPDebugRunner.isComplete(exercise, payload as never)
    case "tool-schema-author":
      return ToolSchemaAuthorRunner.isComplete(exercise, payload as never)
    case "tool-handler-implement":
      return ToolHandlerImplementRunner.isComplete(exercise, payload as never)
    case "step-order-dnd":
      return StepOrderDndRunner.isComplete(exercise, payload as never)
    case "slot-fill-dnd":
      return SlotFillDndRunner.isComplete(exercise, payload as never)
    case "wiring-dnd":
      return WiringDndRunner.isComplete(exercise, payload as never)
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
    case "no_hearts":
      return t("errors.noHearts")
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
  outOfHearts = false,
  isSignedIn,
  reading,
}: Props) {
  const t = useTranslations("lessons")
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [payload, setPayload] = useState<ExercisePayload | null>(() =>
    exercise ? initialPayloadFor(exercise) : null,
  )
  // Result starts null even when the user has previously cleared the step.
  // Seeding it to `{passed: true}` was locking the runner (options disabled,
  // correct answer auto-highlighted, "Check" button greyed because the
  // payload has no choice picked) and trapping the user with no way to
  // re-engage. Re-runs on already-passed steps cost no hearts (recordAttempt
  // skips the heart spend when firstCompletion=false), so a clean
  // interactive start is safe. The user can re-submit if they want or just
  // click NEXT to advance.
  const [result, setResult] = useState<AttemptResult | null>(null)
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

  const passed = result?.passed === true
  const failed = result !== null && result.passed === false
  // Block Comprobar when the user is empty on hearts AND hasn't already
  // passed this step. Already-passed steps stay re-runnable (zero hearts
  // doesn't cost anything for them — recordAttempt sees firstCompletion=false,
  // skips the heart spend in service.ts).
  const blockedByHearts = outOfHearts && !passed
  const ready =
    exercise !== null &&
    payload !== null &&
    isComplete(exercise, payload) &&
    !blockedByHearts
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
        // Re-fetch RSC so the Hud reflects new XP / hearts after this attempt.
        router.refresh()
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

  // Defense-in-depth state reset. The parent page.tsx and LessonPlayerView
  // both carry a remount key on the step slugs, which should already force
  // StepShell to remount across step navigations. In practice, a route
  // prefetch / Fast Refresh / segment-cache reuse occasionally leaves the
  // StepShell instance alive across steps, so the result/payload from the
  // previous step leak into the next one — the user lands on a fresh
  // prompt-AB and sees the correct answer pre-highlighted in green plus the
  // success banner. This effect resets the local state explicitly when the
  // stepRef changes so we never depend on the remount alone.
  const stepKey = `${stepRef.trackSlug}/${stepRef.courseSlug}/${stepRef.stepSlug}`
  const prevStepKeyRef = useRef(stepKey)
  useEffect(() => {
    if (prevStepKeyRef.current === stepKey) return
    prevStepKeyRef.current = stepKey
    setPayload(exercise ? initialPayloadFor(exercise) : null)
    setResult(null)
    setError(null)
    setSubmitting(false)
    setAttemptCount(0)
    hasGainedXPRef.current = initialPassed
  }, [stepKey, exercise, initialPassed])

  // Reset state when exercise identity changes (navigating to another step).
  // Same key used for the runner subtree below — kept as a separate const
  // so future renames stay aligned.
  const subtreeKey = stepKey

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
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          <main className="relative flex flex-col gap-4 overflow-y-auto border-b-2 border-line-strong bg-bg-surface px-8 py-7 md:border-b-0 md:border-r-2">
            {reading}
          </main>
          <aside className="relative flex flex-col overflow-y-auto bg-bg-deep px-8 py-7">
            <div
              key={subtreeKey}
              className="flex flex-col gap-4"
            >
              {exercise && payload ? (
                <>
                  {initialPassed && !result ? (
                    <Chip tone="success" className="self-start">
                      {t("alreadyCleared")}
                    </Chip>
                  ) : null}
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
                      onChange={(next) => {
                        setPayload(next)
                        // Clear a stale FAIL result the moment the user
                        // edits. Preserve PASS so the success banner stays
                        // visible (non-MCQ runners like conversation-goal,
                        // prompt-task, tool-* allow editing after pass and
                        // we don't want innocuous edits to wipe the
                        // checkmark). MCQ runners (prompt-AB, mcp-debug)
                        // lock themselves on pass via `locked`, so onChange
                        // can't fire after pass there anyway.
                        if (result && !result.passed) setResult(null)
                      }}
                      result={result}
                      submitting={submitting}
                      stepRef={stepRef}
                      locale={locale}
                    />
                  </div>
                  {error ? (
                    <p className="rounded-md border-2 border-danger bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
                      {error}
                    </p>
                  ) : null}
                  {blockedByHearts ? (
                    <Callout tone="danger" eyebrow={t("zeroHearts.label")}>
                      {t.rich("zeroHearts.body", {
                        workbench: (chunks) => (
                          <Link
                            href="/workbench"
                            className="text-track-prompting underline underline-offset-2"
                          >
                            {chunks}
                          </Link>
                        ),
                      })}
                    </Callout>
                  ) : null}
                  {!isSignedIn ? (
                    <Callout tone="info" eyebrow={t("anon.label")}>
                      {t("anon.body")}
                    </Callout>
                  ) : null}
                  {hints && hints.length > 0 ? (
                    <HintsPanel
                      hints={hints}
                      stepRef={stepRef}
                      locale={locale as "es" | "en"}
                      alreadyPassed={passed}
                    />
                  ) : null}
                </>
              ) : null}

              {demo ? <DemoMount demo={demo} /> : null}
            </div>
          </aside>
        </div>
      ) : (
        <main className="relative flex flex-1 flex-col gap-4 overflow-y-auto bg-bg-surface px-8 py-7">
          {reading}
        </main>
      )}

      <footer className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 border-t-2 border-line-strong bg-bg-surface/90 px-4 py-3 backdrop-blur sm:grid-cols-[1fr_auto_1fr] sm:gap-4 sm:px-6">
        <div className="col-start-1 row-start-2 flex items-center gap-3 sm:col-auto sm:row-auto">
          {prevHref ? (
            <Button
              render={<Link href={prevHref} />}
              variant="secondary"
              size="default"
              className="px-3 sm:px-5"
              aria-label={t("footer.back")}
            >
              <ChevronLeft strokeWidth={2.5} />
              <span className="hidden sm:inline">{t("footer.back")}</span>
            </Button>
          ) : null}
        </div>

        <Dots
          className="col-span-2 row-start-1 sm:col-auto sm:row-auto"
          position={positionInCourse}
          total={totalInCourse}
          completed={completedInCourse}
        />

        <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-end gap-2 sm:col-auto sm:row-auto sm:gap-3">
          {xpGainKey > 0 ? <XPPill key={xpGainKey} /> : null}
          {exercise ? (
            isSignedIn ? (
              <Button
                type="button"
                onClick={onCheck}
                disabled={!ready || submitting}
                variant={
                  passed ? "track-tooling" : failed ? "destructive" : "default"
                }
                size="default"
                className="px-4 text-xs sm:px-6 sm:text-sm"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                {passed ? t("footer.checkAgain") : t("footer.checkAnswer")}
              </Button>
            ) : (
              // Anon users: Comprobar opens the Clerk sign-in modal instead
              // of calling runExercise. The server action would just bounce
              // with "unauthorized" and leave the button looking stuck. We
              // keep the button visually enabled (no `ready` gate) so the
              // first click always lands them in the auth flow.
              <SignInButton mode="modal">
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  className="px-4 text-xs sm:px-6 sm:text-sm"
                >
                  {t("footer.checkAnswer")}
                </Button>
              </SignInButton>
            )
          ) : null}
          {nextHref ? (
            <Button
              render={
                <Link
                  ref={nextLinkRef}
                  href={nextHref}
                  onClick={onAdvance}
                />
              }
              // Promote Next to the primary chunky CTA when there's no
              // Comprobar left to do (narrative steps OR exercise already
              // passed). Otherwise it sits as a secondary chunky button so
              // the eye lands on Comprobar first.
              variant={!exercise || passed ? "default" : "secondary"}
              size="default"
              className="px-3 sm:px-5"
              aria-label={t("footer.next")}
            >
              <span className="hidden sm:inline">{t("footer.next")}</span>
              <ChevronRight strokeWidth={2.5} />
            </Button>
          ) : null}
        </div>
      </footer>
    </>
  )
}

// Position-in-course dots, replicated from the design's `.lp-foot .dots`.
// Each dot represents one step in the course; completed dots are success
// green, the current dot is primary cyan + scaled, the rest are dim.
function Dots({
  className,
  position,
  total,
  completed,
}: {
  className?: string
  position: number
  total: number
  completed: number
}) {
  if (total === 0) return null
  const pct = Math.max(0, Math.min(100, (position / total) * 100))
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex w-full items-center gap-2 rounded-full border-2 border-line-strong bg-bg-raised px-2.5 py-1.5 sm:hidden">
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-sunken shadow-elev-inset">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">
          {position}/{total}
        </span>
      </div>
      <div
        className="hidden items-center gap-1.5 rounded-full border-2 border-line-strong bg-bg-raised px-2.5 py-1.5 sm:flex"
        aria-hidden="true"
      >
        {Array.from({ length: total }, (_, i) => {
          const isDone = i < completed
          const isNow = i + 1 === position
          return (
            <span
              key={i}
              className={cn(
                "block size-2 rounded-full border border-line-strong bg-bg-sunken",
                isDone &&
                  "border-success bg-success shadow-[0_0_4px_var(--success)]",
                isNow &&
                  "scale-[1.4] border-primary bg-primary shadow-[0_0_6px_var(--primary)]",
              )}
            />
          )
        })}
      </div>
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
    case "tool-schema-author":
      if (value.kind !== "tool-schema-author") return null
      return (
        <ToolSchemaAuthorRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
          submitting={submitting}
        />
      )
    case "tool-handler-implement":
      if (value.kind !== "tool-handler-implement") return null
      return (
        <ToolHandlerImplementRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
          submitting={submitting}
        />
      )
    case "step-order-dnd":
      if (value.kind !== "step-order-dnd") return null
      return (
        <StepOrderDndRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "slot-fill-dnd":
      if (value.kind !== "slot-fill-dnd") return null
      return (
        <SlotFillDndRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
    case "wiring-dnd":
      if (value.kind !== "wiring-dnd") return null
      return (
        <WiringDndRunner
          exercise={exercise}
          value={value}
          onChange={onChange}
          result={result}
        />
      )
  }
}
