"use client"

import { useTranslations } from "next-intl"

import { ExerciseMarkdown } from "@/common/components/exercise-markdown"
import { ExerciseQuestion } from "@/common/components/exercise-question"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseMCPDebug } from "@/modules/content/types"

import type { AttemptResult, MCPDebugPayload } from "../../types"

type Props = {
  exercise: ExerciseMCPDebug
  value: MCPDebugPayload
  onChange: (next: MCPDebugPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): MCPDebugPayload => ({
  kind: "mcp-debug",
  pick: "",
})

type RowState = "idle" | "picked" | "correct" | "wrong"

const ROW_CLASSES: Record<RowState, string> = {
  idle: "bg-bg-surface border-line-strong shadow-[0_4px_0_0_rgba(0,0,0,0.5)] hover:border-ink-3",
  picked:
    "bg-primary-soft border-primary shadow-[0_4px_0_0_var(--primary-shadow)]",
  correct:
    "bg-success-soft border-success shadow-[0_4px_0_0_var(--success-shadow)]",
  wrong:
    "bg-danger-soft border-danger shadow-[0_4px_0_0_var(--danger-shadow)]",
}

const KEY_CLASSES: Record<RowState, string> = {
  idle: "bg-bg-raised text-ink-3 border-line-strong",
  picked: "bg-primary text-primary-foreground border-primary",
  correct: "bg-success text-bg-deep border-success",
  wrong: "bg-danger text-white border-danger",
}

export function MCPDebugRunner({ exercise, value, onChange, result }: Props) {
  const t = useTranslations("lessons.mcpDebug")
  const tExtra = useTranslations("lessons.mcpDebugExtra")

  const submitted = result !== null
  // Lock picks ONLY after a passing attempt. After a fail the user must
  // still be able to re-pick (the parent step-shell clears `result` on
  // every `onChange` edit, returning to interactive state).
  const locked = result?.passed === true
  const pick = value.pick
  const correct = exercise.correct

  const handlePick = (id: string) => {
    if (locked) return
    onChange({ kind: "mcp-debug", pick: id })
  }

  const stateFor = (id: string): RowState => {
    const isPicked = pick === id
    const isCorrect = id === correct
    if (submitted && isCorrect) return "correct"
    if (submitted && isPicked && !isCorrect) return "wrong"
    if (isPicked) return "picked"
    return "idle"
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{tExtra("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {tExtra("label")}
        </span>
      </div>

      <ExerciseQuestion text={t("question")} />

      <div className="rounded-md border-2 border-line-soft bg-bg-sunken shadow-elev-inset">
        <div className="flex items-center gap-2 border-b-2 border-line-soft px-3 py-2">
          <Eyebrow className="text-ink-3">{t("specHeader")}</Eyebrow>
        </div>
        <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">
          {exercise.toolSpec}
        </pre>
      </div>

      <Eyebrow>{t("causesHeader", { n: exercise.candidates.length })}</Eyebrow>

      <div className="flex flex-col gap-2.5">
        {exercise.candidates.map((c, i) => {
          const state = stateFor(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c.id)}
              disabled={locked}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border-2 p-3.5 text-left",
                "font-sans text-base text-ink-1",
                "transition-[transform,box-shadow,border-color,background-color] duration-fast ease-out",
                "active:translate-y-1 active:shadow-none cursor-pointer",
                "disabled:cursor-default disabled:active:translate-y-0",
                ROW_CLASSES[state],
              )}
            >
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-sm border-2 font-display font-bold text-base",
                  KEY_CLASSES[state],
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="flex-1 font-sans font-semibold text-sm leading-relaxed">
                {c.label}
              </span>
            </button>
          )
        })}
      </div>

      {submitted && result ? (
        <FeedbackStrip
          tone={result.passed ? "success" : "error"}
          title={result.passed ? t("passed") : t("failed")}
          body={
            <div className="flex flex-col gap-2">
              <Eyebrow
                className={
                  result.passed ? "text-success" : "text-danger"
                }
              >
                {t("explanationHeader")}
              </Eyebrow>
              <ExerciseMarkdown
                text={exercise.explanation}
                className="font-sans text-sm font-semibold leading-relaxed"
              />
            </div>
          }
        />
      ) : null}
    </div>
  )
}

MCPDebugRunner.empty = emptyPayload
MCPDebugRunner.isComplete = (
  _e: ExerciseMCPDebug,
  payload: MCPDebugPayload,
): boolean => payload.pick !== ""
