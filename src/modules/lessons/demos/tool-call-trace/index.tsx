"use client"

import {
  Cog,
  Lightbulb,
  type LucideIcon,
  MessageCircle,
  Play,
  RotateCcw,
  User,
  Wrench,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button, Card } from "@/common/components/ui"
import { PromptEditor } from "@/common/components/prompt-editor"
import { cn } from "@/common/lib/utils"
import { isCrewSlug } from "@/modules/crew"
import type { CrewSlug } from "@/modules/crew"

import { DemoPresenterHeader } from "../_shared/presenter-header"

type Turn =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string }
  | { role: "tool_call"; tool: string; args: Record<string, unknown> }
  | { role: "tool_result"; tool: string; result: string }

const isTurn = (v: unknown): v is Turn => {
  if (!v || typeof v !== "object") return false
  const r = v as Record<string, unknown>
  if (r.role === "user" || r.role === "assistant") {
    return typeof r.content === "string"
  }
  if (r.role === "tool_call") {
    return typeof r.tool === "string" && typeof r.args === "object" && r.args !== null
  }
  if (r.role === "tool_result") {
    return typeof r.tool === "string" && typeof r.result === "string"
  }
  return false
}

type Props = {
  props?: Record<string, unknown>
}

export default function ToolCallTraceDemo({ props }: Props) {
  const t = useTranslations("lessons.demos.toolCallTrace")
  const transcript =
    props && Array.isArray(props.transcript)
      ? (props.transcript as unknown[]).filter(isTurn)
      : []
  const forgeNotes =
    props && Array.isArray(props.forgeNotes)
      ? (props.forgeNotes as unknown[]).filter((n): n is string => typeof n === "string")
      : []
  const presenter = isCrewSlug(props?.presenter as string)
    ? (props?.presenter as CrewSlug)
    : "forge"
  const intent = typeof props?.intent === "string" ? props.intent : null

  const [revealedCount, setRevealedCount] = useState(1)

  if (transcript.length === 0) {
    return (
      <Card className="border-dashed px-4 py-6 text-sm text-ink-3">
        {t("missingTranscript")}
      </Card>
    )
  }

  const visible = transcript.slice(0, revealedCount)
  const isComplete = revealedCount >= transcript.length
  const onNext = () => setRevealedCount((c) => Math.min(c + 1, transcript.length))
  const onReset = () => setRevealedCount(1)

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
          <div className="rounded-md border-2 border-line-soft bg-bg-raised px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            {t("turnCounter", { n: revealedCount, total: transcript.length })}
          </div>
        </header>

        <ol className="space-y-2 bg-bg-sunken/50 p-3">
          {visible.map((turn, i) => (
            <li key={i} className="animate-attempt-pass">
              <TurnCard turn={turn} />
            </li>
          ))}
        </ol>

        <div className="flex items-center justify-between gap-2 border-t-2 border-line-soft bg-bg-sunken px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={revealedCount === 1}
          >
            <RotateCcw />
            {t("restart")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={isComplete}
          >
            <Play />
            {t("nextStep")}
          </Button>
        </div>
      </Card>

      {isComplete && forgeNotes.length > 0 ? (
        <Card className="animate-attempt-pass border-track-evals/30 bg-track-evals/5 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-track-evals">
            <Lightbulb className="mr-1 inline size-3" aria-hidden />
            {t("forgeNotesLabel")}
          </p>
          <ul className="mt-2 space-y-2 font-sans text-sm leading-relaxed text-ink-1">
            {forgeNotes.map((note, i) => (
              <li key={i} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-2 size-1 shrink-0 rounded-full bg-track-evals"
                />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  )
}

type RoleConfig = {
  label: string
  icon: LucideIcon
  borderClass: string
  textClass: string
  bgClass: string
}

function TurnCard({ turn }: { turn: Turn }) {
  const t = useTranslations("lessons.demos.toolCallTrace")

  const config: Record<Turn["role"], RoleConfig> = {
    user: {
      label: t("roleLabels.user"),
      icon: User,
      borderClass: "border-stat-xp/30",
      textClass: "text-stat-xp",
      bgClass: "bg-stat-xp/5",
    },
    assistant: {
      label: t("roleLabels.assistant"),
      icon: MessageCircle,
      borderClass: "border-track-prompting/30",
      textClass: "text-track-prompting",
      bgClass: "bg-track-prompting/5",
    },
    tool_call: {
      label: t("roleLabels.toolCall"),
      icon: Wrench,
      borderClass: "border-track-evals/40",
      textClass: "text-track-evals",
      bgClass: "bg-track-evals/5",
    },
    tool_result: {
      label: t("roleLabels.toolResult"),
      icon: Cog,
      borderClass: "border-line-strong",
      textClass: "text-ink-3",
      bgClass: "bg-bg-raised",
    },
  }

  const cfg = config[turn.role]
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border-2",
        cfg.borderClass,
        cfg.bgClass,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b-2 border-line-soft px-2.5 py-1.5">
        <div className={cn("flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]", cfg.textClass)}>
          <Icon className="size-3" aria-hidden />
          {cfg.label}
        </div>
        {turn.role === "tool_call" || turn.role === "tool_result" ? (
          <span className="font-mono text-[10px] tabular-nums text-ink-3">
            {turn.tool}
          </span>
        ) : null}
      </div>
      {turn.role === "tool_call" ? (
        <PromptEditor
          value={JSON.stringify(turn.args, null, 2)}
          readOnly
          language="json"
          minHeight={60}
          maxHeight={200}
          className="bg-transparent"
        />
      ) : (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words px-2.5 py-2 font-mono text-xs leading-relaxed text-ink-1">
          {turn.role === "tool_result" ? turn.result : turn.content}
        </pre>
      )}
    </div>
  )
}
