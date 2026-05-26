"use client"

import { useTranslations } from "next-intl"

import { PromptEditor } from "@/common/components/prompt-editor"
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
    <>
      <div className="exer-head">
        <span className="kind">{tExtra("kind")}</span>
        <span className="lab">{tExtra("label")}</span>
      </div>

      <h2 className="exer-q">
        {t("instruction", { tool: exercise.toolName })}
      </h2>

      <div className="tdc-schema">
        <div className="ro">
          <span className="lock">{t("specHeader")}</span>
        </div>
        {exercise.context}
      </div>

      <div>
        <div
          className="eyebrow"
          style={{
            marginBottom: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: ".15em",
            textTransform: "uppercase",
            color: "var(--fg-dim)",
          }}
        >
          {t("editHeader")}
        </div>
        <PromptEditor
          className="tdc-desc-input"
          value={desc}
          onChange={(next) =>
            onChange({ kind: "tool-description", description: next })
          }
          language="markdown"
          minHeight={140}
        />
      </div>

      <div className="tdc-tasks">
        <div
          className="h"
          style={{
            padding: "8px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: "var(--fg-dim)",
            borderBottom: "1px solid var(--border)",
            background: "oklch(0.08 0.025 240 / 60%)",
          }}
        >
          {t("taskHeader", { n: exercise.requiredPhrases.length })}
        </div>
        {exercise.requiredPhrases.map((phrase, i) => {
          const id = `phrase:${phrase}`
          const submitted = checkById.get(id)
          // expected is always "yes" — the phrase MUST appear.
          const actual: "yes" | "no" = submitted
            ? submitted.passed
              ? "yes"
              : "no"
            : liveActual(phrase)
          const ok = actual === "yes"
          const rowClass = `tdc-task expect-yes actual-${actual}`
          return (
            <div key={id} className={rowClass}>
              <div
                className="pip"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 6,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: 11,
                  background: ok
                    ? "oklch(0.72 0.16 145 / 16%)"
                    : "var(--card-raised)",
                  border:
                    "1px solid " +
                    (ok ? "var(--crew-green)" : "var(--border-strong)"),
                  color: ok ? "var(--crew-green)" : "var(--fg-dim)",
                }}
              >
                {ok ? "✓" : `${i + 1}`}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--fg)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                &quot;{phrase}&quot;
              </div>
              <div className="ex">
                {ok ? tExtra("present") : tExtra("missing")}
                <br />
                {tExtra("inDescription")}
              </div>
            </div>
          )
        })}
      </div>

      {result ? (
        <div className={"lp-result " + (result.passed ? "pass" : "fail")}>
          <div className="ico">{result.passed ? "✓" : "✕"}</div>
          <div>
            <div className="lab">{result.passed ? "PASS" : "FAIL"}</div>
            {result.passed ? t("passed") : t("failed")}
          </div>
        </div>
      ) : null}
    </>
  )
}

ToolDescriptionRunner.empty = emptyPayload
ToolDescriptionRunner.isComplete = (
  _exercise: ExerciseToolDescription,
  payload: ToolDescriptionPayload,
): boolean => payload.description.trim().length > 0
