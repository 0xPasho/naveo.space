"use client"

import { useTranslations } from "next-intl"

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

// `.debug-cause.wrong` is not in styles.css — fall back to inline overrides
// using the hazard-red token the rest of the design system uses.
const wrongRowStyle: React.CSSProperties = {
  borderColor: "var(--hazard-red)",
  background: "oklch(.65 .22 25 / .12)",
}
const wrongKeyStyle: React.CSSProperties = {
  background: "var(--hazard-red)",
  borderColor: "var(--hazard-red)",
  color: "oklch(0.97 0 0)",
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 10,
  letterSpacing: ".15em",
  textTransform: "uppercase",
  color: "var(--fg-dim)",
  marginBottom: 6,
}

const explanationLabelStyle: React.CSSProperties = {
  ...eyebrowStyle,
  marginTop: 6,
  marginBottom: 4,
}

export function MCPDebugRunner({ exercise, value, onChange, result }: Props) {
  const t = useTranslations("lessons.mcpDebug")
  const tExtra = useTranslations("lessons.mcpDebugExtra")

  const submitted = result !== null
  const pick = value.pick
  const correct = exercise.correct

  const handlePick = (id: string) => {
    if (submitted) return
    onChange({ kind: "mcp-debug", pick: id })
  }

  return (
    <>
      <div className="exer-head">
        <span className="kind">{tExtra("kind")}</span>
        <span className="lab">{tExtra("label")}</span>
      </div>

      <h2 className="exer-q">{t("question")}</h2>

      <div className="tdc-schema">
        <div className="ro">
          <span className="lock">{t("specHeader")}</span>
        </div>
        {exercise.toolSpec}
      </div>

      <div style={eyebrowStyle}>
        {t("causesHeader", { n: exercise.candidates.length })}
      </div>

      <div className="debug-causes">
        {exercise.candidates.map((c) => {
          const isPicked = pick === c.id
          const isCorrect = c.id === correct
          const showRight = submitted && isCorrect
          const showWrongPick = submitted && isPicked && !isCorrect

          const classes = ["debug-cause"]
          if (showRight) classes.push("right")
          else if (isPicked) classes.push("picked")

          return (
            <div
              key={c.id}
              className={classes.join(" ")}
              style={showWrongPick ? wrongRowStyle : undefined}
              onClick={() => handlePick(c.id)}
              role="button"
              tabIndex={submitted ? -1 : 0}
            >
              <div className="key" style={showWrongPick ? wrongKeyStyle : undefined}>
                {c.id}
              </div>
              <div className="desc">{c.label}</div>
            </div>
          )
        })}
      </div>

      {submitted ? (
        <div className={"lp-result " + (result.passed ? "pass" : "fail")}>
          <div className="ico">{result.passed ? "✓" : "✕"}</div>
          <div>
            <div className="lab">
              {result.passed ? t("passed") : t("failed")}
            </div>
            <div style={explanationLabelStyle}>{t("explanationHeader")}</div>
            {exercise.explanation}
          </div>
        </div>
      ) : null}
    </>
  )
}

MCPDebugRunner.empty = emptyPayload
MCPDebugRunner.isComplete = (
  _e: ExerciseMCPDebug,
  payload: MCPDebugPayload,
): boolean => payload.pick !== ""
