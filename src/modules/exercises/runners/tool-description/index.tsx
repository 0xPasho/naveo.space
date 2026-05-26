"use client"

import { useTranslations } from "next-intl"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { PromptEditor } from "@/common/components/prompt-editor"
import { Eyebrow, FeedbackStrip } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import type { ExerciseToolDescription } from "@/modules/content/types"

import type { AttemptResult, ToolDescriptionPayload } from "../../types"

type Props = {
  exercise: ExerciseToolDescription
  value: ToolDescriptionPayload
  onChange: (next: ToolDescriptionPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (
  exercise: ExerciseToolDescription,
): ToolDescriptionPayload => ({
  kind: "tool-description",
  description: exercise.starter,
})

export function ToolDescriptionRunner({
  exercise,
  value,
  onChange,
  result,
}: Props) {
  const t = useTranslations("lessons.toolDesc")
  const tExtra = useTranslations("lessons.toolDescExtra")

  // Live "actual" state per phrase — green pip when present in the description,
  // neutral otherwise. After submit, `result.checks` overrides via id match.
  const desc = value.description
  const descLower = desc.toLowerCase()
  const liveActual = (phrase: string): "yes" | "no" =>
    descLower.includes(phrase.toLowerCase()) ? "yes" : "no"

  const checkById = new Map(
    (result?.checks ?? []).map((c) => [c.id, c] as const),
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{tExtra("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {tExtra("label")}
        </span>
      </div>

      <ExerciseQuestion text={t("instruction", { tool: exercise.toolName })} />

      <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-sunken shadow-elev-inset">
        <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
          <Eyebrow>{t("specHeader")}</Eyebrow>
        </div>
        <pre className="m-0 whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-ink-2">
          {exercise.context}
        </pre>
      </div>

      <div className="flex flex-col gap-2">
        <Eyebrow>{t("editHeader")}</Eyebrow>
        <PromptEditor
          value={desc}
          onChange={(next) =>
            onChange({ kind: "tool-description", description: next })
          }
          language="markdown"
          minHeight={140}
        />
      </div>

      <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-surface">
        <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
          <Eyebrow>{t("taskHeader", { n: exercise.requiredPhrases.length })}</Eyebrow>
        </div>
        {exercise.requiredPhrases.map((phrase, i) => {
          const id = `phrase:${phrase}`
          const submitted = checkById.get(id)
          const actual: "yes" | "no" = submitted
            ? submitted.passed
              ? "yes"
              : "no"
            : liveActual(phrase)
          const ok = actual === "yes"
          return (
            <div
              key={id}
              className={cn(
                "grid grid-cols-[auto_1fr_auto] items-start gap-3 border-t-2 border-line-soft px-4 py-3 first:border-t-0",
                ok ? "bg-success-soft" : "bg-bg-surface",
              )}
            >
              <div
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full border-2 font-display font-bold text-sm",
                  ok
                    ? "bg-success border-success text-bg-deep"
                    : "bg-bg-raised border-line-strong text-ink-3",
                )}
              >
                {ok ? "✓" : `${i + 1}`}
              </div>
              <div className="font-mono text-xs text-ink-1">
                &quot;{phrase}&quot;
              </div>
              <div
                className={cn(
                  "font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
                  ok ? "text-success" : "text-ink-3",
                )}
              >
                <div>{ok ? tExtra("present") : tExtra("missing")}</div>
                <div>{tExtra("inDescription")}</div>
              </div>
            </div>
          )
        })}
      </div>

      {result ? (
        <FeedbackStrip
          tone={result.passed ? "success" : "error"}
          title={result.passed ? t("passed") : t("failed")}
        />
      ) : null}
    </div>
  )
}

ToolDescriptionRunner.empty = emptyPayload
ToolDescriptionRunner.isComplete = (
  _exercise: ExerciseToolDescription,
  payload: ToolDescriptionPayload,
): boolean => payload.description.trim().length > 0
