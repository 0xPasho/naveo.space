"use client"

import { Highlighter, MousePointerClick } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Card } from "@/common/components/ui"
import { cn } from "@/common/lib/utils"
import { isCrewSlug } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

import { DemoPresenterHeader } from "../_shared/presenter-header"

type Part = {
  range: [number, number]
  label: string
  explanation: string
}

const isPart = (v: unknown): v is Part => {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  return (
    Array.isArray(r.range) &&
    r.range.length === 2 &&
    typeof r.range[0] === "number" &&
    typeof r.range[1] === "number" &&
    r.range[0] < r.range[1] &&
    typeof r.label === "string" &&
    typeof r.explanation === "string"
  )
}

type Props = {
  props?: Record<string, unknown>
}

export default function PromptAnnotateDemo({ props }: Props) {
  const t = useTranslations("lessons.demos.promptAnnotate")
  const prompt = typeof props?.prompt === "string" ? props.prompt : ""
  const parts =
    props && Array.isArray(props.parts)
      ? (props.parts as unknown[]).filter(isPart).sort((a, b) => a.range[0] - b.range[0])
      : []
  const presenter = isCrewSlug(props?.presenter as string)
    ? (props?.presenter as CrewSlug)
    : "vega"
  const intent = typeof props?.intent === "string" ? props.intent : null

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  if (!prompt || parts.length === 0) {
    return (
      <Card className="border-dashed px-4 py-6 text-sm text-ink-3">
        {t("missingParts")}
      </Card>
    )
  }

  const segments = buildSegments(prompt, parts)
  const active = activeIndex !== null ? parts[activeIndex] : null

  const onReveal = (i: number) => {
    setActiveIndex(i)
    setRevealed((prev) => {
      if (prev.has(i)) return prev
      const next = new Set(prev)
      next.add(i)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <DemoPresenterHeader slug={presenter} intent={intent ?? undefined} />

        <header className="flex items-start justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-track-prompting">
              {t("eyebrow")}
            </p>
            <h2 className="mt-0.5 truncate font-display text-base font-bold leading-tight text-ink-1">
              {t("title")}
            </h2>
          </div>
          <div className="flex gap-1" aria-hidden>
            {parts.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === activeIndex
                    ? "w-6 bg-stat-xp"
                    : revealed.has(i)
                      ? "w-1.5 bg-stat-xp/40"
                      : "w-1.5 bg-line-strong",
                )}
              />
            ))}
          </div>
        </header>

        <div className="flex items-center gap-2 border-b-2 border-line-soft bg-bg-sunken/60 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
          <MousePointerClick className="size-3 text-track-prompting" />
          {t("hint")}
        </div>

        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words bg-bg-sunken/50 px-3 py-3 font-mono text-xs leading-relaxed text-ink-1">
          {segments.map((seg, i) =>
            seg.partIndex === null ? (
              <span key={`p-${i}`}>{seg.text}</span>
            ) : (
              <button
                key={`a-${i}`}
                type="button"
                onClick={() => onReveal(seg.partIndex!)}
                aria-label={parts[seg.partIndex!].label}
                aria-pressed={activeIndex === seg.partIndex}
                className={cn(
                  "rounded-sm px-0.5 transition-colors",
                  activeIndex === seg.partIndex
                    ? "bg-stat-xp/30 text-ink-1 ring-1 ring-stat-xp/60"
                    : revealed.has(seg.partIndex!)
                      ? "bg-stat-xp/10 text-ink-1 hover:bg-stat-xp/20"
                      : "bg-track-prompting/10 text-ink-1 underline decoration-track-prompting/50 decoration-dotted underline-offset-2 hover:bg-track-prompting/20",
                )}
              >
                {seg.text}
              </button>
            ),
          )}
        </pre>
      </Card>

      {active ? (
        <Card
          key={activeIndex ?? "none"}
          className="animate-attempt-pass border-stat-xp/30 bg-stat-xp/5 p-3"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stat-xp">
            <Highlighter className="mr-1 inline size-3" aria-hidden />
            {active.label}
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-ink-1">
            {active.explanation}
          </p>
        </Card>
      ) : (
        <Card className="border-dashed p-3 text-center text-xs text-ink-3">
          {t("revealLabel")}
        </Card>
      )}

      <p className="text-center font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {t("progress", { revealed: revealed.size, total: parts.length })}
      </p>
    </div>
  )
}

type Segment = { text: string; partIndex: number | null }

function buildSegments(prompt: string, parts: Part[]): Segment[] {
  const out: Segment[] = []
  let cursor = 0
  parts.forEach((part, i) => {
    const [start, end] = part.range
    if (start > cursor) {
      out.push({ text: prompt.slice(cursor, start), partIndex: null })
    }
    out.push({ text: prompt.slice(start, end), partIndex: i })
    cursor = end
  })
  if (cursor < prompt.length) {
    out.push({ text: prompt.slice(cursor), partIndex: null })
  }
  return out
}
