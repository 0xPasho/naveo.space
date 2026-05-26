"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { PromptEditor } from "@/common/components/prompt-editor"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExercisePromptTask } from "@/modules/content/types"

import type { AttemptResult, PromptTaskPayload } from "../../types"
import { translateReason } from "../../translate-reason"

type Props = {
  exercise: ExercisePromptTask
  value: PromptTaskPayload
  onChange: (next: PromptTaskPayload) => void
  result: AttemptResult | null
  submitting: boolean
}

const emptyPayload = (starter?: string): PromptTaskPayload => ({
  kind: "prompt-task",
  promptText: starter ?? "",
})

type RowTone = "neutral" | "pass" | "fail"

const rowToneClass = (tone: RowTone): string => {
  if (tone === "pass") return "bg-success-soft"
  if (tone === "fail") return "bg-danger-soft"
  return "bg-bg-surface"
}

const pipToneClass = (tone: RowTone): string => {
  if (tone === "pass") return "bg-success border-success text-bg-deep"
  if (tone === "fail") return "bg-danger border-danger text-white"
  return "bg-bg-raised border-line-strong text-ink-3"
}

function TestcaseRow({
  tone,
  pip,
  primary,
  secondary,
  tag,
}: {
  tone: RowTone
  pip: ReactNode
  primary: ReactNode
  secondary?: ReactNode
  tag?: ReactNode
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-start gap-3 border-t-2 border-line-soft px-4 py-3 first:border-t-0",
        rowToneClass(tone),
      )}
    >
      <div
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border-2 font-display font-bold text-sm",
          pipToneClass(tone),
        )}
      >
        {pip}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <div className="font-mono text-xs text-ink-1">{primary}</div>
        {secondary ? (
          <div className="font-mono text-[11px] leading-relaxed text-ink-3">
            {secondary}
          </div>
        ) : null}
      </div>
      {tag ? (
        <div
          className={cn(
            "font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
            tone === "pass"
              ? "text-success"
              : tone === "fail"
                ? "text-danger"
                : "text-ink-3",
          )}
        >
          {tag}
        </div>
      ) : null}
    </div>
  )
}

export function PromptTaskRunner({
  exercise,
  value,
  onChange,
  result,
  submitting,
}: Props) {
  const t = useTranslations("lessons.runner")
  const tTask = useTranslations("lessons.task")
  const tChecks = useTranslations("lessons.checks")
  const outputs = result?.outputs?.cases

  const truncate = (s: string, n: number) =>
    s.length > n ? `${s.slice(0, n)}…` : s

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{tTask("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {tTask("label", { n: exercise.testCases.length })}
        </span>
      </div>

      <ExerciseQuestion text={exercise.task} />

      <PromptEditor
        value={value.promptText}
        onChange={(next) => onChange({ kind: "prompt-task", promptText: next })}
        readOnly={submitting}
        language="markdown"
        minHeight={260}
        placeholder={
          exercise.starter ??
          "Eres un asistente que ...\n\n<input>\n  {{input}}\n</input>\n\nResponde en JSON: { ... }"
        }
      />

      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{t("prompt.count", { count: value.promptText.length })}</Eyebrow>
        <Eyebrow>{t("prompt.hint", { token: "{{input}}" })}</Eyebrow>
      </div>

      <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-surface">
        <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
          <Eyebrow>
            {tTask("rubricHeader", {
              cases: exercise.testCases.length,
              criteria: exercise.rubric.length,
            })}
          </Eyebrow>
        </div>
        {exercise.testCases.map((tc, i) => {
          const caseOut = outputs?.[i]
          const out = caseOut?.output
          const hasResult = caseOut !== undefined
          const casePassed = caseOut?.passed === true
          const tone: RowTone = hasResult ? (casePassed ? "pass" : "fail") : "neutral"
          const pip = hasResult ? (casePassed ? "✓" : "✕") : `#${i + 1}`
          return (
            <TestcaseRow
              key={i}
              tone={tone}
              pip={pip}
              primary={<>&quot;{truncate(tc.input, 72)}&quot;</>}
              secondary={
                out ? (
                  <div className="whitespace-pre-wrap max-h-[140px] overflow-auto">
                    <span className="tracking-[0.14em] uppercase text-ink-3">
                      {t("cases.output")}:
                    </span>{" "}
                    <span className="text-ink-1">{out}</span>
                  </div>
                ) : null
              }
              tag={tTask("caseTag", { n: i + 1 })}
            />
          )
        })}
      </div>

      {submitting ? (
        <div className="rounded-md border-2 border-line-soft bg-bg-raised px-4 py-3 font-mono text-sm">
          <span className="font-display font-bold uppercase tracking-[0.12em] text-stat-xp">
            ECHO
          </span>{" "}
          <span className="text-ink-2">
            {t("evaluating", { count: exercise.testCases.length })}
          </span>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-surface">
            <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
              <Eyebrow>
                {tTask("criteriaHeader", { n: result.checks.length })}
              </Eyebrow>
            </div>
            {result.checks.map((c) => {
              const display = translateReason(tChecks, c.reason)
              return (
                <TestcaseRow
                  key={c.id}
                  tone={c.passed ? "pass" : "fail"}
                  pip={c.passed ? "✓" : "✕"}
                  primary={c.id}
                  secondary={display}
                  tag={c.passed ? "PASS" : "FAIL"}
                />
              )
            })}
          </div>

          <FeedbackStrip
            tone={result.passed ? "success" : "error"}
            title={
              result.passed ? t("console.passed") : t("console.ready")
            }
            body={
              result.passed
                ? t("crew.promptTaskPassed")
                : t("crew.promptTask")
            }
          />
        </>
      ) : null}
    </div>
  )
}

PromptTaskRunner.empty = emptyPayload
PromptTaskRunner.isComplete = (
  _exercise: ExercisePromptTask,
  value: PromptTaskPayload,
): boolean => value.promptText.trim().length > 10
