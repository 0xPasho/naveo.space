"use client"

import { useTranslations } from "next-intl"
import type { CSSProperties } from "react"

import type { ExerciseAB } from "@/modules/content/types"

import type { ABPayload, AttemptResult } from "../../types"

type Props = {
  exercise: ExerciseAB
  value: ABPayload
  onChange: (next: ABPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): ABPayload => ({ kind: "prompt-AB", choice: "A" })

const pairStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
}

const cardBaseStyle: CSSProperties = {
  padding: 14,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const badgeStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 7,
  background: "var(--card-raised)",
  border: "1px solid var(--border)",
  display: "grid",
  placeItems: "center",
  fontFamily: "var(--font-mono)",
  fontWeight: 700,
  fontSize: 12,
}

const preStyle: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  lineHeight: 1.55,
  color: "var(--fg)",
  whiteSpace: "pre-wrap",
  background: "transparent",
  border: 0,
  padding: 0,
}

const eyebrowStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--fg-dim)",
  margin: 0,
}

export function PromptABRunner({ exercise, value, onChange, result }: Props) {
  const t = useTranslations("lessons.ab")
  const showResult = Boolean(result)
  const correct = exercise.correct

  const stateFor = (letter: "A" | "B"): "neutral" | "correct" | "wrong" => {
    if (!showResult) return "neutral"
    if (letter === correct) return "correct"
    if (value.choice === letter && letter !== correct) return "wrong"
    return "neutral"
  }

  const renderCard = (letter: "A" | "B", text: string) => {
    const state = stateFor(letter)
    const isPicked = value.choice === letter
    const border =
      state === "correct"
        ? "1px solid var(--crew-green)"
        : state === "wrong"
          ? "1px solid var(--hazard-red)"
          : isPicked
            ? "1px solid var(--brand-cyan)"
            : "1px solid var(--border)"
    const background =
      state === "correct"
        ? "var(--success-soft)"
        : state === "wrong"
          ? "oklch(.65 .22 25 / .14)"
          : isPicked
            ? "var(--brand-cyan-soft)"
            : "var(--card-sunk)"

    return (
      <div
        key={letter}
        onClick={() => onChange({ kind: "prompt-AB", choice: letter })}
        className="ab-card"
        style={{ ...cardBaseStyle, border, background }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={badgeStyle}>{letter}</span>
          <span style={eyebrowStyle}>
            {letter === "A" ? t("variantA") : t("variantB")}
          </span>
        </div>
        <pre style={preStyle}>{text}</pre>
      </div>
    )
  }

  return (
    <>
      <div className="exer-head">
        <span className="kind">{t("kind")}</span>
        <span className="lab">{t("label")}</span>
      </div>

      <h2 className="exer-q">{exercise.question}</h2>

      <div style={pairStyle}>
        {renderCard("A", exercise.optionA)}
        {renderCard("B", exercise.optionB)}
      </div>

      <div className="ab-rubric">
        <div className="eyebrow gold">{t("rubricEyebrow")}</div>
        <div className="hint">{t("rubricHint")}</div>
      </div>

      {showResult && result?.passed ? (
        <div className="lp-result pass">
          <div className="ico">✓</div>
          <div>
            <div className="lab">Echo · check</div>
            {exercise.explanation}
          </div>
        </div>
      ) : null}

      {showResult && !result?.passed ? (
        <div className="lp-result fail">
          <div className="ico">✕</div>
          <div>
            <div className="lab">Echo · check</div>
            {exercise.explanation}
          </div>
        </div>
      ) : null}
    </>
  )
}

PromptABRunner.empty = emptyPayload
PromptABRunner.isComplete = (
  _exercise: ExerciseAB,
  _value: ABPayload,
): boolean => {
  // AB has a default choice ("A") so it's always complete enough to submit.
  void _exercise
  void _value
  return true
}
