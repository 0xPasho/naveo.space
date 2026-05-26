"use client"

import {
  Braces,
  Clock3,
  Copy,
  FileText,
  type LucideIcon,
  Loader2,
  Play,
  Radio,
  RotateCcw,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"

import { Button } from "@/common/components/ui/button"
import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"
import { CAST } from "@/modules/cast/data"
import { CrewMascotPlaceholder } from "@/modules/home/ship-system-hero"

import { runPlayground } from "./actions"

type Props = {
  props?: Record<string, unknown>
}

type PlaygroundRun = {
  id: number
  prompt: string
  output: string
  createdAt: Date
  promptChars: number
  outputChars: number
}

const errorMessage = (
  err: Exclude<Awaited<ReturnType<typeof runPlayground>>, { ok: true }>["error"],
  t: (k: string) => string,
): string => {
  switch (err) {
    case "unauthorized":
      return t("errors.unauthorized")
    case "rate_limited":
      return t("errors.rateLimited")
    case "invalid_input":
      return t("errors.invalidInput")
    case "model_error":
      return t("errors.modelError")
  }
}

export default function PromptPlaygroundDemo({ props }: Props) {
  const starter = typeof props?.starter === "string" ? props.starter : ""
  const note = typeof props?.note === "string" ? props.note : null

  const t = useTranslations("lessons")
  const tp = useTranslations("lessons.playground")
  const [prompt, setPrompt] = useState(starter)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runs, setRuns] = useState<PlaygroundRun[]>([])
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null
  const displayOutput = selectedRun?.output ?? output
  const hasEditedStarter = starter.length > 0 && prompt !== starter
  const lastRun = runs[0] ?? null
  const previousRun = runs[1] ?? null
  const promptDelta =
    lastRun && previousRun
      ? lastRun.promptChars - previousRun.promptChars
      : null
  const echo = CAST.find((member) => member.slug === "echo") ?? CAST[0]

  const onRun = () => {
    if (!prompt.trim() || pending) return
    setError(null)
    setSelectedRunId(null)
    startTransition(async () => {
      try {
        const res = await runPlayground({ prompt })
        if (res.ok) {
          const nextRun: PlaygroundRun = {
            id: Date.now(),
            prompt,
            output: res.output,
            createdAt: new Date(),
            promptChars: prompt.length,
            outputChars: res.output.length,
          }
          setOutput(res.output)
          setRuns((current) => [nextRun, ...current].slice(0, 6))
          setSelectedRunId(nextRun.id)
        } else {
          setError(errorMessage(res.error, t))
        }
      } catch {
        setError(t("errors.network"))
      }
    })
  }

  const onReset = () => {
    setPrompt(starter)
    setOutput(null)
    setError(null)
    setSelectedRunId(null)
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-white/10 bg-background/85 shadow-2xl shadow-black/20">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 bg-black/30 px-3 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--brand-cyan)]">
              {tp("console.kicker")}
            </p>
            <h2 className="mt-1 text-lg font-bold leading-tight">
              {tp("console.title")}
            </h2>
          </div>
          <div
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
              pending
                ? "border-[color:var(--brand-cyan)]/40 text-[color:var(--brand-cyan)]"
                : "border-[color:var(--brand-gold)]/30 text-[color:var(--brand-gold)]",
            )}
          >
            {pending ? tp("console.transmitting") : tp("console.ready")}
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
            <PanelHeader
              icon={Radio}
              label={tp("prompt.label")}
              value={tp("prompt.count", { count: prompt.length })}
            />
            <PromptEditor
              value={prompt}
              onChange={setPrompt}
              readOnly={pending}
              language="markdown"
              minHeight={320}
              className={cn(
                "bg-black/20 transition-opacity",
                pending && "cursor-wait opacity-70",
              )}
              placeholder={tp("prompt.placeholder")}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/20 px-3 py-2">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <Braces className="size-3 text-[color:var(--brand-cyan)]" />
                {tp("prompt.hint")}
              </div>
              <div className="flex items-center gap-2">
                {hasEditedStarter ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    disabled={pending}
                  >
                    <RotateCcw />
                    {tp("actions.reset")}
                  </Button>
                ) : null}
                <Button
                  variant="default"
                  size="sm"
                  onClick={onRun}
                  disabled={!prompt.trim() || pending}
                >
                  {pending ? <Loader2 className="animate-spin" /> : <Play />}
                  {tp("actions.run")}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col">
            <PanelHeader
              icon={FileText}
              label={tp("output.label")}
              value={
                displayOutput
                  ? tp("output.count", { count: displayOutput.length })
                  : tp("output.emptyStatus")
              }
            />
            <pre className="min-h-80 flex-1 overflow-auto whitespace-pre-wrap break-words bg-black/10 px-3 py-3 font-mono text-xs leading-relaxed text-foreground/90">
              {displayOutput ?? (
                <span className="text-muted-foreground">
                  {pending ? tp("output.pending") : tp("output.empty")}
                </span>
              )}
            </pre>
            <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-black/20 px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {selectedRun
                  ? tp("output.viewingRun", {
                      index:
                        runs.findIndex((run) => run.id === selectedRun.id) + 1,
                    })
                  : tp("output.latest")}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!displayOutput}
                onClick={() => {
                  if (displayOutput) {
                    void navigator.clipboard.writeText(displayOutput).catch(() => {})
                  }
                }}
                aria-label={tp("actions.copy")}
              >
                <Copy />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-3">
          <div className="grid grid-cols-[92px_1fr] gap-3 rounded-lg border border-white/10 bg-card/70 p-3">
            <CrewMascotPlaceholder character={echo} />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--brand-cyan)]">
                {tp("crew.label")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {note ?? tp("crew.defaultNote")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <TelemetryStat
              label={tp("telemetry.runs")}
              value={String(runs.length)}
            />
            <TelemetryStat
              label={tp("telemetry.prompt")}
              value={String(prompt.length)}
            />
            <TelemetryStat
              label={tp("telemetry.delta")}
              value={
                promptDelta === null
                  ? "--"
                  : `${promptDelta > 0 ? "+" : ""}${promptDelta}`
              }
            />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-card/70">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {tp("history.label")}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {tp("history.limit")}
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto p-2">
            {runs.length > 0 ? (
              <div className="space-y-2">
                {runs.map((run, index) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => setSelectedRunId(run.id)}
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left transition-colors",
                      selectedRunId === run.id
                        ? "border-[color:var(--brand-gold)]/50 bg-[color:var(--brand-gold)]/10"
                        : "border-white/10 bg-background/60 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--brand-cyan)]">
                        {tp("history.run", { index: index + 1 })}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                        <Clock3 className="size-3" />
                        {run.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {run.prompt}
                    </p>
                    <div className="mt-2 flex gap-3 font-mono text-[10px] text-muted-foreground">
                      <span>{tp("history.promptChars", { count: run.promptChars })}</span>
                      <span>{tp("history.outputChars", { count: run.outputChars })}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {tp("history.empty")}
              </p>
            )}
          </div>
        </div>
      </section>
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
    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/20 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border border-[color:var(--brand-cyan)]/25 text-[color:var(--brand-cyan)]">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
        {value}
      </p>
    </div>
  )
}

function TelemetryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-background/70 p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-bold text-[color:var(--brand-gold)]">
        {value}
      </p>
    </div>
  )
}
