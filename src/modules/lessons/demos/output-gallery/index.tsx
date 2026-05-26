"use client"

import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  type LucideIcon,
  Radio,
  ShieldCheck,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button, Card } from "@/common/components/ui"
import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"
import { isCrewSlug } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

import { DemoPresenterHeader } from "../_shared/presenter-header"

type Case = {
  title: string
  prompt: string
  output: string
  why: string
}

const isCase = (v: unknown): v is Case => {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  return (
    typeof r.title === "string" &&
    typeof r.prompt === "string" &&
    typeof r.output === "string" &&
    typeof r.why === "string"
  )
}

type Props = {
  props?: Record<string, unknown>
}

export default function OutputGalleryDemo({ props }: Props) {
  const t = useTranslations("lessons.demos.outputGallery")
  const cases =
    props && Array.isArray(props.cases)
      ? (props.cases as unknown[]).filter(isCase)
      : []
  const presenter =
    props && isCrewSlug(props.presenter as string)
      ? (props.presenter as CrewSlug)
      : null
  const intent =
    props && typeof props.intent === "string" ? props.intent : null

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  if (cases.length === 0) {
    return (
      <Card className="border-dashed px-4 py-6 text-sm text-ink-3">
        {t("missingCases")}
      </Card>
    )
  }

  const current = cases[index]
  const isRevealed = revealed.has(index)

  const reveal = () => {
    setRevealed((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }

  const go = (delta: number) => {
    const next = (index + delta + cases.length) % cases.length
    setIndex(next)
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        {presenter ? (
          <DemoPresenterHeader slug={presenter} intent={intent ?? undefined} />
        ) : null}
        <header className="flex items-start justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-track-prompting">
              {t("title")}
            </p>
            <h2 className="mt-1 truncate font-display text-lg font-bold leading-tight text-ink-1">
              {current.title}
            </h2>
          </div>
          <div className="rounded-md border-2 border-danger/40 bg-danger-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-danger">
            {t("caseCounter", { n: index + 1, total: cases.length })}
          </div>
        </header>

        <div className="flex items-center justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            <AlertOctagon className="size-3 text-danger" />
            {t("failBadge")}
          </div>
          <div className="flex gap-1">
            {cases.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("gotoCase", { n: i + 1 })}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index
                    ? "w-6 bg-stat-xp"
                    : revealed.has(i)
                      ? "w-1.5 bg-stat-xp/40"
                      : "w-1.5 bg-line-strong",
                )}
              />
            ))}
          </div>
        </div>

        <div key={index} className="animate-attempt-pass">
          <PanelHeader
            icon={Radio}
            label={t("promptLabel")}
            value={`${current.prompt.length} chars`}
          />
          <PromptEditor
            value={current.prompt}
            readOnly
            language="markdown"
            minHeight={120}
            maxHeight={240}
            className="bg-bg-sunken"
          />
          <PanelHeader
            icon={FileText}
            label={t("outputLabel")}
            value={`${current.output.length} chars`}
          />
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words bg-danger-soft px-3 py-2.5 font-mono text-xs leading-relaxed text-ink-1">
            {current.output}
          </pre>
        </div>
      </Card>

      {isRevealed ? (
        <Card className="border-stat-xp/30 bg-stat-xp/5 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stat-xp">
            <ShieldCheck className="mr-1 inline size-3" aria-hidden />
            {t("diagnosisLabel")}
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink-1">
            {current.why}
          </p>
        </Card>
      ) : (
        <Card className="p-3 text-center">
          <p className="mb-2 font-sans text-xs leading-relaxed text-ink-3">
            {t("reveal")}
          </p>
          <Button variant="outline" size="sm" onClick={reveal}>
            <Eye />
            {t("showDiagnosis")}
          </Button>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(-1)}
          aria-label={t("prevAria")}
        >
          <ChevronLeft />
          {t("prev")}
        </Button>
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
          {t("progress", { revealed: revealed.size, total: cases.length })}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => go(1)}
          aria-label={t("nextAria")}
        >
          {t("next")}
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

function PanelHeader({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border-2 border-track-prompting/25 text-track-prompting">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
          {label}
        </p>
      </div>
      <p className="font-mono text-[10px] tabular-nums text-ink-3">
        {value}
      </p>
    </div>
  )
}
