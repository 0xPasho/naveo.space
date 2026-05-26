"use client"

import { ArrowRight, Pause, Play, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { Button, Card } from "@/common/components/ui"
import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"
import { isCrewSlug } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

import { DemoPresenterHeader } from "../_shared/presenter-header"

type Node = {
  id: string
  label: string
  prompt: string
  output: string
}

const isNode = (v: unknown): v is Node => {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  return (
    typeof r.id === "string" &&
    typeof r.label === "string" &&
    typeof r.prompt === "string" &&
    typeof r.output === "string"
  )
}

type Props = {
  props?: Record<string, unknown>
}

const STEP_MS = 700

export default function ChainFlowDemo({ props }: Props) {
  const t = useTranslations("lessons.demos.chainFlow")
  const nodes =
    props && Array.isArray(props.nodes)
      ? (props.nodes as unknown[]).filter(isNode)
      : []
  const presenter = isCrewSlug(props?.presenter as string)
    ? (props?.presenter as CrewSlug)
    : "orbit"
  const intent = typeof props?.intent === "string" ? props.intent : null

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  if (nodes.length === 0) {
    return (
      <Card className="border-dashed px-4 py-6 text-sm text-ink-3">
        {t("missingNodes")}
      </Card>
    )
  }

  const selected = nodes.find((n) => n.id === selectedId) ?? null

  const stopTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }

  const onPlay = () => {
    stopTimer()
    setPlaying(true)
    setActiveIndex(0)
    setSelectedId(nodes[0].id)
    const tick = (i: number) => {
      if (i >= nodes.length) {
        setPlaying(false)
        timer.current = null
        return
      }
      setActiveIndex(i)
      setSelectedId(nodes[i].id)
      timer.current = setTimeout(() => tick(i + 1), STEP_MS)
    }
    timer.current = setTimeout(() => tick(1), STEP_MS)
  }

  const onPause = () => {
    stopTimer()
    setPlaying(false)
  }

  const onReset = () => {
    stopTimer()
    setPlaying(false)
    setActiveIndex(null)
    setSelectedId(null)
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={playing ? onPause : onPlay}
              aria-label={playing ? t("pause") : t("play")}
            >
              {playing ? <Pause /> : <Play />}
              {playing ? t("pause") : t("play")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={activeIndex === null && !playing}
              aria-label={t("reset")}
            >
              <RotateCcw />
            </Button>
          </div>
        </header>

        <div className="flex items-stretch gap-1.5 overflow-x-auto bg-bg-sunken/50 px-3 py-4">
          {nodes.map((node, i) => {
            const isActive = activeIndex === i
            const isSelected = selectedId === node.id
            const isPast = activeIndex !== null && i < activeIndex
            return (
              <div key={node.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onPause()
                    setSelectedId(node.id)
                    setActiveIndex(i)
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    "min-w-[120px] shrink-0 rounded-md border-2 px-3 py-2 text-left transition-all",
                    isSelected
                      ? "border-track-prompting/60 bg-track-prompting/10 shadow-[0_0_32px_-12px_var(--track-prompting)]"
                      : isPast
                        ? "border-stat-xp/30 bg-stat-xp/5"
                        : "border-line-soft bg-bg-raised hover:border-line-strong",
                    isActive && playing
                      ? "animate-attempt-pass"
                      : null,
                  )}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
                    {t("nodeLabel", { n: i + 1 })}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-display text-sm font-bold leading-tight",
                      isSelected ? "text-track-prompting" : "text-ink-1",
                    )}
                  >
                    {node.label}
                  </p>
                </button>
                {i < nodes.length - 1 ? (
                  <ArrowRight
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      activeIndex !== null && i < activeIndex
                        ? "text-stat-xp"
                        : "text-ink-4",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </Card>

      {selected ? (
        <Card
          key={selected.id}
          className="animate-attempt-pass space-y-3 p-3"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-track-prompting">
              {t("promptLabel")} · {selected.label}
            </p>
            <div className="mt-2">
              <PromptEditor
                value={selected.prompt}
                readOnly
                language="markdown"
                minHeight={80}
                maxHeight={200}
                className="bg-bg-sunken"
              />
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stat-xp">
              {t("outputLabel")}
            </p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-bg-sunken px-3 py-2 font-mono text-xs leading-relaxed text-ink-1">
              {selected.output}
            </pre>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed p-3 text-center text-xs text-ink-3">
          {t("selectHint")}
        </Card>
      )}
    </div>
  )
}
