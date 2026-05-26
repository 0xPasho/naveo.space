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
import { useEffect, useRef, useState, useTransition } from "react"

import { Button, Card } from "@/common/components/ui"
import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"
import { CAST } from "@/modules/cast/data"
import { CrewAvatar, isCrewSlug } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

import { DemoPresenterHeader } from "../_shared/presenter-header"

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
  const presenter = isCrewSlug(props?.presenter as string)
    ? (props?.presenter as CrewSlug)
    : null
  const intent = typeof props?.intent === "string" ? props.intent : null

  const t = useTranslations("lessons")
  const tp = useTranslations("lessons.playground")
  const tDossier = useTranslations("crew.dossier")
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

  // Guard against setState after unmount when a slow run resolves AFTER the
  // user navigates to the next step. The action itself can't be aborted
  // (server-action contract), but the awaiting client can drop the result.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const onRun = () => {
    if (!prompt.trim() || pending) return
    setError(null)
    setSelectedRunId(null)
    startTransition(async () => {
      try {
        const res = await runPlayground({ prompt })
        if (!mountedRef.current) return
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
        if (!mountedRef.current) return
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
      <Card className="overflow-hidden p-0">
        {presenter ? (
          <DemoPresenterHeader slug={presenter} intent={intent ?? undefined} />
        ) : null}
        <header className="flex items-start justify-between gap-3 border-b-2 border-line-soft bg-bg-sunken px-3 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-track-prompting">
              {tp("console.kicker")}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold leading-tight text-ink-1">
              {tp("console.title")}
            </h2>
          </div>
          <div
            className={cn(
              "rounded-md border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
              pending
                ? "border-track-prompting/40 text-track-prompting"
                : "border-stat-xp/30 text-stat-xp",
            )}
          >
            {pending ? tp("console.transmitting") : tp("console.ready")}
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="border-b-2 border-line-soft lg:border-b-0 lg:border-r-2">
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
                "bg-bg-sunken transition-opacity",
                pending && "cursor-wait opacity-70",
              )}
              placeholder={tp("prompt.placeholder")}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-line-soft bg-bg-sunken px-3 py-2">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                <Braces className="size-3 text-track-prompting" />
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
            <pre className="min-h-80 flex-1 overflow-auto whitespace-pre-wrap break-words bg-bg-sunken/50 px-3 py-3 font-mono text-xs leading-relaxed text-ink-1">
              {displayOutput ?? (
                <span className="text-ink-3">
                  {pending ? tp("output.pending") : tp("output.empty")}
                </span>
              )}
            </pre>
            <div className="flex items-center justify-between gap-2 border-t-2 border-line-soft bg-bg-sunken px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
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
                onClick={async () => {
                  if (!displayOutput) return
                  try {
                    await navigator.clipboard.writeText(displayOutput)
                  } catch {
                    // No toast library wired into the project yet — surface
                    // the failure through the same inline error slot the
                    // run path uses. Cleared on the next successful run.
                    if (mountedRef.current) setError(tp("actions.copyFailed"))
                  }
                }}
                aria-label={tp("actions.copy")}
              >
                <Copy />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <p className="rounded-lg border-2 border-danger/30 bg-danger-soft px-3 py-2 font-sans text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-3">
          <Card className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <CrewAvatar slug="echo" size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-xs font-bold leading-tight text-ink-1">
                  {echo.name}
                </div>
                <div className="truncate font-mono text-[9px] uppercase tracking-wider text-ink-3">
                  {tDossier(`${echo.slug}.roleShort` as never)}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-track-prompting">
                {tp("crew.label")}
              </span>
            </div>
            <p className="font-sans text-sm leading-relaxed text-ink-3">
              {note ?? tp("crew.defaultNote")}
            </p>
          </Card>

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

        <Card className="p-0">
          <div className="flex items-center justify-between border-b-2 border-line-soft px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">
              {tp("history.label")}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
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
                      "w-full rounded-md border-2 px-3 py-2 text-left transition-colors",
                      selectedRunId === run.id
                        ? "border-stat-xp/50 bg-stat-xp/10"
                        : "border-line-soft bg-bg-raised hover:bg-bg-sunken",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-track-prompting">
                        {tp("history.run", { index: index + 1 })}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-ink-3">
                        <Clock3 className="size-3" />
                        {run.createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 font-sans text-xs leading-relaxed text-ink-3">
                      {run.prompt}
                    </p>
                    <div className="mt-2 flex gap-3 font-mono text-[10px] text-ink-3">
                      <span>{tp("history.promptChars", { count: run.promptChars })}</span>
                      <span>{tp("history.outputChars", { count: run.outputChars })}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-8 text-center font-sans text-sm text-ink-3">
                {tp("history.empty")}
              </p>
            )}
          </div>
        </Card>
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

function TelemetryStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-bold text-stat-xp">
        {value}
      </p>
    </Card>
  )
}
