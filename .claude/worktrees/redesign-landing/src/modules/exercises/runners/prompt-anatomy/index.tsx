"use client"

import { useTranslations } from "next-intl"
import { useMemo } from "react"

import type { ExerciseAnatomy } from "@/modules/content/types"

import type { AnatomyPayload, AttemptResult } from "../../types"

type Props = {
  exercise: ExerciseAnatomy
  value: AnatomyPayload
  onChange: (next: AnatomyPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): AnatomyPayload => ({
  kind: "prompt-anatomy",
  assignments: {},
})

export function PromptAnatomyRunner({ exercise, value, onChange, result }: Props) {
  const t = useTranslations("lessons.anatomy")
  const labels = useMemo(
    () =>
      Array.from(new Set(exercise.parts.map((p) => p.label))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [exercise.parts],
  )

  const wrongPartIds = useMemo(() => {
    if (!result) return new Set<string>()
    const r = result.checks.find((c) => c.id === "labels-correct")
    if (!r || r.passed || !r.reason?.startsWith("wrong:")) return new Set<string>()
    return new Set(r.reason.replace("wrong:", "").split(","))
  }, [result])

  const used = useMemo(
    () => new Set(Object.values(value.assignments).filter(Boolean)),
    [value.assignments],
  )

  const setAssignment = (partId: string, label: string) => {
    onChange({
      ...value,
      assignments: { ...value.assignments, [partId]: label },
    })
  }

  const cycleSlot = (partId: string) => {
    const current = value.assignments[partId]
    const remaining = labels.filter((l) => l === current || !used.has(l))
    if (remaining.length === 0) return
    const i = current ? remaining.indexOf(current) : -1
    const next = remaining[(i + 1) % remaining.length]
    setAssignment(partId, next)
  }

  return (
    <>
      <div className="exer-head">
        <span className="kind">{t("kind")}</span>
        <span className="lab">{t("label")}</span>
      </div>
      <h2 className="exer-q">{t("question")}</h2>

      <div className="label-tray">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            className={"label-chip " + (used.has(label) ? "used" : "")}
          >
            <span className="dot" />
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {exercise.parts.map((part) => {
          const chosen = value.assignments[part.id]
          const isWrong = wrongPartIds.has(part.id)
          const isCorrect = result?.passed && Boolean(chosen)
          const slotState = isWrong
            ? "wrong"
            : isCorrect
              ? "correct"
              : chosen
                ? "filled"
                : ""
          return (
            <div key={part.id} className="anatomy-block">
              <button
                type="button"
                className={"slot " + slotState}
                onClick={() => cycleSlot(part.id)}
              >
                {chosen || t("slotEmpty")}
              </button>
              <pre className="text" style={{ whiteSpace: "pre-line", margin: 0 }}>
                {part.text}
              </pre>
            </div>
          )
        })}

        {result?.passed ? (
          <div className="lp-result pass">
            <div className="ico">✓</div>
            <div>
              <div className="lab">Echo · check</div>
              {t("passed")}
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

PromptAnatomyRunner.empty = emptyPayload
PromptAnatomyRunner.isComplete = (
  exercise: ExerciseAnatomy,
  value: AnatomyPayload,
): boolean => exercise.parts.every((p) => Boolean(value.assignments[p.id]))
