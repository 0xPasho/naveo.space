"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { PromptEditor } from "@/common/components/prompt-editor"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseToolSchemaAuthor } from "@/modules/content/types"

import type { AttemptResult, ToolSchemaAuthorPayload } from "../../types"
import { translateReason } from "../../translate-reason"

type Props = {
  exercise: ExerciseToolSchemaAuthor
  value: ToolSchemaAuthorPayload
  onChange: (next: ToolSchemaAuthorPayload) => void
  result: AttemptResult | null
  submitting: boolean
}

const emptyPayload = (
  exercise: ExerciseToolSchemaAuthor,
): ToolSchemaAuthorPayload => ({
  kind: "tool-schema-author",
  schemaText: exercise.starter,
})

function CriterionRow({
  passed,
  primary,
  secondary,
  tag,
}: {
  passed: boolean
  primary: ReactNode
  secondary?: ReactNode
  tag?: ReactNode
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-start gap-3 border-t-2 border-line-soft px-4 py-3 first:border-t-0",
        passed ? "bg-success-soft" : "bg-danger-soft",
      )}
    >
      <div
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border-2 font-display font-bold text-sm",
          passed
            ? "bg-success border-success text-bg-deep"
            : "bg-danger border-danger text-white",
        )}
      >
        {passed ? "✓" : "✕"}
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
            passed ? "text-success" : "text-danger",
          )}
        >
          {tag}
        </div>
      ) : null}
    </div>
  )
}

export function ToolSchemaAuthorRunner({
  exercise,
  value,
  onChange,
  result,
  submitting,
}: Props) {
  const t = useTranslations("lessons.toolSchemaAuthor")
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
          <Eyebrow>{t("purposeHeader")}</Eyebrow>
        </div>
        <pre className="m-0 whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">
          {exercise.toolPurpose}
        </pre>
      </div>

      {exercise.exampleInvocations && exercise.exampleInvocations.length > 0 ? (
        <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-sunken shadow-elev-inset">
          <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
            <Eyebrow>{t("examplesHeader")}</Eyebrow>
          </div>
          <pre className="m-0 whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">
            {exercise.exampleInvocations.join("\n")}
          </pre>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Eyebrow>{t("editHeader")}</Eyebrow>
        <PromptEditor
          value={value.schemaText}
          onChange={(next) =>
            onChange({ kind: "tool-schema-author", schemaText: next })
          }
          readOnly={submitting}
          language={
            exercise.language === "javascript"
              ? "javascript"
              : exercise.language === "python"
                ? "python"
                : "json"
          }
          minHeight={260}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{t("charCount", { count: value.schemaText.length })}</Eyebrow>
        <Eyebrow>{t("criteriaCount", { n: exercise.rubric.length })}</Eyebrow>
      </div>

      {submitting ? (
        <div className="rounded-md border-2 border-line-soft bg-bg-raised px-4 py-3 font-mono text-sm">
          <span className="font-display font-bold uppercase tracking-[0.12em] text-stat-xp">
            ECHO
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
                  passed={c.passed}
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

ToolSchemaAuthorRunner.empty = emptyPayload
ToolSchemaAuthorRunner.isComplete = (
  _exercise: ExerciseToolSchemaAuthor,
  value: ToolSchemaAuthorPayload,
): boolean => value.schemaText.trim().length > 0
