"use client"

import { useTranslations } from "next-intl"
import { Fragment, type ReactNode } from "react"

import { PromptEditor } from "@/common/components/prompt-editor"
import type { ExerciseTagFill } from "@/modules/content/types"

import type { AttemptResult, TagFillPayload } from "../../types"

type Props = {
  exercise: ExerciseTagFill
  value: TagFillPayload
  onChange: (next: TagFillPayload) => void
  result: AttemptResult | null
}

const emptyPayload = (): TagFillPayload => ({
  kind: "prompt-tag-fill",
  filled: "",
})

// Light XML token colorizer matching the design's `.xc` (comments), `.xt`
// (tag names), and `.xv` (mustache variables `{{x}}`) classes. Operates on a
// raw string and returns mixed strings + spans. Plain text is rendered as-is.
function colorXml(template: string): ReactNode[] {
  const tokens = /(<!--[\s\S]*?-->)|(<\/?)([\w-]+)([^>]*)>|(\{\{[^}]+\}\})/g
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = tokens.exec(template)) !== null) {
    if (m.index > last) out.push(template.slice(last, m.index))
    if (m[1]) {
      out.push(
        <span key={key++} className="xc">
          {m[1]}
        </span>,
      )
    } else if (m[5]) {
      out.push(
        <span key={key++} className="xv">
          {m[5]}
        </span>,
      )
    } else if (m[2] && m[3]) {
      out.push(
        <Fragment key={key++}>
          {m[2]}
          <span className="xt">{m[3]}</span>
          {m[4]}
          {">"}
        </Fragment>,
      )
    }
    last = tokens.lastIndex
  }
  if (last < template.length) out.push(template.slice(last))
  return out
}

export function PromptTagFillRunner({ exercise, value, onChange, result }: Props) {
  const t = useTranslations("lessons.tagFill")
  const xmlCheck = result?.checks.find((c) => c.id === "xml-well-formed")
  const tagsCheck = result?.checks.find((c) => c.id === "required-tags")

  return (
    <>
      <div className="exer-head">
        <span className="kind">{t("kind")}</span>
        <span className="lab">{t("label")}</span>
      </div>

      <h2 className="exer-q">{t("question")}</h2>

      <div className="tag-fill-doc">
        <span className="xc">{"<!-- prompt template -->"}</span>
        {"\n"}
        {colorXml(exercise.template)}
        {"\n\n"}
        <PromptEditor
          className="tag-hole"
          value={value.filled}
          onChange={(next) =>
            onChange({ kind: "prompt-tag-fill", filled: next })
          }
          language="xml"
          minHeight={180}
          placeholder={"<contexto>\n  <humano>...</humano>\n  <estado_animo>...</estado_animo>\n</contexto>"}
        />
      </div>

      {result ? (
        <div className="testcases">
          <div className="h">{t("validatorHeader")}</div>
          <div className={"tc-row " + (xmlCheck?.passed ? "pass" : "fail")}>
            <div className="pip">{xmlCheck?.passed ? "✓" : "✕"}</div>
            <div>{t("xmlOk")}</div>
            <div className="out">{xmlCheck?.passed ? t("pass") : t("fail")}</div>
          </div>
          <div className={"tc-row " + (tagsCheck?.passed ? "pass" : "fail")}>
            <div className="pip">{tagsCheck?.passed ? "✓" : "✕"}</div>
            <div>
              {t("requiredTags", {
                tags: exercise.requiredTags.map((tag) => `<${tag}>`).join(", "),
              })}
            </div>
            <div className="out">{tagsCheck?.passed ? t("pass") : t("fail")}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}

PromptTagFillRunner.empty = emptyPayload
PromptTagFillRunner.isComplete = (
  _exercise: ExerciseTagFill,
  value: TagFillPayload,
): boolean => value.filled.trim().length > 0
