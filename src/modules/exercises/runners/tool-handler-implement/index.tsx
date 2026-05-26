"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { PromptEditor } from "@/common/components/prompt-editor"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseToolHandlerImplement } from "@/modules/content/types"

import type { AttemptResult, ToolHandlerImplementPayload } from "../../types"
import { translateReason } from "../../translate-reason"

type Props = {
  exercise: ExerciseToolHandlerImplement
  value: ToolHandlerImplementPayload
  onChange: (next: ToolHandlerImplementPayload) => void
  result: AttemptResult | null
  submitting: boolean
}

const emptyPayload = (
  exercise: ExerciseToolHandlerImplement,
): ToolHandlerImplementPayload => ({
  kind: "tool-handler-implement",
  code: exercise.starter,
})

type RowTone = "pass" | "fail"

function CriterionRow({
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
        tone === "pass" ? "bg-success-soft" : "bg-danger-soft",
      )}
    >
      <div
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border-2 font-display font-bold text-sm",
          tone === "pass"
            ? "bg-success border-success text-bg-deep"
            : "bg-danger border-danger text-white",
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
            tone === "pass" ? "text-success" : "text-danger",
          )}
        >
          {tag}
        </div>
      ) : null}
    </div>
  )
}

export function ToolHandlerImplementRunner({
  exercise,
  value,
  onChange,
  result,
  submitting,
}: Props) {
  const t = useTranslations("lessons.toolHandlerImplement")
  const tChecks = useTranslations("lessons.checks")
  const tRunner = useTranslations("lessons.runner")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{t("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {t("label")}
        </span>
      </div>

      <ExerciseQuestion text={t("instruction", { tool: exercise.toolName })} />

      <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-sunken shadow-elev-inset">
        <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
          <Eyebrow>{t("schemaHeader")}</Eyebrow>
        </div>
        <pre className="m-0 whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">
          {exercise.toolSchema}
        </pre>
      </div>

      {exercise.scenarios && exercise.scenarios.length > 0 ? (
        <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-surface">
          <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
            <Eyebrow>
              {t("scenariosHeader", { n: exercise.scenarios.length })}
            </Eyebrow>
          </div>
          {exercise.scenarios.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-[auto_1fr] items-start gap-3 border-t-2 border-line-soft px-4 py-3 first:border-t-0"
            >
              <div className="inline-flex size-7 items-center justify-center rounded-full border-2 border-line-strong bg-bg-raised font-display font-bold text-sm text-ink-3">
                {i + 1}
              </div>
              <div className="flex flex-col gap-1 font-mono text-xs leading-relaxed">
                <div className="text-ink-1">{s.description}</div>
                <div className="text-ink-3">
                  <span className="tracking-[0.14em] uppercase">EXPECTED:</span>{" "}
                  {s.expected}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Eyebrow>{t("editHeader")}</Eyebrow>
        <PromptEditor
          value={value.code}
          onChange={(next) =>
            onChange({ kind: "tool-handler-implement", code: next })
          }
          readOnly={submitting}
          language={
            exercise.language === "python"
              ? "python"
              : exercise.language === "json"
                ? "json"
                : "javascript"
          }
          minHeight={260}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{t("charCount", { count: value.code.length })}</Eyebrow>
        <Eyebrow>{t("noSandboxNote")}</Eyebrow>
      </div>

      {submitting ? (
        <div className="rounded-md border-2 border-line-soft bg-bg-raised px-4 py-3 font-mono text-sm">
          <span className="font-display font-bold uppercase tracking-[0.12em] text-stat-streak">
            FORGE
          </span>{" "}
          <span className="text-ink-2">{t("evaluating")}</span>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-surface">
            <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
              <Eyebrow>{t("criteriaHeader", { n: result.checks.length })}</Eyebrow>
            </div>
            {result.checks.map((c) => {
              const display = translateReason(tChecks, c.reason)
              return (
                <CriterionRow
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
              result.passed
                ? tRunner("console.passed")
                : tRunner("console.ready")
            }
            body={result.passed ? t("passed") : t("failed")}
          />
        </>
      ) : null}
    </div>
  )
}

ToolHandlerImplementRunner.empty = emptyPayload
ToolHandlerImplementRunner.isComplete = (
  _exercise: ExerciseToolHandlerImplement,
  value: ToolHandlerImplementPayload,
): boolean => value.code.trim().length > 0
