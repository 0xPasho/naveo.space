"use client"

import { useTranslations } from "next-intl"

import type { ExercisePromptAssemble } from "@/modules/content/types"

import type { AttemptResult, PromptAssemblePayload } from "../../types"

type Props = {
  exercise: ExercisePromptAssemble
  value: PromptAssemblePayload
  onChange: (next: PromptAssemblePayload) => void
  result: AttemptResult | null
}

// Fisher-Yates shuffle. Pure — operates on a copy.
const shuffleIds = (ids: string[]): string[] => {
  const out = [...ids]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const emptyPayload = (
  exercise: ExercisePromptAssemble,
): PromptAssemblePayload => ({
  kind: "prompt-assemble",
  order: shuffleIds(exercise.tokens.map((t) => t.id)),
})

const moveOrder = (
  order: string[],
  index: number,
  direction: -1 | 1,
): string[] | null => {
  const j = index + direction
  if (j < 0 || j >= order.length) return null
  const next = [...order]
  ;[next[index], next[j]] = [next[j], next[index]]
  return next
}

export function PromptAssembleRunner({
  exercise,
  value,
  onChange,
  result,
}: Props) {
  const t = useTranslations("lessons.assemble")
  const showResult = Boolean(result)
  const passed = Boolean(result?.passed)

  const tokensById = new Map(exercise.tokens.map((tok) => [tok.id, tok]))
  const correctIndexById = new Map(
    exercise.tokens.map((tok, idx) => [tok.id, idx]),
  )

  const move = (index: number, direction: -1 | 1) => {
    const next = moveOrder(value.order, index, direction)
    if (!next) return
    onChange({ kind: "prompt-assemble", order: next })
  }

  return (
    <>
      <div className="exer-head">
        <span className="kind">{t("kind")}</span>
        <span className="lab">{t("label")}</span>
      </div>

      <h2 className="exer-q">{exercise.task}</h2>

      <div className="assemble-list">
        {value.order.map((id, i) => {
          const tok = tokensById.get(id)
          if (!tok) return null
          const isCorrectPos = correctIndexById.get(id) === i
          const rowClass = showResult
            ? isCorrectPos
              ? "assemble-row correct"
              : "assemble-row wrong"
            : "assemble-row"
          const rowStyle =
            showResult && !isCorrectPos
              ? {
                  borderColor: "var(--hazard-red)",
                  background: "oklch(.65 .22 25 / .14)",
                }
              : undefined

          return (
            <div key={id} className={rowClass} style={rowStyle}>
              <div className="num">{i + 1}</div>
              <div>
                <div
                  className="eyebrow gold"
                  style={{
                    fontSize: 9.5,
                    color:
                      showResult && isCorrectPos
                        ? "var(--crew-green)"
                        : "var(--brand-gold)",
                    marginBottom: 4,
                  }}
                >
                  {tok.label}
                </div>
                {tok.kind ? (
                  <div
                    style={{
                      whiteSpace: "pre-line",
                      color: "var(--fg)",
                      fontSize: 12.5,
                    }}
                  >
                    {tok.kind}
                  </div>
                ) : null}
              </div>
              <div className="arrows">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || showResult}
                  aria-label={t("moveUp")}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.order.length - 1 || showResult}
                  aria-label={t("moveDown")}
                >
                  ▼
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showResult ? (
        <div className={passed ? "lp-result pass" : "lp-result fail"}>
          <div className="ico">{passed ? "✓" : "×"}</div>
          <div>
            <div className="lab">Echo · check</div>
            {passed ? t("passed") : t("failed")}
          </div>
        </div>
      ) : null}
    </>
  )
}

PromptAssembleRunner.empty = emptyPayload
PromptAssembleRunner.isComplete = (
  exercise: ExercisePromptAssemble,
  payload: PromptAssemblePayload,
): boolean => payload.order.length === exercise.tokens.length
