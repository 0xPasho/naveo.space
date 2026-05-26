"use client"

import { useTranslations } from "next-intl"
import { Fragment, type ReactNode } from "react"

import { ExerciseQuestion } from "@/common/components/exercise-question"
import { PromptEditor } from "@/common/components/prompt-editor"
import { Eyebrow } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
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

// Light XML token colorizer matching the legacy `.xc` (comments), `.xt`
// (tag names), and `.xv` (mustache variables `{{x}}`) classes — now
// implemented inline with Naveo ink/track tokens.
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
        <span key={key++} className="text-ink-3 italic">
          {m[1]}
        </span>,
      )
    } else if (m[5]) {
      out.push(
        <span key={key++} className="text-stat-xp font-semibold">
          {m[5]}
        </span>,
      )
    } else if (m[2] && m[3]) {
      out.push(
        <Fragment key={key++}>
          {m[2]}
          <span className="text-track-prompting font-semibold">{m[3]}</span>
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
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <Eyebrow>{t("kind")}</Eyebrow>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {t("label")}
        </span>
      </div>

      <ExerciseQuestion text={t("question")} />

      <div className="flex flex-col gap-3 rounded-md border-2 border-line-soft bg-bg-sunken p-4 shadow-elev-inset">
        <pre className="m-0 whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink-2">
          <span className="text-ink-3 italic">{"<!-- prompt template -->"}</span>
          {"\n"}
          {colorXml(exercise.template)}
        </pre>
        <PromptEditor
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
        <div className="overflow-hidden rounded-md border-2 border-line-soft bg-bg-surface">
          <div className="border-b-2 border-line-soft bg-bg-raised px-4 py-2">
            <Eyebrow>{t("validatorHeader")}</Eyebrow>
          </div>
          <TestcaseRow
            passed={Boolean(xmlCheck?.passed)}
            label={t("xmlOk")}
            verdict={xmlCheck?.passed ? t("pass") : t("fail")}
          />
          <TestcaseRow
            passed={Boolean(tagsCheck?.passed)}
            label={t("requiredTags", {
              tags: exercise.requiredTags.map((tag) => `<${tag}>`).join(", "),
            })}
            verdict={tagsCheck?.passed ? t("pass") : t("fail")}
          />
        </div>
      ) : null}
    </div>
  )
}

function TestcaseRow({
  passed,
  label,
  verdict,
}: {
  passed: boolean
  label: ReactNode
  verdict: ReactNode
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t-2 border-line-soft px-4 py-3 first:border-t-0",
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
      <div className="font-sans text-sm font-semibold text-ink-1">{label}</div>
      <div
        className={cn(
          "font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
          passed ? "text-success" : "text-danger",
        )}
      >
        {verdict}
      </div>
    </div>
  )
}

PromptTagFillRunner.empty = emptyPayload
PromptTagFillRunner.isComplete = (
  _exercise: ExerciseTagFill,
  value: TagFillPayload,
): boolean => value.filled.trim().length > 0
