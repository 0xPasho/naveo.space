"use client"

import { useTranslations } from "next-intl"

import { PromptEditor } from "@/common/components/prompt-editor"
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
    <>
      <div className="exer-head">
        <span className="kind">{tTask("kind")}</span>
        <span className="lab">
          {tTask("label", { n: exercise.testCases.length })}
        </span>
      </div>

      <h2 className="exer-q">{exercise.task}</h2>

      <PromptEditor
        className="task-input"
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--fg-dim)",
          letterSpacing: ".12em",
          textTransform: "uppercase",
        }}
      >
        <span>{t("prompt.count", { count: value.promptText.length })}</span>
        <span>{t("prompt.hint", { token: "{{input}}" })}</span>
      </div>

      <div className="testcases">
        <div className="h">
          {tTask("rubricHeader", {
            cases: exercise.testCases.length,
            criteria: exercise.rubric.length,
          })}
        </div>
        {exercise.testCases.map((tc, i) => {
          const out = outputs?.[i]?.output
          const hasResult = Boolean(result) && Boolean(out)
          const rowClass = hasResult
            ? result?.passed
              ? "tc-row pass"
              : "tc-row fail"
            : "tc-row"
          const pip = hasResult ? (result?.passed ? "✓" : "✕") : `#${i + 1}`
          return (
            <div key={i} className={rowClass}>
              <div className="pip">{pip}</div>
              <div>
                <div
                  style={{
                    color: "var(--fg)",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  &quot;{truncate(tc.input, 72)}&quot;
                </div>
                {out ? (
                  <div
                    style={{
                      color: "var(--fg-dim)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      marginTop: 3,
                      whiteSpace: "pre-wrap",
                      maxHeight: 140,
                      overflow: "auto",
                    }}
                  >
                    <span style={{ letterSpacing: ".12em" }}>
                      {t("cases.output").toUpperCase()}:
                    </span>{" "}
                    <span style={{ color: "var(--fg)" }}>{out}</span>
                  </div>
                ) : null}
              </div>
              <div className="out">{tTask("caseTag", { n: i + 1 })}</div>
            </div>
          )
        })}
      </div>

      {submitting ? (
        <div className="run-box">
          <span className="who">ECHO</span>{" "}
          <span className="out">
            {t("evaluating", { count: exercise.testCases.length })}
          </span>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="testcases">
            <div className="h">
              {tTask("criteriaHeader", { n: result.checks.length })}
            </div>
            {result.checks.map((c) => {
              const display = translateReason(tChecks, c.reason)
              return (
                <div
                  key={c.id}
                  className={"tc-row " + (c.passed ? "pass" : "fail")}
                >
                  <div className="pip">{c.passed ? "✓" : "✕"}</div>
                  <div>
                    <div
                      style={{
                        color: "var(--fg)",
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {c.id}
                    </div>
                    {display ? (
                      <div
                        style={{
                          color: "var(--fg-dim)",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          marginTop: 3,
                        }}
                      >
                        {display}
                      </div>
                    ) : null}
                  </div>
                  <div className="out">{c.passed ? "PASS" : "FAIL"}</div>
                </div>
              )
            })}
          </div>

          <div className={"lp-result " + (result.passed ? "pass" : "fail")}>
            <div className="ico">{result.passed ? "✓" : "✕"}</div>
            <div>
              <div className="lab">
                {result.passed
                  ? t("console.passed")
                  : t("console.ready")}
              </div>
              {result.passed
                ? t("crew.promptTaskPassed")
                : t("crew.promptTask")}
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}

PromptTaskRunner.empty = emptyPayload
PromptTaskRunner.isComplete = (
  _exercise: ExercisePromptTask,
  value: PromptTaskPayload,
): boolean => value.promptText.trim().length > 10
